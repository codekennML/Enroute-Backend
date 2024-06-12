import { StatusCodes } from "http-status-codes";
import AppError from "../../middlewares/errors/BaseError";
import { IUser } from "../../model/interfaces";

export const checkUserCanAuthenticate = (currentUser: IUser): void => {

  if (currentUser.suspended)
    throw new AppError(
      "Your account has been suspended. Please contact support",
      StatusCodes.UNAUTHORIZED,
      ` User Account suspended : ${currentUser.email}`
    );


  if (currentUser.banned)
    throw new AppError(
      "Your account has been restricted for repeated violations of the terms and community guidelines of use on our platform and may likely not be unrestricted . Please contact support if you believe this is an error.",
      StatusCodes.UNAUTHORIZED,
      ` Banned account access attempt : ${currentUser.email}`
    );
};
