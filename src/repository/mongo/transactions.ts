import Transaction, { ITransactionModel } from "../../model/transactions";
import { ITransaction } from "../../model/interfaces";
import DBLayer from "./shared";
import { ClientSession, Model, PipelineStage } from "mongoose";
import { QueryData, PaginationRequestData } from "./shared";

class TransactionRepository {
  private transactionDBLayer: DBLayer<ITransactionModel>;

  constructor(model: Model<ITransactionModel>) {
    this.transactionDBLayer = new DBLayer<ITransactionModel>(model);
  }

  async createTransaction(
    request: ITransaction,
    session?: ClientSession
  ): Promise<ITransactionModel[]> {
    let createdTransactions: ITransactionModel[] = [];

    createdTransactions = await this.transactionDBLayer.createDocs(
      [request],
      session
    );

    return createdTransactions;
  }

  //This returns a non-paginated array  of transactions
  async getTransactions(request: QueryData) {
    const transactions = await this.transactionDBLayer.findDocs(request);
    return transactions;
  }

  async returnPaginatedTransactions(request: PaginationRequestData) {
    const paginatedTransactions = await this.transactionDBLayer.paginateData(
      request
    );

    return paginatedTransactions;
  }

  async updateTransaction(request: {
    docToUpdate: { [key: string]: Record<"$eq", string> };
    updateData: { [k: string]: string | object | boolean };
    options: {
      new?: boolean;
      session?: ClientSession;
      select?: string;
      upsert?: boolean;
    };
  }) {
    const updatedTransaction = await this.transactionDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedTransaction;
  }

  async aggregateTransaction(request: PipelineStage[]) {
    return await this.transactionDBLayer.aggregateDocs(request);
  }
}

export const TransactionDataLayer = new TransactionRepository(Transaction);

export default TransactionRepository;
