import { HttpRequest, HttpResponse } from "uWebsockets.js";

import AppError from "../../middlewares/errors/BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

const MAX_BODY_SIZE = 2 ** 20; // 1MB

type BaseFunction = (
  res: HttpResponse,
  req: HttpRequest
) => Promise<{ status: number; data: object }>;

const responseHandler = (
  basefn: BaseFunction
  // res: HttpResponse,
  // req: HttpRequest
) => {
  return async (res: HttpResponse, req: HttpRequest) => {
    res.onAborted(() => {
      res.aborted = true;
    });
    console.log(this, "result-ahiiidd");

    if (!res.aborted) {
      let response: {
        status: StatusCodes;
        data?: object;
        errMsg?: string;
        error?: boolean;
      };

      try {
        response = await basefn(res, req);
      } catch (error) {
        console.log("log", error);
        if (error instanceof AppError) {
          response = {
            errMsg: error.message,
            status: error.statusCode,
            error: true,
          };
        } else {
          response = {
            error: true,
            errMsg: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          };
        }
      }

      res.cork(() => {
        res
          .writeStatus(JSON.stringify(response.status))
          .end(JSON.stringify(response?.data ?? response.errMsg));
      });
    }
  };
};

export function readJSON<T>(res: HttpResponse): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const buffer: Buffer[] = [];

    res.onData((dataChunk: ArrayBuffer, isLast: boolean) => {
      const chunk = Buffer.from(dataChunk);

      if (isLast) {
        try {
          if (buffer.length > 0) {
            buffer.push(chunk);
            const concatenatedBuffer = Buffer.concat(buffer);
            if (concatenatedBuffer.length > MAX_BODY_SIZE) {
              throw new Error("Payload too large");
            }
            const jsonString = concatenatedBuffer.toString("utf-8");
            const json = JSON.parse(jsonString);
            resolve(json);
          } else {
            if (chunk.length > MAX_BODY_SIZE) {
              throw new Error("Payload too large");
            }
            const json = JSON.parse(chunk.toString("utf-8"));
            resolve(json);
          }
        } catch (e) {
          // Log or handle the error
          console.error("Error parsing JSON:", e);
          reject(e);
        }
      } else {
        buffer.push(chunk);
      }
    });
  });
}
export default responseHandler;
