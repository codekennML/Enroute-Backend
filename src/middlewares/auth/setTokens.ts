import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import  { UserServiceLayer } from "../../services/userService";
import { OtpServiceLayer } from "../../services/otpService";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../errors/BaseError";
// import cookie, { CookieSerializeOptions } from "cookie";

export const setTokens = async (
  req: Request,
  res: Response,
  user: string,
  role : number,
  subRole? : number
 
) => {

  // const REFRESH_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;
  // const ACCESS_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;

  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

  const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN as string;

  const REFRESH_TOKEN_EXPIRES_IN = process.env
    .REFRESH_TOKEN_EXPIRES_IN as string;

  const mobileId = req.headers["mobile-device-id"] as string

 
  const accessToken = jwt.sign({ 
    user, 
    mobileId, 
    role,
    subRole
  
   }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({
    user, 
    role,
    subRole 
  }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
   
  });

  //Store the refresh token in the db
 const userInfo =  await UserServiceLayer.updateUser({
    docToUpdate: {
      _id: user,
    },
    updateData: {
      $set: {
        refreshToken: OtpServiceLayer.hashOTP(refreshToken),
        mobileAuthId: mobileId,
      },
    },
    options: { new: true, select : "role _id" },
  });

  if(!userInfo) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)
  //Set the token in the header
  req.headers["X_A_T"] =  accessToken
  req.headers["X_R_T"] = refreshToken

  req.user =  userInfo._id 
  req.role =  userInfo.roles.toString()
  req.subRole = userInfo.subRole



  // if (mobileId) {
  //   res.cork(() => {
  //     res.writeHeader(REFRESH_TOKEN_ID, refreshToken);
  //     res.writeHeader(ACCESS_TOKEN_ID, accessToken);
  //   });
  //   return;
  // }

  // const cookieHeaders  =  cookie.parser(req.getHeader("cookie"))

  // const cookieOptions: CookieSerializeOptions = {
  //   httpOnly: isProduction,
  //   sameSite: isProduction ? "strict" : "none",
  //   secure: isProduction,
  // };

  // const accessCookie = cookie.serialize(
  //   ACCESS_TOKEN_ID,
  //   accessToken,
  //   cookieOptions
  // );
  // const refreshCookie = cookie.serialize(
  //   REFRESH_TOKEN_ID,
  //   refreshToken,
  //   cookieOptions
  // );

  // res.writeHeader("Set-Cookie", accessCookie);
  // res.writeHeader("Set-Cookie", refreshCookie);

}

export const setAccessToken = async (req : Request,  res : Response, user : string, role : number ,  subRole? : number) => {

  const mobileId = req.headers["mobile-device-id"] as string

  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string; 

  const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN as string;

  const accessToken = jwt.sign({ 
    user, 
    mobileId ,
    role, 
    subRole
  }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  
  } )
  req.role =  role
  req.subRole = subRole
  req.headers["X_A_T"] = accessToken

  return 
}
