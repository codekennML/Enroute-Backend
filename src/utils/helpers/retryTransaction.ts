import mongoose, { ClientSession } from "mongoose";
import {
  // TransactionError,
  // TransactionSuccess,
  TransactionResponse,
  TransactionError,
} from "../../../types/types";

export function hasError<T>(
  response: TransactionResponse<T>
): response is TransactionError {
  return !response.success;
}

export const retryTransaction = async <T, U>(
  baseFunction: (args: T, session: ClientSession) => Promise<U>,
  retryCount: number,
  args: T
) => {
  let retries = 0;
  let processingError: Error | undefined;

  while (retries < retryCount) {
    const session = await mongoose.startSession();
    try {
      const result = await baseFunction(args, session);
      await session.commitTransaction();
      return result;
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
