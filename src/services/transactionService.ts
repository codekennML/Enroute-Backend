import { ClientSession, PipelineStage } from "mongoose";
import TransactionRepository, {
  TransactionDataLayer,
} from "../repository/mongo/transactions";
import { UpdateRequestData } from "../../types/types";
import AppError from "../middlewares/errors/BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { ITransactionModel } from "../model/transactions";
import { ITransaction } from "../model/interfaces/index";
import { QueryData } from "../repository/mongo/shared";

class TransactionService {
  private transactionDataLayer: TransactionRepository;

  constructor(transaction: TransactionRepository) {
    this.transactionDataLayer = transaction;
  }
  async createTransaction(
    request: ITransaction,
    session?: ClientSession
  ): Promise<ITransactionModel> {
    const transaction = await this.transactionDataLayer.createTransaction(
      request,
      session
    );

    return transaction[0];
  }

  async updateTransaction(
    request: UpdateRequestData
  ): Promise<ITransactionModel> {
    const updatedTransaction =
      await this.transactionDataLayer.updateTransaction(request);

    if (!updatedTransaction)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNPROCESSABLE_ENTITY),
        StatusCodes.UNPROCESSABLE_ENTITY,
        `Error  creating transaction with data - ${request} `
      );

    return updatedTransaction;
  }

  async getTransactions(query: QueryData) {
    const transactions = await this.transactionDataLayer.getTransactions(query);
    return transactions;
  }

  async aggregateTransaction(request: PipelineStage[]) {
    return await this.transactionDataLayer.aggregateTransaction(request);
  }
}

export const TransactionServiceLayer = new TransactionService(
  TransactionDataLayer
);

export default TransactionService;
