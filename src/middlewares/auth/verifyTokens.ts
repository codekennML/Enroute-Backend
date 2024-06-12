
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import AppError from "../errors/BaseError";

import { setAccessToken, } from "./setTokens";
import  { UserServiceLayer } from "../../services/userService";
import { OtpServiceLayer } from "../../services/otpService";
import { checkUserCanAuthenticate } from "../../utils/helpers/canLogin";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response} from "express"

interface DecodedToken extends JwtPayload {
  user: string;  // Adjust the type based on your actual payload
  role: number;  // Adjust the type based on your actual payload
  mobileId?: string; // This field is optional based on your conditional checks
  subRole : number
}

// const REFRESH_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;
// const ACCESS_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

const AuthGuard = (req: Request, res: Response, next: NextFunction) => {

  const mobileId = req.headers["mobile-device-id"] as string |  undefined

  const accessToken = req.headers["X_A_T"] as string
  const refreshToken  =  req.headers["X_R_T"] as string

  if (!accessToken || !refreshToken)
    throw new AppError(
      getReasonPhrase(StatusCodes.UNAUTHORIZED),
      StatusCodes.UNAUTHORIZED
    );

  jwt.verify(accessToken, ACCESS_TOKEN_SECRET, async(err, decoded ) => {
    if (err) {
      await refreshUserToken(
        req,
        res,
        refreshToken,
        next,
        mobileId
      );

    }
    //If the device does not match the device this token was created for ,or this accessToken was created for a mobile device and is being used via another platform

    const {mobileId  : userMobileId, user,  role, subRole } =  decoded as DecodedToken

    if (!mobileId || 
      (mobileId && mobileId !== userMobileId) 
      
    )
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );

    req.user = user
    req.role = role
    req.subRole =  subRole
    next();
  });
};

const refreshUserToken = async (
  req: Request ,
  res: Response,
  refreshToken: string,
  next : NextFunction,
  mobileId?: string,
) => {
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );

    //Check that the token matches the one in the db, hash & compare

    const { user }  = decoded as DecodedToken

    const hashedRefreshToken = OtpServiceLayer.hashOTP(refreshToken);

    const userWithRefreshToken = await UserServiceLayer.getUsers({
      query: {
        refreshToken: hashedRefreshToken,
        _id: user,
        mobileAuthId: mobileId,
      },
      select: "suspended active banned roles subRole",
      lean: true,
    });

    if (!userWithRefreshToken || userWithRefreshToken.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );

    checkUserCanAuthenticate(userWithRefreshToken[0]);

    setAccessToken(req, res, user, userWithRefreshToken[0].roles, userWithRefreshToken[0]?.subRole)
  
    next()
  });
};

export default AuthGuard;
