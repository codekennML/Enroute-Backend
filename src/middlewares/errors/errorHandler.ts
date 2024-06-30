import { NextFunction, Request, Response } from "express";

import { logEvents } from "./logger";
import AppError from "./BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

const errorHandler = (err: Error | AppError, req: Request, res: Response, next : NextFunction) => {


  
  const response = {
    message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    ...(err instanceof AppError && err?.reason && { errors : err.reason })
  };

  let logMessage = `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}\t${err?.stack}`;

  if (err instanceof AppError) {
    response.message = err.message;
    response.statusCode = err.statusCode;
    logMessage += `\t${err.loggerMessage}`;
  
  }

  logEvents(logMessage, "errLog.log")
  console.log(logMessage)
 

  const status = response.statusCode;
  res.status(status).json(response);
};

export default errorHandler;
