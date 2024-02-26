import { HttpRequest, HttpResponse } from "uWebsockets.js";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../../middlewares/errors/BaseError";

export const tryCatch =
  async (
    controller: (
      res: HttpResponse,
      req: HttpRequest,
      requestBody?: Record<string, string | object>
    ) => Promise<{ status: number; data: object }>
  ) =>
  async (
    res: HttpResponse,
    req: HttpRequest,
    requestBody?: Record<string, string | object>
  ): Promise<{
    error?: boolean;
    status: number;
    data?: object;
    errMsg?: string;
  }> => {
    try {
      // throw new AppError("Wrong account", "User supplies wrong account", "403" )
      //
      const result = await controller(res, req, requestBody);
      return result;
    } catch (error: unknown) {
      //TODO : Log the error to the logger here

      if (error instanceof AppError) {
        return {
          errMsg: error.message,
          status: error.statusCode,
          error: true,
        };
      } else {
        return {
          error: true,
          errMsg: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),

          status: StatusCodes.INTERNAL_SERVER_ERROR,
        };
      }
    }
  };

module.exports = tryCatch;
