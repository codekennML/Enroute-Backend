import { NextFunction, Request, Response } from "express";
import AppError from "../errors/BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { tryCatch } from "../errors/tryCatch";
import { DRIVER_APP_ID, RIDER_APP_ID } from "../../config/constants/auth";
import { ROLES } from "../../config/enums";

export const assignRoleOnSignup = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {

    const appId = req.headers["app_id"];

    if (!appId) {
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );
    }

    if (appId === DRIVER_APP_ID) req.role = ROLES.DRIVER  

    if (appId === RIDER_APP_ID) req.role = ROLES.RIDER ;

    next();
  }
);

export default assignRoleOnSignup;
