import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import { UserServiceLayer } from "../../services/userService";
import { OtpServiceLayer } from "../../services/otpService";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../errors/BaseError";
// import cookie, { CookieSerializeOptions } from "cookie";

const ACCESS_TOKEN_ID = process.env.ACCESS_TOKEN_ID as string

const REFRESH_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string

export const setTokens = async (
  req: Request,
  res: Response,
  user: string,
  role: number,
  subRole?: number

) => {

  // const REFRESH_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;
  // const ACCESS_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;

  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;


  const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN as string;

  const REFRESH_TOKEN_EXPIRES_IN = process.env
    .REFRESH_TOKEN_EXPIRES_IN as string;



  const mobileId = req.headers["mobile-device-id"] as string | undefined

  console.log(user, mobileId, role, subRole)
  const authInfo: Record<string, string | number> = {
    user: user.toString(),
    role,

  }

  if (subRole) authInfo["subRole"] = subRole
  if (mobileId) authInfo["mobileId"] = mobileId

  const accessToken = jwt.sign(authInfo, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });


  const refreshToken = jwt.sign(authInfo, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,

  });

  const updateData: Record<string, Record<string, string | Date>> = {
    $set: {
      refreshToken: OtpServiceLayer.hashOTP(refreshToken),
      accessTokenExpiresAt: new Date(Date.now() + 16 * 60 * 1000)

    }
  }
  if (mobileId) updateData["$set"]["mobileAuthId"] = mobileId

  //Store the refresh token in the db
  const userInfo = await UserServiceLayer.updateUser({
    docToUpdate: {
      _id: user,
    },
    updateData,
    options: { new: true, select: "roles _id" },
  });

  if (!userInfo) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)
  //Set the token in the header
  req.headers[ACCESS_TOKEN_ID] = accessToken
  req.headers[REFRESH_TOKEN_ID] = refreshToken


  req.user = userInfo._id.toString()
  req.role = userInfo.roles
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

export const setAccessToken = async (req: Request, res: Response, user: string, role: number, subRole?: number) => {

  // const mobileId = req.headers["mobile-device-id"] as string | undefined

  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

  const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN as string;

  console.log(ACCESS_TOKEN_EXPIRES_IN)

  const tokenData: Record<string, string | number> = {
    user,
    role,
  }

  if (subRole) tokenData["subRole"] = subRole
  // if (mobileId) tokenData["mobileId"] = mobileId

  const accessToken = jwt.sign(tokenData, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  })

  // console.log(accessToken)


  req.user = user
  req.role = role
  if (subRole) req.subRole = subRole

  console.log(req.role, "ROLEEEEE")
  req.headers[ACCESS_TOKEN_ID] = accessToken
  return
}

export const removeAccessTokens = async (req: Request) => {
  req.headers[ACCESS_TOKEN_ID] = ""
  req.headers[REFRESH_TOKEN_ID] = ""
}
