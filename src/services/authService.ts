import { IUserModel } from "./../model/user";

import UserRepository, { UserDataLayer } from "../repository/user";
import { MobileSigninData } from "../../types/types";
// import { authLogger } from "../model/logging/logger";
import AppError from "../middlewares/errors/BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

import { checkUserCanAuthenticate } from "../utils/helpers/canLogin";

import { USER } from "../config/enums";

class AuthService {
  public authDataLayer: UserRepository;

  constructor(authRepositoryClass: UserRepository) {
    this.authDataLayer = authRepositoryClass;
  }

  async signInMobile(request: MobileSigninData) {
    const { mobile, countryCode, role = USER.rider } = request;

    const user = await this.authDataLayer.updateUser({
      docToUpdate: {
        mobile: { $eq: mobile },
        countryCode: { $eq: countryCode },
      },
      updateData: {
        $set: {
          roles: role,
        },
      },
      options: {
        new: true,
        select:
          "mobileVerified mobile firstname _id email lastname countryCode",
        upsert: true,
      },
    });

    //An upserted account wont have a "mobileVerified" field
    return user;
  }

  // async signInGoogle(){

  // }

  // async signInApple(){

  // }

  // async signInFacebook(){

  // }

  // async Logout() {

  // }

  // async revokeTokens(){

  // }
}

export const authService = new AuthService(UserDataLayer);

export default AuthService;
