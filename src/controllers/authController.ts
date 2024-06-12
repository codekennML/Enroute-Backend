
import { SocialAuthData } from "./../../types/types.d";
import { UserServiceLayer } from "./../services/userService";
import AuthService, { authService } from "../services/authService";
import { MobileSigninData } from "../../types/types";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import AppResponse from "../utils/helpers/AppResponse";
import AppError from "../middlewares/errors/BaseError";

import verifyGoogleToken from "../services/3rdParty/Google/auth";

import { retryTransaction } from "../utils/helpers/retryTransaction";
import { checkUserCanAuthenticate } from "../utils/helpers/canLogin";
import { Request, Response } from "express";
import { OtpServiceLayer } from "../services/otpService";

import { ClientSession } from 'mongoose';
import { removeAccessTokens, setTokens } from '../middlewares/auth/setTokens';
import { accessLogger } from "../middlewares/logging/logger";

class AuthController {
  public authService: AuthService;

  constructor(auth: AuthService) {
    this.authService = auth;
  }

  async signInUserMobile(req: Request, res: Response){

    const data: MobileSigninData  = req.body;
    const { mobile, countryCode, googleId, googleEmail } = data;
    const role  =  req.role
    const subRole =  req.subRole
   
    const { user, otp } =  await retryTransaction(this.signInMobileSession, 1 ,  { mobile,  countryCode,  role, subRole, googleId, googleEmail})

    return AppResponse(req, res, StatusCodes.OK,  { ...otp,firstName : user.firstName });
  }

  // async signInUserEmail(req:Request, res: Response){

  //   const data = await req.body 

  //   const { email, role, mobile, countryCode } = data;

  //   const user = await this.authService.signInEmail({
  //     email,
  //     role,
  //     mobile,
  //     countryCode,
  //   });

  //   //This should never happen, but since the updateUser method can return null, we should handle it here, instead of setting the resukt to not null
  //   if (!user)
  //     throw new AppError(
  //       getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
  //       StatusCodes.INTERNAL_SERVER_ERROR
  //     );

  //   checkUserCanAuthenticate(user);

  //  const otp =  await OtpServiceLayer.createOtp( { 
  //     type : "Email",
  //     subject : `${COMPANY_NAME} Verify` ,
  //     user : user._id.toString(), 
  //     next : "OTP_SCREEN",
  //     expiry : 5
  //   })

  //   return AppResponse(req, res, StatusCodes.CREATED, otp);
  // }
 
  async signInMobileSession (args : MobileSigninData, session :ClientSession) { 


    const result =  await session.withTransaction(async() => { 
      const user = await this.authService.signInMobile({
        mobile  : args.mobile, 
        countryCode  : args.countryCode, 
        googleId : args?.googleId,
        role : args.role,
        subRole : args.subRole,
        googleEmail : args.googleEmail
      }, session)

      //This should never happen, but since the updateUser method can return null, we should handle it here, instead of setting the result to not null
      if (!user)
        throw new AppError(
          getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
          StatusCodes.INTERNAL_SERVER_ERROR
        );

      checkUserCanAuthenticate(user);

      const otp = await OtpServiceLayer.createOtp({
        type: "SMS",
        mobile: args.mobile,
        countryCode :  args.countryCode,
        user: user._id.toString(),
        next: "OTP_SCREEN",
        expiry: 5
      }, session)
   
      return { user, otp}

    })
   
  return result

  }

  async verifyUserMobile (req : Request, res : Response ) {
    //This will verify the otp and the user Mobile
    const { otpId , otp} =  req.body 
     
    await retryTransaction(this.verifyMobileSession, 1, { otpId, otp}) 

 
     setTokens(req, res, req.role, req.subRole) 

     accessLogger.info(`login Event - ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]}- ${req.headers["device-info"]} `)

      return res.redirect("/home")
  
  } 

  async verifyMobileSession(args : { otpId : string, otp : number}, session  : ClientSession){ 

    const result =  await session.withTransaction(async() => { 
       
      const verifyResponse  =  await OtpServiceLayer.verifyOTPs({ 
        otpId : args.otpId, 
        otp : args.otp 

      }, session) 

      if(!verifyResponse) throw new AppError(`Invalid or expired token received`, StatusCodes.BAD_REQUEST)

      //There would only be a mobile /  countryCode in the verifyResponse if the user is trying to change their number via social login

      const user =  verifyResponse?.otpData?.user
      const next =  verifyResponse.otpData?.next
      const countryCode =  verifyResponse?.otpData?.countryCode
      const mobile =  verifyResponse?.otpData?.mobile

      if(!user && !next)  throw new AppError(`Something went wrong. Please try again`, StatusCodes.BAD_REQUEST) 
    
    const docToUpdate =  { 
      ...(user && next !== "change_social_mobile" && { _id : user }),
      ...(next === "change_social_mobile" &&  { googleId : verifyResponse?.otpData?.user, googleEmail : verifyResponse?.otpData?.email  })
    }

    const updateData =  { 
      mobileVerified : true, 
      isOnline : true,
      ...(countryCode && { countryCode }), 
      ...(mobile && { mobile })
    }

     const updatedUser = await UserServiceLayer.updateUser({
      docToUpdate ,
      updateData, 
      options : { session, new : true,  select : "_id mobileVerified"}
     }) 

     if(!updatedUser) throw new AppError(`An Error occurred. Please try again`, StatusCodes.EXPECTATION_FAILED)
    
     return updatedUser

    })

    return result
  }
  
  async logout(req : Request, res: Response) {
    const data : { user: string} = await req.body

    if (!data)
      throw new AppError(
       "An Error occurred.Please try again",
        StatusCodes.BAD_REQUEST,
        `Invalid data received for logout - ${req.user}`
      );

    const loggedOutUser = await this.authService.logout({user : data.user });
  
    accessLogger.info(`logout Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]}- ${req.headers["device-info"]} `) 

    removeAccessTokens(req)

    return AppResponse(req, res ,  StatusCodes.OK,  loggedOutUser );
  }

  // replaceExistingAccountViaMobile = async (
  //   req: Request,
  //   res: Response
  // ) => {
  //   interface AccountDataToCreate {
  //     countryCode: string;
  //     mobile: string;
  //     googleId?: string;
  //     googleEmail: string;
  //     role: ROLES;
  //     appleId?: string;
  //     appleEmail?: string;
  //     fbId?: string;
  //     fbEmail?: string;
  //     email?: string;
  //   }

  //   const data:AccountDataToCreate = await req.body

  //   const operations = [
  //     {
  //       deleteOne: {
  //         filter: {
  //           mobile: data.mobile,
  //           countryCode: data.countryCode,
  //           role: ROLES,
  //         },
  //       },
  //     },
  //     {
  //       insertOne: {
  //         document: {
  //           ...data,
  //         },
  //       },
  //     },
  //   ];

  //   const response = await retryTransaction(
  //     UserServiceLayer.bulkUpdateUser,
  //     1,
  //     {
  //       operations,
  //     }
  //   );

  //   const newUser: string = response.data?.insertedIds[0];

  //   return AppResponse(req, res, StatusCodes.OK, {
  //     message: "Account updated successfully",
  //     newUser,
  //   });
  // };

  // replaceExistingAccountViaEmail = async (
  //   req: Request,
  //   res: Response,
  // ) => {
  //   interface AccountDataToCreate {
  //     countryCode: string;
  //     mobile: string;
  //     googleId?: string;
  //     role: ROLES;
  //     appleId?: string;
  //     fbId: string;
  //     email: string;
  //   }

  //   const data = await req.body<AccountDataToCreate>(res);

  //   const operations = [
  //     {
  //       deleteOne: {
  //         filter: {
  //           email,
  //           role,
  //         },
  //       },
  //     },
  //     {
  //       insertOne: {
  //         document: {
  //           ...data,
  //         },
  //       },
  //     },
  //   ];

  //   const response = await retryTransaction(
  //     UserServiceLayer.bulkUpdateUser,
  //     1,
  //     {
  //       operations,
  //     }
  //   );

  //   const newUser: string = response.data?.insertedIds[0];

  //   return AppResponse(res, req, StatusCodes.OK, {
  //     message: "Account updated successfully",
  //     newUser,
  //   });
  // };

 async  signInWithGoogle  (req: Request, res: Response) {
   
    const data: SocialAuthData = req.body

    const { token } = data; 
    

    const userGoogleData = await verifyGoogleToken(token);

    if (!userGoogleData)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const { sub, email: googleEmail } = userGoogleData;

    const userData = await UserServiceLayer.getUsers({
     query:  { 
        googleId: { $eq: sub },
        googleEmail,
      },

      select : "googleId mobile firstName countryCode googleEmail" 
      
    });

    //Create a JWT with this data to allow for update of the mobile if necessary
    // const googleJWT =  

    const result = {
      googleId: sub,
      mobile: userData[0]?.mobile,
      countryCode: userData[0]?.countryCode,
      firstname: userData[0]?.firstName,
      googleEmail,
    };

    return AppResponse(req, res, StatusCodes.OK, result);
  }

async updateMobileOnSocialAccount(req : Request, res : Response){
    const data : { id : string ,  type : "facebook" | "google", mobile : number ,  countryCode : number, email : string  } = req.body  

     if(!data?.id || !data?.mobile || !data?.countryCode ||  !data.email ) throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST)


    const existingUsers = await UserServiceLayer.getUsers({
      query: {
        mobile: data.mobile,
        countryCode: data.countryCode
      }, select: "_id"
    })


    if (existingUsers && existingUsers.length === 1 && existingUsers[0]._id === req.user) {
      return AppResponse(req, res, StatusCodes.CONFLICT, { message: "The mobile number is already associated with your account" })
    }

    if (existingUsers.length > 0) return AppResponse(req, res, StatusCodes.CONFLICT, { message: "The mobile number is associated with another account.Please choose another" })

  const result =    await OtpServiceLayer.createOtp({ 
        type : "SMS", 
        user : data?.id,
        mobile :  parseInt(`${data.countryCode} ${data.mobile}`),
        next : "change_social_mobile", 
        email : data.email,
        expiry : 5
      })

    return AppResponse(req, res, StatusCodes.OK, { message : "Otp  sent successfully", data : result})


  }
 




}
export const authController = new AuthController(authService);

export default AuthController;
