import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { ADMINROLES, SUBROLES } from "../config/enums";
import AppError from "../middlewares/errors/BaseError";
import { UserServiceLayer } from "../services/userService";
// import { retryTransaction } from "../utils/helpers/retryTransaction";
import PaymentService, {
  PaymentServiceLayer,
} from "../services/paymentService";
import crypto from "node:crypto";
import { HttpRequest, HttpResponse } from "uWebsockets.js";
import { readJSON } from "../utils/helpers/decodePostJSON";
import { Paystack, TransferData, TransferRecipient } from "../../types/types";
import { ClientSession, Types } from "mongoose";
import { TransactionServiceLayer } from "../services/transactionService";
import { retryTransaction } from "../utils/helpers/retryTransaction";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET as string;

class PaymentController {
  private payService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.payService = paymentService;
  }

  async handlePaystackWebhooks(req: HttpRequest, res: HttpResponse) {
    const data: Paystack.WebhookResponse = await readJSON(res);

    //validate event
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(data))
      .digest("hex");

    if (hash !== req.getHeader("x-paystack-signature"))
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED,
        `Paystack Webhook event error - Foreign request detected / received`
      );

    const response = await retryTransaction(
      this.handlePaystackHooksTransaction,
      1,
      data
    );

    return { status: StatusCodes.OK, data: { message: response } };
  }

  async handlePaystackHooksTransaction(
    request: Paystack.WebhookResponse,
    session: ClientSession
  ) {
    const result: { success: boolean } = { success: true };

    await session.withTransaction(async () => {
      const response = await this.payService.handlePayHooks(request, session);

      if (response.shouldGiveValue && response.type === "deposit") {
        //Update the transaction status
        await TransactionServiceLayer.updateTransaction({
          docToUpdate: { _id: { $eq: response.data?.transactionId } },
          updateData: {
            $set: {
              status: "success",
            },
          },
          options: { new: false },
        });
      }

      if (response.type === "deposit" && response.shouldFail) {
        //mark the transaction as failed

        await TransactionServiceLayer.updateTransaction({
          docToUpdate: { _id: { $eq: response.data?.transactionId } },
          updateData: {
            $set: {
              status: "failed",
            },
          },
          options: { session, new: true, select: "status" },
        });
      }

      if (
        response.type === "withdrawal" &&
        response.shouldGiveValue &&
        !response.shouldFail
      ) {
        //Mark the transaction as failed

        await TransactionServiceLayer.updateTransaction({
          docToUpdate: { _id: { $eq: response.data?.transactionId } },
          updateData: {
            $set: {
              status: "success",
            },
          },
          options: { session, new: true, select: "status" },
        });

        //  Bulkwrite here -  insert one and updateOne
      }

      //Note  we do not handle failed transactions until all manual and automatic retries are exhausted and the transaction still fails., in which case the transaction is marked as failed

      if (
        response.type === "withdrawal" &&
        response.shouldGiveValue &&
        response.shouldFail
      ) {
        await TransactionServiceLayer.updateTransaction({
          docToUpdate: { _id: { $eq: response.data?.transactionId } },
          updateData: {
            $set: {
              status: "failed",
            },
          },
          options: { session, new: true, select: "status" },
        });

        //update the transaction status to success
      }

      await session.commitTransaction();
    });

    return result;
  }

  async approvePayouts(request: {
    payment: { ids: string[]; total: number };
    user: string;
  }) {
    const { payment, user } = request;

    //Update the payment with the userId of the approving admin

    const userInfo = await UserServiceLayer.getUserInfo(user, "roles subrole");

    if (
      (userInfo.roles !== ADMINROLES.ACCOUNT &&
        userInfo.subRole !== SUBROLES.INTERN) ||
      userInfo.roles !== ADMINROLES.MAIN
    )
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );

    const aggregationPipeline = [
      {
        $match: {
          _id: { $in: payment.ids },
        },
      },
      {
        $set: {
          approved: true,
          approvedBy: user,
          status: "queued", //
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ];

    const payments = await this.payService.aggregatePayments(
      aggregationPipeline
    );

    return { status: StatusCodes.OK, data: payments };
  }

  async validateTransfer(res: HttpResponse) {
    const data = await readJSON<Paystack.TransferValidation>(res);

    if (!data || !data?.reference || !data?.amount)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const isValidTransferRequest =
      await this.payService.checkTransferAuthenticity(data);

    if (!isValidTransferRequest)
      return { status: StatusCodes.BAD_REQUEST, data: {} };

    return { status: StatusCodes.OK, data: {} };
  }

  async addCardToUserData(res: HttpResponse) {
    type CardDataInfo = {
      authorization: Paystack.Authorization;
      customer: Paystack.Customer;
    };

    const data = await readJSON<CardDataInfo & { user: string }>(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error adding debit card`
      );

    const updatedUser = await UserServiceLayer.updateUser({
      docToUpdate: { _id: { $eq: data.user } },
      updateData: {
        $set: {
          paymentMethod: {
            authorization: data.authorization,
            cus_info: data.customer,
          },
        },
      },
      options: { new: true, select: "_id" },
    });

    return { status: StatusCodes.OK, data: { user: updatedUser } };
  }

  async createTransferRecipient(res: HttpResponse) {
    const data = await readJSON<TransferRecipient>(res);

    const response = await this.payService.createTransferRecipient(data);

    const userData = await UserServiceLayer.updateUser({
      docToUpdate: { _id: { $eq: new Types.ObjectId(data.user) } },
      updateData: {
        $push: {
          userTransferRef: response.recipient,
        },
      },
      options: { new: true, select: "_id" },
    });

    return { status: StatusCodes.CREATED, data: userData };
  }

  async transferFunds(res: HttpResponse) {
    const data = await readJSON<TransferData>(res);

    const response = await this.payService.initiateTransfer(data);

    if (!response || !response.success)
      return {
        status: StatusCodes.BAD_REQUEST,
        data: { message: "Transfer initialization failed" },
      };

    return {
      status: StatusCodes.OK,
      data: { messge: "Transfer initialized successfully" },
    };

    // async approveBulkTransfers(request: {
    //   payment: { ids: string[]; total: number };
    //   user: string;
    // }) {
    //   const { payment, user } = request;

    //   //Update the payment with the userId of the approving admin

    //   const userInfo = await UserService.getUserInfo(user, "roles subrole");

    //   if (
    //     (userInfo.roles !== ADMINROLES.ACCOUNT &&
    //       userInfo.subRole !== SUBROLES.INTERN) ||
    //     userInfo.roles !== ADMINROLES.MAIN
    //   )
    //     throw new AppError(
    //       getReasonPhrase(StatusCodes.FORBIDDEN),
    //       StatusCodes.FORBIDDEN
    //     );

    //   const { data } = (await this.payService.fetchBalance()).data;

    //   if (data[0].balance < payment.total) {
    //     criticalLogger.info(
    //       `Payout Error : Insufficient Balance to payout total requested amount - ${payment.total} `
    //     );

    //     throw new AppError(
    //       `Payout Error : Insufficient balance to payout total request amount of ${payment.total}`,
    //       StatusCodes.FORBIDDEN
    //     );
    //   }

    //   // Batch size
    //   const batchSize = 100;
    //   // Function to process a batch
    //   const processBatch = async (batch: string[], user: string) => {
    //     //Update the transactions
    //     // const idsInBatch: string[] = [];

    //     const aggregationPipeline = [
    //       {
    //         $match: {
    //           _id: { $in: batch },
    //         },
    //       },
    //       {
    //         $set: {
    //           approved: true,
    //           approvedBy: user,
    //         },
    //       },
    //       {
    //         $project: {
    //           _id: 1,

    //           userPaymentRef: 1,
    //           userTransferRef: 1,
    //           amount: 1,
    //           recipient: 1,
    //         },
    //       },
    //     ];

    //     //TODO : Send this to the queue for processing

    //     const payments = await this.payService.aggregatePayments(
    //       aggregationPipeline
    //     );
    //     // Process the updated documents
    //     const transferArray: TransferItem[] = payments.map((payment) => ({
    //       amount: payment.amount,
    //       reference: payment._id,
    //       recipient: payment.recipient,
    //     }));

    //     //push the data into the queue for processing.
    //     paymentQueue.addJob({
    //       name: `${new Date()}-payout-${user.slice(8)}`,
    //       data: transferArray,
    //     });
    //   };

    //   // Loop through the array in batches
    //   for (let i = 0; i < payment.ids.length; i += batchSize) {
    //     const batch = payment.ids.slice(i, i + batchSize);

    //     setTimeout;

    //     processBatch(batch, user);
    //   }

    //   // If the array size is not a multiple of batchSize, there may be a smaller last batch to process
    //   const remainingItems = payment.ids.length % batchSize;
    //   if (remainingItems > 0) {
    //     const lastBatch = payment.ids.slice(payment.ids.length - remainingItems);
    //     processBatch(lastBatch, user);
    //   }
    // }
  }
}
export const PaymentControl = new PaymentController(PaymentServiceLayer);

export default PaymentController;
