import { StatusCodes, getReasonPhrase } from "http-status-codes";
import createAxiosInstance from "../config/axios";
import AppError from "../middlewares/errors/BaseError";
import { AxiosResponse } from "axios";
import PaymentRepository, { payDataLayer } from "../repository/payment";
import { IPay } from "../model/interfaces/index";
import { Paystack, TransferData, TransferRecipient } from "../../types/types";

import { ClientSession, PipelineStage, Types } from "mongoose";
import { criticalLogger } from "../middlewares/logging/logger";
import { QueryData } from "../repository/shared";

const paystackClient = createAxiosInstance({
  baseURL: "api.paystack.co",
  timeout: 5000,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET as string}`,
    "Content-Type": "application/json",
  },
});

type TransferItem = {
  amount: number;
  reference: string;
  recipient: string;
};

class PaymentService {
  private pay: PaymentRepository;

  constructor(payRepo: PaymentRepository) {
    this.pay = payRepo;
  }

  async createPayment(request: IPay, session?: ClientSession) {
    const createdPayment = await this.pay.createPayment(request, session);

    if (!createdPayment || createdPayment.length === 0)
      throw new AppError(
        `Error initializing payment`,
        StatusCodes.UNPROCESSABLE_ENTITY,
        `Error initializing payment for transaction : ${request.transactionId} -  amount : ${request.amount} `
      );

    return createdPayment;
  }

  async getPayments(request: QueryData) {
    const payments = await this.pay.findPayments(request);

    if (!payments || payments.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );
    return payments;
  }

  async aggregatePayments(request: PipelineStage[]) {
    return await this.pay.aggregatePayment(request);
  }

  async initializeTransaction(
    request: Pick<IPay, "email" | "amount"> & { id: string }
  ) {
    const response = await paystackClient.post(`transaction/initialize`, {
      email: request.email,
      amount: request.amount,
      reference: request.id,
    });

    //    if(response.status === 408) throw new AppError(``, StatusCodes.REQUEST_TIMEOUT )
    if (!response || response.status !== 200)
      throw new AppError(
        `Something went wrong. Please try again later.`,
        StatusCodes.BAD_GATEWAY,
        `Error initializing payment statuscode - ${response.status} -  message : ${response.statusText}`
      );

    const data: { authorizationUrl: string } = response.data;

    return { data, paymentId: request.id };
  }

  async validateAccountDetails(request: {
    account: number;
    bankCode: number;
  }): Promise<Paystack.AccountInfoResponse> {
    const response: AxiosResponse<Paystack.AccountInfoResponse> =
      await paystackClient.get(
        `/bank/resolve?account_number=${request.account}&bank_code=${request.bankCode}`
      );

    if (!response || response.status !== 200)
      throw new AppError(
        `Account verification failed`,
        StatusCodes.NOT_FOUND,
        `Account Information verification failed : - ${response.statusText}`
      );

    const accountData = response.data;
    return accountData;
  }

  async listBanks(
    next?: string,
    prev?: string,
    country?: string
  ): Promise<Paystack.BanksResponse> {
    const url = `
    /bank
    ${country && `?country=${country}`}
    ${prev && `?prev=${prev}`}
    ${next && `?next=${next}`}
    
    `;
    const response = await paystackClient.get(url);

    if (response.status !== 200)
      throw new AppError(
        `Error fetching banks`,
        StatusCodes.NOT_FOUND,
        `Paystack bank lists error`
      );

    return response.data;
  }

  async verifyTransaction(
    referenceId: string
  ): Promise<Paystack.VerifyResponse> {
    const response: AxiosResponse<Paystack.VerifyResponse> =
      await paystackClient.get(`/transaction/verify/${referenceId}`);

    if (!response || response.status !== 200)
      throw new AppError(
        `Something went wrong. Please try again later.`,
        StatusCodes.BAD_GATEWAY,
        `Error verifying payment - statuscode - ${response.status} -  message : ${response.statusText}`
      );

    return response.data;
  }

  async createTransferRecipient(
    request: TransferRecipient
  ): Promise<{ recipient: string; isActive: boolean }> {
    const result: AxiosResponse<Paystack.CreateTransferRecipientResponse> =
      await paystackClient.post("/transferrecipient", {
        type: "nuban",
        name: `${request.firstName} ${request.lastName}`,
        account_number: `${request.acct}`,
        bank_code: `${request.bankcode}`,
        currency: "NGN",
      });

    if (result.status !== 200)
      throw new AppError(
        `Something went wrong.Please try again`,
        StatusCodes.BAD_GATEWAY,
        `Error creating transfer recipient for user - ${request.user} `
      );

    return {
      recipient: result.data.data.recipient_code,
      isActive: result.data.data.is_deleted,
    };
  }

  async fetchBalance() {
    const result: AxiosResponse<Paystack.BalanceResponse> =
      await paystackClient.get("/balance");

    if (result.status !== 200)
      throw new AppError(
        `Error : Failure to retrieve ${
          process.env.COMPANY_NAME as string
        } paystack balance`,
        StatusCodes.BAD_GATEWAY,
        `Error fetching paystack integration balance`
      );

    const { data } = result.data;

    if (!data || data.length === 0)
      throw new AppError(
        `Error : Failure to retrieve ${
          process.env.COMPANY_NAME as string
        } paystack balances`,
        StatusCodes.BAD_GATEWAY,
        `Error fetching paystack integration balance`
      );

    return result;
  }

  async initiateTransfer(request: TransferData): Promise<{ success: boolean }> {
    const response: { success: boolean } = { success: false };

    //Before initiating a transfer , alway check that the paymentId does not exist and confirm that we are not sending a duplicate payment

    const { data } = (await this.fetchBalance()).data;

    if (data[0].balance < request.amount) {
      criticalLogger.info(
        `Payout Error : Insufficient Balance to payout requested amount - ${request.amount} for user with transferRef ${request.transferRef}`
      );

      throw new AppError(
        `Payout Error : Insufficient balance`,
        StatusCodes.FORBIDDEN
      );
    }

    const result: AxiosResponse<Paystack.TransferStatus> =
      await paystackClient.post("", {
        source: "balance",
        amount: request.amount,
        reason: request.reason,
        reference: request.paymentId,
        recipient: `${request.transferRef}`,
      });

    if (result.status === 200) {
      response.success = true;
    }

    //reqyest timed out
    if (result.status === 408) {
      //Verify the transaction first
      const result = await this.verifyTransaction(request.transferRef);
      //The verification endpoint takes care of the result if it is empty
      if (!result || result?.data?.status !== "success")
        throw new AppError(
          `Something went wrong.Please try again`,
          StatusCodes.BAD_GATEWAY,
          `Error initiating transfer for payout with paymentId  - ${request.paymentId} `
        );

      response.success = true;
    }

    return response;
  }

  async intiateBulkTransfer(transferData: TransferItem[]) {
    const result: AxiosResponse<Paystack.TransferStatus> =
      await paystackClient.post("/transfer/bulk", {
        source: "balance",
        currency: "NGN",
        transfers: transferData,
      });

    if (result.status === 404)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_GATEWAY),
        StatusCodes.BAD_GATEWAY
      );

    return { success: true, message: result.data.message };
  }

  async checkTransferAuthenticity(
    request: Paystack.TransferValidation
  ): Promise<boolean> {
    const { reference, amount } = request;

    const payments = await this.pay.findPayments({
      query: {
        _id: { $eq: new Types.ObjectId(reference) },
        amount,
      },
      select: "_id",
    });

    if (!payments || payments.length === 0 || payments[0]._id !== reference)
      return false;

    return true;
  }

  async handlePayHooks(
    hookInfo: Paystack.WebhookResponse,
    session?: ClientSession
  ) {
    const { event, data } = hookInfo;

    const returnInfo: {
      shouldGiveValue: boolean;
      shouldFail: boolean;
      data?: {
        status: string;
        amount: number;
        payId: string;
        transactionId: string;
        user: string;
      };
      type?: "refund" | "withdrawal" | "deposit";
    } = { shouldGiveValue: false, shouldFail: false };

    switch (event) {
      case "charge.success" || "charge.failed": {
        //Check if this has been processed already
        const payment = await this.pay.findPayments({
          query: { _id: data.reference },
          select: "processed status autoRetries manualRetries",
          session,
        });

        if (!payment || !Array.isArray(payment))
          throw new AppError(
            `Payment not found`,
            StatusCodes.BAD_REQUEST,
            `Paystack webhook error -  No payment found matching the reference - ${data.reference}`
          );

        if (payment[0]?.processed && payment[0]?.status === "success") break;

        //Verify the payment before giving value

        const updatedPayment = await this.pay.updatePayment({
          docToUpdate: {
            _id: { $eq: data.reference },
          },
          updateData: {
            $set: {
              processed: true,
              status: data.status === "success" ? "success" : "failed",
            },
          },
          options: {
            new: true,
            session,
            select: "status amount type transactionId creator",
          },
        });

        if (!updatedPayment || updatedPayment.amount !== data.amount)
          throw new AppError(
            `Something went wrong`,
            StatusCodes.UNPROCESSABLE_ENTITY,
            `Paystack webhook  error - updating user charge ${data.status} value - user : ${data.reference}`
          );

        if (event === "charge.success") {
          returnInfo.shouldGiveValue = true;
          returnInfo.shouldFail = false;
        } else {
          returnInfo.shouldFail = true;
        }

        returnInfo.data = {
          payId: data.reference,
          amount: updatedPayment.amount,
          status: data.status,
          transactionId: updatedPayment.transactionId.toString(),
          user: updatedPayment.creator.toString(),
        };

        returnInfo.type = "deposit";
        break;
      }

      case "transfer.success": {
        //Check if this has been processed already
        const payment = await this.pay.findPayments({
          query: { _id: data.reference },
          select: "processed",
          session,
        });

        if (!payment || !Array.isArray(payment))
          throw new AppError(
            `Payment not found`,
            StatusCodes.BAD_REQUEST,
            `Paystack webhook error -  No payment found matching the reference - ${data.reference}`
          );

        if (payment[0].processed && payment[0].status === "success") break;

        // type Usrrs =  Prettify<IPayModel

        const updatedPayment = await this.pay.updatePayment({
          docToUpdate: {
            _id: { $eq: data.reference },
          },
          updateData: {
            $set: {
              processed: true,
              status: "success",
            },
          },
          options: {
            new: true,
            session,
            select: "status amount transactionId receiver",
          },
        });

        if (!updatedPayment)
          throw new AppError(
            `Something went wrong`,
            StatusCodes.UNPROCESSABLE_ENTITY,
            `Paystack webhook  error - updating user charge ${data.status} value - user : ${data.reference}`
          );

        returnInfo.shouldGiveValue = true;
        returnInfo.data = {
          amount: updatedPayment.amount,
          status: data.status,
          payId: data.reference,
          transactionId: updatedPayment.transactionId.toString(),
          user: updatedPayment.receiver.toString(),
        };
        returnInfo.type = "withdrawal";
        break;
      }

      //Here we need to have exhausted all auto and manual retries before marking a transaction as failed

      case "transfer.failed" || "transfer.reversed": {
        //Check if this has been processed already
        const payment = await this.pay.findPayments({
          query: { _id: data.reference },
          select: "processed autoRetries manualRetries",
          session,
        });

        if (!payment || !Array.isArray(payment))
          throw new AppError(
            `Payment not found`,
            StatusCodes.BAD_REQUEST,
            `Paystack webhook error -  No payment found matching the reference - ${data.reference}`
          );

        if (payment[0].processed && payment[0].status === "success") break;

        let updateData: Record<string, string | object | boolean> = {
          $set: { processed: true, status: "queued" },
        };

        if (payment[0].autoRetries < 3)
          updateData = { ...updateData, $inc: { autoRetries: 1 } };

        if (payment[0].autoRetries === 3)
          updateData = { $set: { status: "requires_action" } };

        if (payment[0].manualRetries < 2)
          updateData = { ...updateData, $inc: { manualRetries: 1 } };

        if (payment[0].autoRetries === 3 && payment[0].manualRetries === 2) {
          updateData = { $set: { status: "failed" } };
          //Mark this as failed and refund the user so they can retry again
          returnInfo.shouldGiveValue = true;
        }

        // type Usrrs =  Prettify<IPayModel

        const updatedPayment = await this.pay.updatePayment({
          docToUpdate: {
            _id: { $eq: data.reference },
          },
          updateData,
          options: {
            new: true,
            session,
            select: "status amount transactionId receiver ",
          },
        });

        if (!updatedPayment)
          throw new AppError(
            `Something went wrong`,
            StatusCodes.UNPROCESSABLE_ENTITY,
            `Paystack webhook  error - updating ${data.status} transfer value - payment : ${data.reference}`
          );

        returnInfo.shouldFail = true;
        returnInfo.data = {
          amount: updatedPayment.amount,
          status: data.status,
          payId: data.reference,
          transactionId: updatedPayment.transactionId.toString(),
          user: updatedPayment.receiver.toString(),
        };
        returnInfo.type = "withdrawal";

        break;
      }

      default:
        throw new AppError(
          `Unnecessary event received`,
          StatusCodes.BAD_REQUEST,
          `Unused Paystack hook received - event : ${event}`
        );
    }

    return returnInfo;
  }

  //Cron jon

  async handlePendingOrFailedPayments() {}
}

export const PaymentServiceLayer = new PaymentService(payDataLayer);

export default PaymentService;
