import { ClientSession, Types } from "mongoose";
import UserRepository, { UserDataLayer } from "../repository/mongo/User";
import {
  LoginData,
  RegistrationData,
  MobileSignupData,
  WebSignupData,

  // Prettify,
} from "../../types/types";
import { authLogger } from "../middlewares/logging/logger";
import AppError from "../middlewares/errors/BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { transformIP } from "../utils/helpers/loginIPDeviceCheck";

import { checkUserCanAuthenticate } from "../utils/helpers/canLogin";
import { Profile } from "passport-google-oauth20";
import { IUserModel } from "../model/user";

interface MobileSignupResponse {
  success: boolean;
  data: { user: string; mobile: string };
}

interface WebSignupResponse {
  success: boolean;
  data: { user: string; email: string };
}

class AuthService {
  public authDataLayer: UserRepository;

  constructor(authRepositoryClass: UserRepository) {
    this.authDataLayer = authRepositoryClass;
  }

  async mobileSignup(
    request: MobileSignupData,
    session: ClientSession
  ): Promise<MobileSignupResponse> {
    let result!: MobileSignupResponse;

    const transformedIP = transformIP(request.clientIp);

    const { mobile, userId, roles } = request;

    await session.withTransaction(async () => {
      const existingUser = await this.authDataLayer.getUsers({
        query: {
          mobile: { $eq: request.mobile },
        },
        select: "mobile _id",
        session,
      });

      if (existingUser && existingUser.length > 0)
        throw new AppError(
          `Phone Number already exists. Please login instead `,
          StatusCodes.CONFLICT,
          `Mobile ${request.mobile} provided to signup already exists`
        );

      let user: IUserModel | IUserModel[] | null;

      const authInfo = {
        mobile,
        roles,
      };

      if (!request.userId) {
        //This is for people who just signed up using mobile
        user = await this.authDataLayer.createUser(authInfo, session);
      } else {
        //This is for people who signed up with  social login, we need to verify their phone numbers and add it to them
        user = await this.authDataLayer.updateUser({
          docToUpdate: { _id: { $eq: userId } },
          updateData: {
            $set: {
              mobile: request.mobile,
            },
          },
          options: { new: true, select: "_id mobile" },
        });
        //Update the account with this email and signOnId
      }

      if (!user || (Array.isArray(user) && !user[0]))
        throw new AppError(
          `Something went wrong. Please try again`,
          200,
          `Error creating user with mobile ******${request.mobile.slice(
            -6
          )} and ip : ${transformedIP}`
        );

      if (Array.isArray(user)) user = user[0];

      result = {
        success: true,
        data: {
          user: user._id,
          mobile: user.mobile,
        },
      };

      authLogger.info(`$User Created - ${user._id}`);

      await session.commitTransaction();
    });

    //Log the created user id and time to logs

    return result;
  }

  async webSignup(
    request: WebSignupData,
    session: ClientSession
  ): Promise<WebSignupResponse> {
    let result!: WebSignupResponse;

    await session.withTransaction(async () => {
      const { email, password } = request;

      const isExistingUser = await this.authDataLayer.getUsers({
        query: { email: email.trim().toLocaleLowerCase() },
        select: "email",
        session,
      });

      if (isExistingUser && isExistingUser.length > 0)
        throw new AppError(
          getReasonPhrase(StatusCodes.CONFLICT),
          StatusCodes.CONFLICT
        );

      const authInfo = {
        email,
        password,
        active: false,
      };

      const createdUser = await this.authDataLayer.createUser(
        authInfo,
        session
      );

      result.success = true;
      result.data.user = createdUser[0]._id.toString();
      result.data.email = createdUser[0].email;
      await session.commitTransaction();
    });

    return result;
  }

  async login(
    request: LoginData,
    session: ClientSession
  ): Promise<{
    success: boolean;
    data: { mobile: string; user: Types.ObjectId };
  }> {
    let result!: {
      success: boolean;
      data: { mobile: string; user: Types.ObjectId };
    };

    const { mobile, clientIp } = request;

    await session.withTransaction(async () => {
      const currentUsers = await this.authDataLayer.getUsers({
        query: { mobile: { $eq: request.mobile } },
        select: "avatar roles password active suspended banned  _id",
        session,
      });

      if (!currentUsers[0] || currentUsers[0].mobile !== mobile)
        throw new AppError(
          "Invalid username or password",
          StatusCodes.NOT_FOUND,
          `User account Not Found : ${mobile}`
        );

      checkUserCanAuthenticate(currentUsers[0]);

      result = {
        success: true,
        data: {
          user: currentUsers[0]._id,
          mobile: currentUsers[0].mobile,
        },
      };

      await session.commitTransaction();
    });

    //Something must have gone wrong somehow , which should not happen

    return result;
  }

  async logout(user: string): Promise<Record<string, boolean>> {
    //Hash the refresh token and compare against the authCache. Then invalidate the token

    await this.authDataLayer.updateUser({
      docToUpdate: { _id: { $eq: user } },
      updateData: {
        $set: {
          refreshToken: undefined,
        },
      },
      options: { new: false },
    });

    return { success: true };
  }

  async socialLoginCheck(type: "facebook" | "google", profile: Profile) {
    let user;

    if (type === "google") {
      if (profile && profile.emails)
        user = await this.authDataLayer.updateUser({
          docToUpdate: { googleId: { $eq: profile.id } },
          updateData: {
            lastLoginAt: { $eq: new Date() },
            email: profile.emails[0].value,
            emailVerified: true,
            googleId: profile.id,
          },
          options: {
            upsert: true,
            new: true,
            select: "mobileVerified hasSuppliedInfo _id ",
          },
        });
    }
    if (type === "facebook") {
      user = await this.authDataLayer.updateUser({
        docToUpdate: { facebookId: { $eq: profile.id } },
        updateData: {
          lastLoginAt: new Date(),
          facebookId: profile.id,
        },
        options: {
          upsert: true,
          new: true,
          select: "mobileVerified hasSuppliedInfo _id",
        },
      });
    }

    if (!user) throw new Error(`Authentication Error.`);

    return user;
  }

  async completeRegistration(data: RegistrationData) {
    const { user, firstName, lastName, birthDate, gender, address } = data;

    //Check that mobile does not exist

    const updatedData = await this.authDataLayer.updateUser({
      docToUpdate: {
        _id: { $eq: user },
      },
      updateData: {
        $set: {
          firstName,
          lastName,
          birthDate,
          gender,
          address,
          hasSuppliedInfo: true,
        },
      },
      options: { new: true, select: "_id " },
    });

    return updatedData;
  }
}

export const authService = new AuthService(UserDataLayer);

export default AuthService;
