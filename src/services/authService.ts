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

      // const link = `${process.env.PRIME_COMPANY_URL}/${createdUser[0]._id}/${activationToken}`;
      result.success = true;
      result.data.user = createdUser[0]._id.toString();
      result.data.email = createdUser[0].email;

      // result.actlink =  link

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

      if (
        !currentUsers ||
        !currentUsers[0] ||
        currentUsers[0].mobile !== mobile
      )
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

  // async authenticateUser(request: {
  //   user: string;
  //   shouldVerify: boolean;
  //   clientDevice: string;
  //   clientIp: string;
  //   userDeviceIdentifier: string;
  // }) {
  //   const transformedIP = transformIP(request.clientIp);

  //   const userAccessData = await userAccessDataLayer.findAccess({
  //     query: { _id: { $eq: request.user } },
  //     select: "devices  ipAddresses",
  //   });

  //   if (
  //     !userAccessData ||
  //     !userAccessData[0] ||
  //     userAccessData[0].user.toString() !== request.user
  //   )
  //     throw new AppError(
  //       `Something went wrong. Please try again later. If this issue persists, Please contact support.`,
  //       StatusCodes.BAD_REQUEST,
  //       `No access records found for user -  ${request.user} - ip  -  ${request.clientIp} - device : ${request.clientDevice}`
  //     );

  //   const updateData: Partial<IUserAccess> = {};

  //   let needsUpdate: boolean = false;

  //   //If this is a new device
  //   if (!userAccessData[0].devices?.[`${request.clientDevice}]`]) {
  //     needsUpdate = true;

  //     updateData.devices = {
  //       ...userAccessData[0].devices,
  //       [`${request.clientDevice}`]: {
  //         blacklisted: false,
  //         susAttempts: 1,
  //         lastLoginAt: new Date(),
  //       },
  //     };
  //   }

  //   //If this is a new ip addresss

  //   if (!userAccessData[0].ipAddresses?.[`${transformedIP}`]) {
  //     needsUpdate = true;

  //     updateData.ipAddresses = {
  //       ...userAccessData[0].ipAddresses,
  //       [`${transformedIP}`]: {
  //         blacklisted: false,
  //         susAttempts: 1,
  //         lastLoginAt: new Date(),
  //       },
  //     };
  //   }

  //   const isUnknownData = request.clientDevice !== request.userDeviceIdentifier;

  //   if (needsUpdate || isUnknownData) {
  //     //Update the accessLog with the current login
  //     await userAccessDataLayer.updateAccess({
  //       docToUpdate: {
  //         user: { $eq: request.user },
  //       },
  //       updateData,
  //       options: { upsert: true },
  //     });

  //     if (isUnknownData) {
  //       authLogger.info(
  //         `Intruder Alert :  for account with userId -  ${request.user} -  susIP  -  ${request.clientIp} - clientDevice - ${request.clientDevice} `
  //       );
  //     } else {
  //       authLogger.info(
  //         `Potential intruder for account with userId -  ${request.user} -  susIP  -  ${request.clientIp}`
  //       );
  //     }
  //   }

  //   // Create access  & refresh token
  //   const accessToken = createJWTAuthToken(
  //     { user: request.user },
  //     process.env.ACCESS_TOKEN_SECRET as string,
  //     "15m"
  //   );
  //   //Create refreshToken
  //   const refreshToken = createJWTAuthToken(
  //     { user: request.user },
  //     process.env.ACCESS_TOKEN_SECRET as string,
  //     "90d"
  //   );

  //   //We need to reencrypt the refresh token for double scrutiny

  //   const encryptedRefreshToken = hashCryptoToken(refreshToken);

  //   const userData = {
  //     x_auth_data: encryptedRefreshToken,
  //     device: request.userDeviceIdentifier,
  //     allow: true,
  //   };

  //   //Whitelist the current refresh token and invalidate others, also ,
  //   const userRTCacheIdentifier = `access_identifier:${request.user}`;

  //   //Set keydb to handle the refreshtoken whitelist

  //   await authCache.set(userRTCacheIdentifier, JSON.stringify(userData));

  //   const update = {
  //     docToUpdate: {
  //       _id: { $eq: request.user },
  //     },
  //     updateData: {
  //       $set: {
  //         lastLoginAt: new Date(),
  //       },
  //     },
  //     options: { new: true, select: "roles email avatar _id" },
  //   };

  //   if (request.shouldVerify)
  //     Object.assign(update.updateData.$set, { mobileVerified: true });

  //   const user = await this.authDataLayer.updateUser(update);

  //   if (!user) throw new AppError(``, StatusCodes.NOT_FOUND, ``);

  //   const result = {
  //     accessToken,
  //     refreshToken: encryptedRefreshToken,
  //     _id: user._id,
  //     email: user?.email,
  //     avatar: user.avatar,
  //     roles: user.roles,
  //   };

  //   return result;
  // }

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
