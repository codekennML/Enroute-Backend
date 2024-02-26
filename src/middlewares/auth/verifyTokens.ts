import { getReasonPhrase, StatusCodes } from "http-status-codes";
import AppError from "../errors/BaseError";
import { HttpRequest, HttpResponse } from "uWebsockets.js";
import { setTokens } from "./setTokens";
import UserService from "../../services/userService";
import { OtpServiceLayer } from "../../services/otpService";
import { checkUserCanAuthenticate } from "../../utils/helpers/canLogin";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const REFRESH_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;
const ACCESS_TOKEN_ID = process.env.REFRESH_TOKEN_ID as string;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

const AuthGuard = (res: HttpResponse, req: HttpRequest, next: () => void) => {
  const mobileId = req.getHeader("mobile-device-id");

  let refreshToken = "";
  let accessToken = "";

  //Parse the cookies here

  if (mobileId) {
    refreshToken = req.getHeader(`${REFRESH_TOKEN_ID}`);
    accessToken = req.getHeader(`${ACCESS_TOKEN_ID}`);
  } else {
    const cookies = cookie.parse(req.getHeader("cookie"));

    refreshToken = cookies[REFRESH_TOKEN_ID];
    accessToken = cookies[ACCESS_TOKEN_ID];
  }

  if (!accessToken && !refreshToken)
    throw new AppError(
      getReasonPhrase(StatusCodes.UNAUTHORIZED),
      StatusCodes.UNAUTHORIZED
    );

  jwt.verify(accessToken, ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      await refreshUserToken(
        res,
        req,
        refreshToken,
        mobileId ? mobileId : undefined
      );
      next();
    }
    //If the device does not match the device this token was created for ,or this accessToken was created for a mobile device and is being used via another platform

    if (
      (mobileId && mobileId !== decoded?.mobileId) ||
      (!mobileId && decoded.mobileId)
    )
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    next();
  });
};

const refreshUserToken = async (
  res: HttpResponse,
  req: HttpRequest,
  refreshToken: string,
  mobileId?: string
) => {
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    //Check that the token matches the one in the db, hash & compare

    const { user } = decoded;

    const hashedRefreshToken = OtpServiceLayer.hashOTP(refreshToken);

    const userWithRefreshToken = await UserService.getUsers({
      query: {
        refreshToken: hashedRefreshToken,
        _id: user,
        mobileAuthId: mobileId,
      },
      select: "suspended active banned",
      lean: true,
    });

    if (!userWithRefreshToken || userWithRefreshToken.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );

    checkUserCanAuthenticate(userWithRefreshToken[0]);

    setTokens(res, req, user);
  });
};

export default AuthGuard;
