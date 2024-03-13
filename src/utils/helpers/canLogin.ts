import { StatusCodes } from "http-status-codes";
import AppError from "../../middlewares/errors/BaseError";
import { IUser } from "../../model/interfaces";

export const checkUserCanAuthenticate = (currentUser: IUser): void => {
  if (currentUser.suspended)
    throw new AppError(
      "Your account has been suspended. Please contact support",
      StatusCodes.FORBIDDEN,
      ` User Account suspended : ${currentUser.email}`
    );

  // if (!currentUser.active)
  //   throw new AppError(
  //     "Your account email verification is pending. Please verify account to continue.",
  //     StatusCodes.FORBIDDEN
  //   );

  if (currentUser.banned)
    throw new AppError(
      "Your account has been restricted for repeated violations of the terms and community guidelines of use on our platform and will not be unrestricted . Please contact support if you believe this is an error",
      StatusCodes.FORBIDDEN,
      ` Banned account access attempt : ${currentUser.email}`
    );
};
