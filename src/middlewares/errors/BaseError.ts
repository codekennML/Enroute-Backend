import { ZodIssue } from "zod"

class AppError extends Error {

  public loggerMessage?: string;
  public statusCode: number;
  public reason?: Record<string, string>
  // ZodIssue[]

  constructor(
    message: string,
    statusCode: number,
    loggerMessage?: string,
    reason?: Record<string, string>
    // ZodIssue[]
  ) {
    super(message);
    this.loggerMessage = loggerMessage;
    this.statusCode = statusCode;
    this.reason = reason;
    // Capture the stack trace
    Error.captureStackTrace(this, this.constructor);
  }

}

export default AppError;
