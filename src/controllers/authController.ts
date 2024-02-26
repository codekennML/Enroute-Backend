import AuthService, { authService } from "../services/authService";
import {
  LoginData,
  SignupData,
  AuthData,
  RegistrationData,
  MobileSignupData,
  ActivateAccountData,
} from "../../types/types";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { hasError, retryTransaction } from "../utils/helpers/retryTransaction";
import { readJSON } from "../utils/helpers/decodePostJSON";
import { HttpResponse, HttpRequest } from "uWebsockets.js";
import AppError from "../middlewares/errors/BaseError";
import { OtpServiceLayer } from "../services/otpService";
import { Notification } from "../services/mailService";
import { ClientSession, Types } from "mongoose";

// import { SignupMailTemplate } from "../views/mails";
import { Prettify } from "../../types/types";
import UserService from "../services/userService";
import { setTokens } from "../middlewares/auth/setTokens";
import { checkUserCanAuthenticate } from "../utils/helpers/canLogin";

type signupHandlerData = {
  success: boolean;
  data: {
    otp?: string;
    user: string;
    token?: string;
    otpId?: string;
  };
};

class AuthController {
  protected authService: AuthService;

  constructor(auth: AuthService) {
    this.authService = auth;
  }

  async signup(res: HttpResponse, req: HttpRequest) {
    //RateLimit here

    const mobileId = req.getHeader("mobile_device_id");

    const data = await readJSON<SignupData>(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error decoding post data`
      );

    if ("mobileId" in data) data.mobileId = mobileId;

    const response = await retryTransaction(this.signupHandler, 1, data);

    //Send an email for web email/password signIn here

    return { status: StatusCodes.CREATED, data: response };
  }

  async signupHandler(
    request: SignupData,
    session: ClientSession
  ): Promise<signupHandlerData> {
    function isMobileSignup(request: SignupData): request is MobileSignupData {
      return "mobileId" in request;
    }

    const result: signupHandlerData = {
      success: false,
      data: {
        otp: "",
        otpId: "",
        user: "",
        token: "",
      },
    };

    //Intialize the message object
    const info: {
      user: string;
      expiryInMins: number;
      type: "signup";
      otpHash: string;
    } = { user: "", expiryInMins: 10, type: "signup", otpHash: "" };

    //Split the signups based on type

    if (isMobileSignup(request)) {
      const response = await this.authService.mobileSignup(request, session);

      info.user = response.data.user;

      //Generate & hash OTP
      const otp = OtpServiceLayer.generateOTP(6);
      const hashedOTP = OtpServiceLayer.hashOTP(otp);

      //Create the otp here and save to DB
      const otpId = await OtpServiceLayer.createDBOtpEntry(
        {
          ...info,
          user: new Types.ObjectId(info.user),
          otpHash: hashedOTP,
        },
        session
      );

      result.success = true;
      (result.data.otp = otp),
        (result.data.user = info.user),
        (result.data.otpId = otpId);

      //Send  otp to mobile
      await Notification.sendMobileMessage({
        message: `Welcome to ${
          process.env.COMPANY_NAME as string
        }, Here is your verification code - ${otp}`,
        recipient: response.data.mobile,
      });
    } else {
      //Send an email instead
      const response = await this.authService.webSignup(request, session);

      info.user = response.data.user;
      info.expiryInMins = 60 * 24;

      const { hashedToken, token } = OtpServiceLayer.appendAndHashOTP(
        response.data.user
      );

      await OtpServiceLayer.createDBOtpEntry(
        {
          ...info,
          user: new Types.ObjectId(info.user),
          otpHash: hashedToken,
        },
        session
      );

      result.success = true;
      result.data.user = info.user; //TODO :Remove this eventually
      result.data.token = token; //TODO :Remove this eventually

      //Send  email activation link
      await Notification.sendEmailMessage({
        body: `Welcome to ${
          process.env.COMPANY_NAME as string
        }, Here is your verification link - https://www.${
          process.env.COMPANY_URL as string
        }/activate_account/${info.user}/account/${token}`,
        from: `${process.env.ONBOARDING_MAIL as string}`,
        recipient: response.data.email,
        subject: `Welcome to ${process.env.COMPANY_NAME as string}`,
      });
    }

    return result;
  }

  async activateAccount(res: HttpResponse) {
    const data: ActivateAccountData = await readJSON(res);

    const { token, user } = data;

    const response = await retryTransaction(
      this.activateEmailSignupHandler,
      1,
      {
        token,
        user,
      }
    );

    if (hasError(response))
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    return { status: StatusCodes.OK, data: response };
  }

  async activateEmailSignupHandler(
    request: ActivateAccountData,
    session: ClientSession
  ) {
    const response: {
      success: boolean;
      data: { message: string; user: string };
    } = {
      success: false,
      data: { message: "", user: "" },
    };

    await session.withTransaction(async () => {
      const hashString = `${request.token}${request.user}`;

      const hashedToken = OtpServiceLayer.hashOTP(hashString.trim());

      //validate the token
      const isValidToken = await OtpServiceLayer.getOtps({
        query: { hash: hashedToken, expiry: { $lte: new Date() } },
        select: "_id",
        session,
      });

      if (!isValidToken || isValidToken.length === 0)
        throw new AppError(
          getReasonPhrase(StatusCodes.BAD_REQUEST),
          StatusCodes.BAD_REQUEST
        );

      const updatedUser = await UserService.updateUser({
        docToUpdate: { _id: { $eq: request.user } },
        updateData: {
          $set: {
            active: true,
          },
        },
        options: { session, new: true, select: "_id" },
      });

      response.data = {
        message: "User account activated successfully",
        user: updatedUser?._id.toString(),
      };
      response.success = true;
    });

    return response;
  }

  async webLogin() {}

  async mobileLogin(res: HttpResponse, req: HttpRequest) {
    const data = await readJSON<AuthData>(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error decoding post data`
      );

    const result = await this.authenticateOTPAccess(data);

    if (data?.vfm)
      await UserService.updateUser({
        docToUpdate: { _id: { $eq: result.user } },
        updateData: {
          $set: {
            mobileVerified: true,
          },
        },
        options: { new: false },
      });

    //This will set the token in the headers, which we will pick in the response handler function and send back  along with the response
    setTokens(res, req, result.user._id);

    return { status: StatusCodes.OK, data: { message: "Login successful" } };
  }

  async generateMobileLoginOTP(res: HttpResponse) {
    const data = await readJSON<LoginData>(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error decoding login  post data`
      );

    const response = await retryTransaction(this.authService.login, 1, data);

    if (hasError(response))
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const otp = OtpServiceLayer.generateOTP(6);
    const hashedOTP = OtpServiceLayer.hashOTP(otp);

    const info = {
      ...response.data,
      type: "login",
      expiryInMins: 10,
      otpHash: hashedOTP,
    };

    const createdOtpEntry = await OtpServiceLayer.createDBOtpEntry(info);

    //Send  otp mobile
    await Notification.sendMobileMessage({
      message: ` ${
        process.env.COMPANY_NAME as string
      }, Here is your verification code - ${otp}`,
      recipient: response.data.mobile,
    });

    return {
      status: StatusCodes.OK,
      data: { otpId: createdOtpEntry, type: "login" },
    };
  }

  async authenticateOTPAccess(data: AuthData) {
    //check the otp first (validity and expiration)

    const { otpId, otp, type } = data;

    const hashedOTP = OtpServiceLayer.hashOTP(otp);

    const otps = await OtpServiceLayer.getOtps({
      query: {
        _id: otpId,
        hash: hashedOTP,
        type,
      },
      lean: true,
    });

    if (!otps || otps.length === 0 || new Date() > otps[0].expiry)
      throw new AppError(
        `Invalid or expired otp received`,
        StatusCodes.BAD_REQUEST,
        `Error retrieving ${type} token for user ${otps[0].user}`
      );

    const user = await UserService.getUserInfo(
      otps[0].user.toString(),
      "active banned suspended mobileVerified _id"
    );

    checkUserCanAuthenticate(user);

    return {
      user,
    };
  }

  async completeRegistration(res: HttpResponse) {
    const data: RegistrationData = await readJSON(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error decoding login  post data`
      );

    //Update the user with their data

    const updatedUserData = await this.authService.completeRegistration({
      ...data,
    });

    return { status: StatusCodes.OK, data: updatedUserData };
  }

  async logout(res: HttpResponse) {
    const data = await readJSON<{ user: string }>(res);

    if (!data)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST,
        `Error decoding login  post data`
      );

    const loggedOut = await this.authService.logout(data.user);

    return { status: StatusCodes.CREATED, data: loggedOut };
  }

  async signInWithFacebook() {
    passport.use(
      new Google.Strategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          callbackURL: "/auth/facebook/callback",
          scope: ["profile"],
          passReqToCallback: true,
        },
        async (accessToken, refreshToken, email, profile, done) => {
          const user = await this.authService.socialLoginCheck(
            "facebook",
            profile
          );

          done(null, user);
        }
      )
    );

    passport.serializeUser((fbId, done) => {
      done(null, fbId);
    });

    passport.deserializeUser(async (fbId, done) => {
      const user = await this.authService.authDataLayer.getUsers({
        query: { fbId: { $eq: fbId } },
        select: "fbId",
      });

      if (!user || user[0].fbId !== fbId)
        throw new Error(`Authentication Error.`);

      done(null, user[0]);
    });
  }

  async signInWithGoogle() {
    passport.use(
      new Google.Strategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          callbackURL: "/auth/google/callback",
          scope: ["profile"],
          passReqToCallback: true,
        },
        async (accessToken, refreshToken, email, profile, done) => {
          const user = await this.authService.socialLoginCheck(
            "google",
            profile
          );

          const shouldSendWelcomeMail =
            new Date().getTime() - user.createdAt.getTime() < 60 * 1000;

          if (shouldSendWelcomeMail && profile?.emails)
            await Notification.sendEmailMessage({
              recipient: profile.emails[0].value,
              subject: `Welcome to ${process.env.COMPANY_URL}`,
              from: `onboarding@${process.env.COMPANY_NAME}.com`,
              mailHTML: "",
            });

          done(null, user);
        }
      )
    );

    passport.serializeUser((googleId, done) => {
      done(null, googleId);
    });

    passport.deserializeUser(async (googleId, done) => {
      const user = await this.authService.authDataLayer.getUsers({
        query: { googleId: { $eq: googleId } },
        select: "googleId",
      });

      if (!user || user[0].googleId !== googleId)
        throw new Error(`Authentication Error.`);

      done(null, user[0]);
    });
  }

  //TODO :rEMEMBER TO IMPLEEMENT A LOGOUT ALL USERS FUNCTIONALITY FROM THE CACHE
}

export const authController = new AuthController(authService);

export default AuthController;
