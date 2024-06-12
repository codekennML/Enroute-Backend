import { format } from "date-fns";
import uuid from "uuid";
import fs from "node:fs";
import path from "node:path";
import { NextFunction, Request, Response } from "express";
import AppError from "./BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
const fsPromises = fs.promises;
const { v4 } = uuid

export const logEvents = async (message: string, logFileName: string) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
  const logItem = `${dateTime}\t${v4()}\t${message}\n`;

  try {
    if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
      await fsPromises.mkdir(path.join(__dirname, "..", "logs"));
    }
    await fsPromises.appendFile(
      path.join(__dirname, "..", "logs", logFileName),
      logItem
    );
  } catch (err) {
    throw new AppError(
      getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      StatusCodes.INTERNAL_SERVER_ERROR, "Error: Log directory creation failed")
  }
};

export const logger = (req: Request, res: Response, next: NextFunction) => {
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log");
  console.log(`${req.method} ${req.path}`);
  next();
};
