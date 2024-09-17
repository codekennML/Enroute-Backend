
import { NextFunction, Request, Response } from "express";
import AppError from "../errors/BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { tryCatch } from "../errors/tryCatch";
import { DRIVER_APP_ID, RIDER_APP_ID } from "../../config/constants/auth";
import { ROLES } from "../../config/enums";

export const assignRoleOnSignup = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {

    const appId = req.headers["app_id"] as string

    if (!appId) {
      throw new AppError(
        "No application information was found",
        StatusCodes.BAD_REQUEST
      );
    }

    if (appId === DRIVER_APP_ID) req.role = ROLES.DRIVER

    if (appId === RIDER_APP_ID) req.role = ROLES.RIDER;

    if (!req.role) throw new AppError("Missing application identifier", StatusCodes.BAD_REQUEST, 'App id not recognized')


    next();
  }
);

export default assignRoleOnSignup;
