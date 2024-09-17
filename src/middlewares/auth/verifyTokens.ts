
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import AppError from "../errors/BaseError";

import { setAccessToken, } from "./setTokens";
import { UserServiceLayer } from "../../services/userService";
import { OtpServiceLayer } from "../../services/otpService";
import { checkUserCanAuthenticate } from "../../utils/helpers/canLogin";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express"
import { ROLES } from "../../config/enums";

interface DecodedToken extends JwtPayload {
  user: string;  // Adjust the type based on your actual payload
  role: number;  // Adjust the type based on your actual payload
  mobileId?: string; // This field is optional based on your conditional checks
  subRole: number
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
const driver_app_id = process.env.DRIVER_APP_ID as string
const rider_app_id = process.env.RIDER_APP_ID as string



const AuthGuard = async (req: Request, res: Response, next: NextFunction) => {

  // const mobileId = req.headers["mobile-device-id"] as string | undefined
  const app_id = req.headers["app_id"]
  const accessToken = req.headers["x_a_t"] as string
  const refreshToken = req.headers["x_r_t"] as string

  try {




    if (!accessToken || !refreshToken)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(accessToken, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });


    const { user, role, subRole } = decoded as DecodedToken

    console.log(user, role, subRole, "Miztaatat")

    if (app_id === rider_app_id && role !== ROLES.RIDER) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

    if (app_id === driver_app_id && role !== ROLES.DRIVER) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

    if (!app_id && [ROLES.DRIVER, ROLES.RIDER].includes(req.role)) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

    req.user = user
    req.role = role
    req.subRole = subRole
    next();


  } catch (err) {


    try {
      await refreshUserToken(req, res, next, refreshToken);
      next();

    } catch (refreshError) {
      console.error("Error refreshing token:", refreshError);
      next(new AppError('Authsentication failed', StatusCodes.UNAUTHORIZED));
    }

  }

}





const refreshUserToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
  refreshToken: string,
) => {

  await jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {

    if (err) {
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );

    }

    const { user, role } = decoded as DecodedToken


    const app_id = req.headers["app_id"]

    console.log(app_id)

    if (app_id === rider_app_id && role !== ROLES.RIDER) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

    if (app_id === driver_app_id && role !== ROLES.DRIVER) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

    if (!app_id && role in [ROLES.DRIVER, ROLES.RIDER]) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)




    const hashedRefreshToken = OtpServiceLayer.hashOTP(refreshToken);


    const docToUpdate: Record<string, string> = {
      refreshToken: hashedRefreshToken,
      _id: user,
    }



    // throw new AppError("ERror", 500)

    const userWithRefreshToken = await UserServiceLayer.updateUser({
      docToUpdate,
      updateData: {
        accessTokenExpiresAt: new Date(Date.now() + 16 * 60 * 1000)
      },
      options: {
        new: true,
        select: "suspended active banned roles subRole",
      }
    });

    if (!userWithRefreshToken)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );

    checkUserCanAuthenticate(userWithRefreshToken);


    await setAccessToken(req, res, user, userWithRefreshToken.roles, userWithRefreshToken?.subRole)

  });
};



// try {

//   const decoded = await new Promise((resolve, reject) => {
//     jwt.verify(accessToken, ACCESS_TOKEN_SECRET, (err, decoded) => {
//       if (err) reject(err);
//       else resolve(decoded);
//     });
//   });

//   // If verification succeeds, attach the decoded info to the request and proceed
//   req.user = decoded;
//   next();
// } catch (error) {
//   console.log("Access token verification failed:", error);

//   // If access token is invalid, try to refresh
//   try {
//     await refreshUserToken(req, res, refreshToken);
//     console.log("FINISHED REFRESH");
//     next();
//   } catch (refreshError) {
//     console.error("Error refreshing token:", refreshError);
//     next(new AppError('Authentication failed', StatusCodes.UNAUTHORIZED));
//   }
// }


export default AuthGuard;
