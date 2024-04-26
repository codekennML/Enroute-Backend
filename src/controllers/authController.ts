import { EmailSigninData, SocialAuthData } from "./../../types/types.d";
import cookie from "cookie";
import { UserServiceLayer } from "./../services/userService";
import AuthService, { authService } from "../services/authService";
import { FacebokAuthResponse, MobileSigninData } from "../../types/types";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { readJSON } from "../utils/helpers/decodePostJSON";
import { HttpResponse, HttpRequest } from "uWebsockets.js";
import AppResponse from "../utils/helpers/AppResponse";
import AppError from "../middlewares/errors/BaseError";
import { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } from "../config/constants/auth";
import axios from "axios";
import verifyGoogleToken from "../services/3rdParty/Google/auth";
import { setTokens } from "../middlewares/auth/setTokens";
import { ROLES } from "../config/enums";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import { checkUserCanAuthenticate } from "../utils/helpers/canLogin";
import { Request, Response } from "express";

class AuthController {
  public authService: AuthService;

  constructor(auth: AuthService) {
    this.authService = auth;
  }

  signInUserMobile = async (req: Request, res: Response) => {
    const data: MobileSigninData = req.body;
    const { mobile, countryCode, role } = data;

    const user = await this.authService.signInMobile({
      mobile,
      countryCode,
      role,
    });

    //This should never happen, but since the updateUser method can return null, we should handle it here, instead of setting the resukt to not null
    if (!user)
      throw new AppError(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );

    checkUserCanAuthenticate(user);

    return AppResponse(res, req, StatusCodes.CREATED, user);
  };

  signInUserEmail = async (res: HttpResponse, req: HttpRequest) => {
    const data = await readJSON<EmailSigninData>(res);

    const { email, role, mobile, countryCode } = data;

    const user = await this.authService.signInEmail({
      email,
      role,
      mobile,
      countryCode,
    });

    //This should never happen, but since the updateUser method can return null, we should handle it here, instead of setting the resukt to not null
    if (!user)
      throw new AppError(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );

    checkUserCanAuthenticate(user);

    return AppResponse(res, req, StatusCodes.CREATED, user);
  };

  // async completeRegistration(res: HttpResponse) {
  //   const data: RegistrationData = await readJSON(res);

  //   if (!data)
  //     throw new AppError(
  //       getReasonPhrase(StatusCodes.BAD_REQUEST),
  //       StatusCodes.BAD_REQUEST,
  //       `Error decoding login  post data`
  //     );

  //   //Update the user with their data

  //   const updatedUserData = await this.authService.completeRegistration({
  //     ...data,
  //   });

  //   return { status: StatusCodes.OK, data: updatedUserData };
  // }

  // async logout(res: HttpResponse) {
  //   const data = await readJSON<{ user: string }>(res);

  //   if (!data)
  //     throw new AppError(
  //       getReasonPhrase(StatusCodes.BAD_REQUEST),
  //       StatusCodes.BAD_REQUEST,
  //       `Error decoding login  post data`
  //     );

  //   const loggedOut = await this.authService.logout(data.user);

  //   return { status: StatusCodes.CREATED, data: loggedOut };
  // }

  replaceExistingAccountViaMobile = async (
    res: HttpResponse,
    req: HttpRequest
  ) => {
    interface AccountDataToCreate {
      countryCode: string;
      mobile: string;
      googleId?: string;
      googleEmail: string;
      role: ROLES;
      appleId?: string;
      appleEmail?: string;
      fbId?: string;
      fbEmail?: string;
      email?: string;
    }

    const data = await readJSON<AccountDataToCreate>(res);

    const operations = [
      {
        deleteOne: {
          filter: {
            mobile: data.mobile,
            countryCode: data.countryCode,
            role: ROLES,
          },
        },
      },
      {
        insertOne: {
          document: {
            ...data,
          },
        },
      },
    ];

    const response = await retryTransaction(
      UserServiceLayer.bulkUpdateUser,
      1,
      {
        operations,
      }
    );

    const newUser: string = response.data?.insertedIds[0];

    return AppResponse(res, req, StatusCodes.OK, {
      message: "Account updated successfully",
      newUser,
    });
  };

  replaceExistingAccountViaEmail = async (
    res: HttpResponse,
    req: HttpRequest
  ) => {
    interface AccountDataToCreate {
      countryCode: string;
      mobile: string;
      googleId?: string;
      role: ROLES;
      appleId?: string;
      fbId: string;
      email: string;
    }

    const data = await readJSON<AccountDataToCreate>(res);

    const operations = [
      {
        deleteOne: {
          filter: {
            email,
            role,
          },
        },
      },
      {
        insertOne: {
          document: {
            ...data,
          },
        },
      },
    ];

    const response = await retryTransaction(
      UserServiceLayer.bulkUpdateUser,
      1,
      {
        operations,
      }
    );

    const newUser: string = response.data?.insertedIds[0];

    return AppResponse(res, req, StatusCodes.OK, {
      message: "Account updated successfully",
      newUser,
    });
  };

  signInWithFacebook = async (res: HttpResponse, req: HttpRequest) => {
    const data = await readJSON<SocialAuthData>(res);

    const { token, email: fbEmail, roles } = data;

    const url = `https://graph.facebook.com/debug_token?
     input_token=${token}
     &access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;

    const accessTokenData: FacebokAuthResponse = (await axios.get(url)).data;

    const { app_id, user_id: fb_user_id } = accessTokenData;

    if (app_id !== FACEBOOK_APP_ID)
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN,
        `Illegal attempt to use fb token generated by foreign app_id for verification`
      );

    const userData = await UserServiceLayer.getUsers({
      query: {
        fbId: { $eq: fb_user_id },
        fbEmail,
        roles,
      },
      select: "fbId mobile firstName countryCode email fbEmail _id",
    });

    const result = {
      facebookId: fb_user_id,
      mobile: userData[0]?.mobile,
      countryCode: userData[0]?.countryCode,
      firstname: userData[0]?.firstName,
      email: userData[0].email,
      fbEmail: userData[0].fbEmail,
      user: userData[0]?._id,
    };

    return AppResponse(res, req, StatusCodes.OK, result);
  };

  signInWithGoogle = async (res: HttpResponse, req: HttpRequest) => {
    const data = await readJSON<SocialAuthData>(res);

    const { token, roles } = data;

    const userGoogleData = await verifyGoogleToken(token);

    if (!userGoogleData)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const { sub, email: googleEmail } = userGoogleData;

    const userData = await UserServiceLayer.getUsers({
      query: {
        googleId: { $eq: sub },
        googleEmail,
        roles,
      },
      select: "googleId mobile firstName countryCode email googleEmail",
    });

    const result = {
      googleId: sub,
      mobile: userData[0]?.mobile,
      countryCode: userData[0]?.countryCode,
      firstname: userData[0]?.firstName,
      email: userData[0]?.email,
      googleEmail,
    };

    return AppResponse(res, req, StatusCodes.OK, result);
  };

  logOut = async (res: HttpResponse, req: HttpRequest) => {
    const { user } = await readJSON<{ user: string }>(res);

    const loggedOutUser = await UserServiceLayer.updateUser({
      docToUpdate: {
        _id: { $eq: user },
      },
      updateData: {
        $set: {
          refreshToken: undefined,
        },
      },
      options: { new: false, select: "_id" },
    });

    //remove the headers
    res.cork(() => {
      if (req.getHeader("mobile-device-id")) {
        res.writeHeader(REFRESH_TOKEN_ID, "");
        res.writeHeader(ACCESS_TOKEN_ID, "");
      } else {
        //clear the web cookies

        const refreshToken = "";
        const accessToken = "";

        const refreshCookie = cookie.serialize(REFRESH_TOKEN_ID, refreshToken, {
          expires: new Date("Thu, 01 Jan 1970 00:00:00 GMT"),
        });

        const accessCookie = cookie.serialize(ACCESS_TOKEN_ID, accessToken, {
          expires: new Date("Thu, 01 Jan 1970 00:00:00 GMT"),
        });

        res.writeHeader("Set-Cookie", accessCookie);
        res.writeHeader("Set-Cookie", refreshCookie);
      }
    });

    return AppResponse(res, req, StatusCodes.OK, {
      loggedOut: true,
      loggedOutUser,
    });
  };

  assignTokens = async (res: HttpResponse, req: HttpRequest) => {
    const { user } = await readJSON<{ user: string }>(res);

    setTokens(res, req, user);

    return AppResponse(res, req, StatusCodes.OK, {
      message: "Access granted ",
    });
  };

  async updateUserAuthData(res: HttpResponse, req: HttpRequest) {
    const { mobile, email, userId, countryCode } = data;

    //Check if the signIn type is email and mobile or mobile only

    const user = await this.#getUsers(
      { _id: userId },
      "_id email mobile countryCode"
    );

    if (!email && !mobile) {
    }

    //if there is an email, you want the user to use their email to verify the otp before entering the new number
    if (email && countryCode && mobile) {
      //Send OTP to the existing email for verification
    }

    if (countryCode && mobile) {
      //Just send an otp to the number and validate it, the user only has a mobile number on record
    }
  }
}
export const authController = new AuthController(authService);

export default AuthController;
