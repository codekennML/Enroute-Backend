import { Request, Response } from "express";

import { logEvents } from "./logger";
import AppError from "./BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

const errorHandler = (err: Error | AppError, req: Request, res: Response) => {
  const response = {
    message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  };

  let logMessage = `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`;

  if (err instanceof AppError) {
    response.message = err.message;
    response.statusCode = err.statusCode;
    logMessage += `\t${err.loggerMessage}`;
  }

  console.log(err.stack);

  logEvents(logMessage, "errLog.log");

  const status = response.statusCode;
  res.status(status);
  res.json(response);
};

export default errorHandler;
