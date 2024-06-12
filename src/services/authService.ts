
import UserRepository, { UserDataLayer } from "../repository/user";
import {  MobileSigninData } from "../../types/types";
import { ClientSession} from "mongoose";
// import { authLogger } from "../model/logging/logger";




class AuthService {
  public authDataLayer: UserRepository;

  constructor(authRepositoryClass: UserRepository) {
    this.authDataLayer = authRepositoryClass;
  }

  async signInMobile(request: MobileSigninData ,  session : ClientSession) {
    const { mobile, countryCode, role, subRole,  googleId} = request;

    const user = await this.authDataLayer.updateUser({
      docToUpdate: {
        mobile: { $eq: mobile },
        countryCode: { $eq: countryCode },
        ...(googleId && { googleId : { $eq : googleId}})
      },
      updateData: {
        $set: {
          roles: role,
          subRole : subRole
        },
      },
      options: {
        new: true,
        session,
        select:
          "mobileVerified mobile firstname _id email lastname countryCode banned suspended",
        upsert: true,
      },
    });

    //An upserted account wont have a "mobileVerified" field
    return user;
  }


  // async signInEmail(request: EmailSigninData) {
  //   const { mobile, countryCode, role,  email } = request;

  //   const user = await this.authDataLayer.updateUser({
  //     docToUpdate: {
  //       email : {  $eq : email },
  //       mobile: { $eq: mobile },
  //       countryCode: { $eq: countryCode },
  //     },
  //     updateData: {
  //       $set: {
  //         roles: role,
  //       },
  //     },
  //     options: {
  //       new: true,
  //       select:
  //         "mobileVerified mobile firstname _id email lastname countryCode banned suspended",
  //       upsert: true,
  //     },
  //   });

  //   //An upserted account wont have a "mobileVerified" field
  //   return user;
  // }

  // async signInGoogle(request) {

  // }

  async logout(request : { user : string }) {
      const { user }  = request  
    

      const updatedUser  = await this.authDataLayer.updateUser({ 
        docToUpdate : { _id : { $eq : user }}, 
        updateData : { 
            isOnline : false 
        }, 
        options : { 
          select : "_id "
        }
      }
  )
  return updatedUser
  }

  async revokeTokens() {

  }
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
