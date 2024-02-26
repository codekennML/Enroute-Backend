import { StatusCodes } from "http-status-codes";
import AppError from "../../middlewares/errors/BaseError";
import { IUser } from "../../model/interfaces";

export const checkUserCanAuthenticate = (currentUser: IUser): void => {
  // if (currentUser?.lockedUntil) {
  //   const timeRemaining =
  //     new Date(currentUser.lockedUntil).getTime() - new Date().getTime();

  //   if (timeRemaining > 0) {
  //     throw new AppError(
  //       `Your account has been locked for security reasons. Please try again in ${
  //         timeRemaining / 60000
  //       } minutes`,
  //       StatusCodes.UNAUTHORIZED,
  //       `Non-activated user account access attempt: ${currentUser.email} - ${clientIp}`
  //     );
  //   }
  // }

  if (currentUser.suspended)
    throw new AppError(
      "Your account has been suspended. Please contact support",
      StatusCodes.FORBIDDEN,
      ` User Account suspended : ${currentUser.email}`
    );
  if (!currentUser.active)
    throw new AppError(
      "Your account email verification is pending. Please verify account to continue.",
      StatusCodes.FORBIDDEN
    );

  if (currentUser.banned)
    throw new AppError(
      "Your account has been deactivated. Please contact support",
      StatusCodes.FORBIDDEN,
      ` Banned account access attempt : ${currentUser.email}`
    );

  return;
};
