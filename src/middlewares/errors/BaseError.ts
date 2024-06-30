import { ZodIssue} from "zod"

class AppError extends Error {

  public loggerMessage?: string;
  public statusCode: number;
  public reason?: ZodIssue[]

  constructor(
    message: string,
    statusCode: number,
    loggerMessage?: string,
    reason?: ZodIssue[]
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
