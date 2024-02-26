import mongoose, { ClientSession } from "mongoose";
import {
  // TransactionError,
  TransactionSuccess,
  TransactionResponse,
} from "../../../types/types";

function isTransactionSuccess<T>(
  response: TransactionResponse<T>
): response is TransactionSuccess<T> {
  return response.success;
}

export const retryTransaction = async <T, U>(
  baseFunction: (
    args: T,
    session: ClientSession
  ) => Promise<TransactionResponse<U>>,
  retryCount: number,
  args: T
): Promise<U | string> => {
  let retries = 0;
  let processingError: Error | undefined;

  while (retries < retryCount) {
    const session = await mongoose.startSession();

    try {
      const result = await baseFunction(args, session);

      if (isTransactionSuccess(result)) return result.data;

      return result.errorMsg;

      // handleTransactionError(result);
    } catch (error: unknown) {
      processingError = error as Error;
      retries++;
    } finally {
      session.endSession();
    }
  }
  throw processingError;
  // return processingError || new Error("All retry attempts failed");
};
