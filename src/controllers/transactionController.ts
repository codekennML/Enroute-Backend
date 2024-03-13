import { HttpResponse } from "uWebsockets.js";
import TransactionService, {
  TransactionServiceLayer,
} from "../services/transactionService";
import { PaymentServiceLayer } from "../services/paymentService";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import { readJSON } from "../utils/helpers/decodePostJSON";
import { ClientSession, Types } from "mongoose";
import UserService from "../services/userService";
import { ADMINROLES, SUBROLES, USER } from "../config/enums";
import { criticalLogger } from "../model/logging/logger";

class TransactionController {
  protected transaction: TransactionService;

  constructor(transaction: TransactionService) {
    this.transaction = transaction;
  }

  async depositToAccount(res: HttpResponse) {
    //Get the user
    //Create the transaction
    //Call the payment service to initialize the transaction
    //Return payment Link

    type DepositData = {
      amount: number;
      user: string;
      email: string;
    };

    const data = await readJSON<DepositData>(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error decoding post data`
      );

    const basefn = async (request: DepositData, session: ClientSession) => {
      const { amount, user, email } = request;

      let result!: {
        success: boolean;
        data: { authorizationUrl: string; paymentId: string };
      };

      await session.withTransaction(async () => {
        //Create the transaction

        const transaction = await this.transaction.createTransaction(
          {
            creator: new Types.ObjectId(user),
            receiver: new Types.ObjectId(
              process.env.COMPANY_ACCOUNT_ID as string
            ),
            type: "deposit",
            amount,
            status: "processing",
            class: "credit",
          },
          session
        );

        const payment = await PaymentServiceLayer.createPayment({
          transactionId: transaction._id,
          creator: new Types.ObjectId(request.user),
          receiver: new Types.ObjectId(process.env.COMPANY_ACCOUNT_ID),
          processed: false,
          type: "deposit",
          status: "created",
          currency: "NGN",
          amount,
          email,
          autoRetries: 0,
          manualRetries: 0,
        });

        if (!payment || !payment[0])
          throw new AppError(
            getReasonPhrase(StatusCodes.UNPROCESSABLE_ENTITY),
            StatusCodes.UNPROCESSABLE_ENTITY
          );

        const response = await PaymentServiceLayer.initializeTransaction({
          id: payment[0]._id,
          amount,
          email,
        });

        result = {
          success: true,
          data: {
            authorizationUrl: response.data.authorizationUrl,
            paymentId: response.paymentId,
          },
        };

        await session.commitTransaction();
      });

      return result;
    };

    const response = await retryTransaction<DepositData>(basefn, 1, data);

    return { status: StatusCodes.CREATED, data: response };
  }

  async withdrawFromAccount(res: HttpResponse) {
    //Check the balance for the user
    //Check if balance can fly
    //Create dwithdrawal transaction
    //Send a your withdrawal is on the way back
    type WithdrawalData = {
      user: string;
      amount: number;
      transferRef: string;
    };

    const data = await readJSON<WithdrawalData>(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error decoding login  post data`
      );

    const basefn = async (request: WithdrawalData, session: ClientSession) => {
      const { amount, user, transferRef } = request;

      let response!: { success: boolean; data: { transaction: string } };

      await session.withTransaction(async () => {
        //Check user balance
        const userData = await UserService.getUserInfo(
          user,
          "balance _id transferRef roles transferRef",
          session
        );

        if (user !== userData._id)
          throw new AppError(
            getReasonPhrase(StatusCodes.FORBIDDEN),
            StatusCodes.FORBIDDEN,
            `Withdrawal error - UserID mismatch `
          );

        if (amount > userData.balance)
          throw new AppError("Insufficient funds.", StatusCodes.FORBIDDEN);

        if (userData.roles === USER.driver && userData.balance < 3000)
          throw new AppError(
            `Your balance needs to be greater than 3000 to withdraw`,
            StatusCodes.FORBIDDEN
          );

        //TODO : Handle User withdrawal
        // if (userData.roles === USER.rider && userData.balance < 1000) {
        // }

        //Create withdrawal transaction

        const transaction = await this.transaction.createTransaction({
          receiver: new Types.ObjectId(user),
          creator: new Types.ObjectId(process.env.ADMIN_ID as string),
          type: "payout",
          amount: amount,
          approved: false,
          systemApproved: false,
          status: "processing",
          userTransferRef: transferRef,
          fraudulent: false,
          class: "debit",
          // userPaymentRef : userData.transferRef
        });

        //Reduce User Balance
        await UserService.updateUser({
          docToUpdate: { _id: { $eq: userData._id } },
          updateData: {
            $inc: {
              balance: -amount,
            },
          },
          options: { new: false, session },
        });

        response.success = true;
        response.data = { transaction: transaction._id };

        await session.commitTransaction();
      });

      return response;
    };

    const response = await retryTransaction<WithdrawalData>(basefn, 1, data);

    if (!response || !response?.success)
      throw new Error(`Something went wrong`);

    return { status: StatusCodes.OK, data: response };
  }

  async approveWithdrawalTransaction(res: HttpResponse) {
    type ApprovalData = {
      userId: string;
      clientIp: string;
      clientDevice: string;
      transactionId: string;
    };

    const data = await readJSON<ApprovalData>(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error decoding login  post data`
      );

    const basefn = async (request: ApprovalData, session: ClientSession) => {
      const { userId, clientIp, clientDevice, transactionId } = request;

      let response!: { success: boolean };

      await session.withTransaction(async () => {
        const user = await UserService.getUserInfo(
          userId,
          "_id roles account subRole"
        );

        if (!user)
          throw new AppError(
            `Something went wrong. Please try again later`,
            StatusCodes.NOT_FOUND,
            `Withdrawal approval  error - Unable to fetch approving user with id - ${userId} `
          );

        if (
          (user.roles !== ADMINROLES.ACCOUNT ||
            (user.roles === ADMINROLES.ACCOUNT &&
              user.subRole === SUBROLES.INTERN)) &&
          user.roles !== ADMINROLES.MAIN
        ) {
          //Log an authorized payment approval request

          criticalLogger.info(
            `Attempt to approve withdrawal from unauthorized personnel -  user :  ${userId} - ip : ${clientIp} - device : ${clientDevice} `
          );

          throw new AppError(
            `You do not possess sufficient privilege to perform this action`,
            StatusCodes.FORBIDDEN
          );
        }

        const transactionData = await this.transaction.updateTransaction({
          docToUpdate: { _id: { $eq: transactionId } },
          updateData: {
            $set: {
              approved: true,
              approvedBy: user,
            },
          },
          options: { new: true, session, select: "_id amount creator" },
        });

        //Create a payment that needs to be approved

        await PaymentServiceLayer.createPayment({
          transactionId: new Types.ObjectId(transactionId),
          userPaymentRef: transactionData.userTransferRef!,
          creator: new Types.ObjectId(process.env.COMPANY_ACCOUNT_ID)!,
          receiver: transactionData.creator,
          type: "withdrawal",
          amount: transactionData.amount,
          status: "created",
          approved: false,
          autoRetries: 1,
          manualRetries: 1,
        });

        response.success = true;

        await session.commitTransaction();
      });

      return response;
    };

    const response = await retryTransaction<ApprovalData>(basefn, 1, data);

    return {
      status: StatusCodes.OK,
      data: {
        success: response.success,
        message: "Withdrawal approved successfully",
      },
    };
  }

  async fetchTransactions() {}

  async calculateBalance(user: string) {
    const aggregatePipeline = [
      {
        $match: {
          _id: { $eq: user },
        },
      },
      {
        $group: {
          _id: "$class",
          total: {
            $sum: {
              $cond: [
                { $eq: ["$class", "credit"] },
                "$amount",
                { $multiply: ["$amount", -1] }, // Subtract debit
              ],
            },
          },
        },
      },
      {
        $project: {
          total: 1,
        },
      },
    ];

    const balance = await this.transaction.aggregateTransaction(
      aggregatePipeline
    );

    return balance;
  }
}

export const TransactionControl = new TransactionController(
  TransactionServiceLayer
);

export default TransactionController;
