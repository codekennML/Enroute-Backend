import { HttpResponse, HttpRequest } from "uWebsockets.js";
import jwt from "jsonwebtoken";
import UserService from "../../services/userService";
import { OtpServiceLayer } from "../../services/otpService";
import cookie from "cookie";

export const setTokens = async (
  res: HttpResponse,
  req: HttpRequest,
  user: string
) => {
  const isProduction = process.env.NODE_ENV === "production";

  const REFRESH_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;
  const ACCESS_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;

  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

  const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN as string;

  const REFRESH_TOKEN_EXPIRES_IN = process.env
    .REFRESH_TOKEN_EXPIRES_IN as string;

  const mobileId = req.getHeader("mobile-device-id");

  const accessToken = jwt.sign({ user, mobileId }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ user }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  //Store the refresh token in the db
  await UserService.updateUser({
    docToUpdate: {
      _id: user,
    },
    updateData: {
      $set: {
        refreshToken: OtpServiceLayer.hashOTP(refreshToken),
        mobileAuthId: mobileId,
      },
    },
    options: { new: false },
  });

  if (mobileId) {
    res.writeHeader(REFRESH_TOKEN_ID, refreshToken);
    res.writeHeader(ACCESS_TOKEN_ID, accessToken);
    return;
  }

  // const cookieHeaders  =  cookie.parser(req.getHeader("cookie"))

  const cookieOptions = {
    httpOnly: isProduction,
    sameSite: isProduction ? "strict" : "none",
    secure: isProduction,
  };

  const accessCookie = cookie.serialize(
    ACCESS_TOKEN_ID,
    accessToken,
    cookieOptions
  );
  const refreshCookie = cookie.serialize(
    REFRESH_TOKEN_ID,
    refreshToken,
    cookieOptions
  );

  res.writeHeader("Set-Cookie", accessCookie);
  res.writeHeader("Set-Cookie", refreshCookie);
};
