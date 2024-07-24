
import { SocialAuthData } from "./../../types/types.d";
import { UserServiceLayer } from "./../services/userService";
import AuthService, { authService } from "../services/authService";

import { getReasonPhrase, StatusCodes } from "http-status-codes";
import AppResponse from "../utils/helpers/AppResponse";
import AppError from "../middlewares/errors/BaseError";

import verifyGoogleToken from "../services/3rdParty/Google/auth";


import { checkUserCanAuthenticate } from "../utils/helpers/canLogin";
import { Request, Response } from "express";
import { OtpServiceLayer } from "../services/otpService";
import { removeAccessTokens, setTokens } from '../middlewares/auth/setTokens';
import { accessLogger } from "../middlewares/logging/logger";
import { IUser } from "../model/interfaces"

import { Types } from "mongoose";
import { ROLES } from "../config/enums";


class AuthController {
    public authService: AuthService;

    constructor(auth: AuthService) {
        this.authService = auth;
    }
    async signInMobile(req : Request, res : Response ) { 
   
        const data :  { mobile : number , countryCode : number  } = req.body 

        let user: (IUser & { _id: Types.ObjectId })[] = []    

           user  = await UserServiceLayer.getUsers({ 
            query : { countryCode : data.countryCode, mobile : data.mobile } ,
            select : "_id mobileVerified"
        }) 

        if(!user || user?.length === 0 ) {
            //Create the user and send them an otp  
            user  = await UserServiceLayer.createUser({
             mobile : data.mobile, 
             countryCode : data.countryCode, 
             roles : req.role, 
             ...(req?.subRole  && { subRole : req.subRole}),
             mobileVerified : false , 
             emailVerified : false, 
             active : true,
             verified : false, 
             status : "new"
            }
            )

        }

        checkUserCanAuthenticate(user[0])


        const otpInfo  =  await OtpServiceLayer.createOtp({ 
            type : "SMS",
            mobile : data.mobile,
            countryCode : data.countryCode,
            next : "otpscreen", 
            user : user[0]._id.toString(),
            expiry : 10
        })
    
        if(!otpInfo || !otpInfo.otpId) throw new AppError(`Something went wrong. Please try again`, StatusCodes.INTERNAL_SERVER_ERROR)

        //Send the otp from here 

        return AppResponse(req, res, StatusCodes.OK, { 
            message : "user retrieved successfully",
            data: { otpId: otpInfo.otpId, firstName: user[0]?.firstName, mobileVerified : user[0]?.mobileVerified }
        })
    }

    async signInEmail(req: Request, res : Response) { 

       const data : { email : string  } =  req.body  

        let userWithEmail: (IUser & { _id: Types.ObjectId })[] = []

      userWithEmail=  await UserServiceLayer.getUsers({ 
        query : { email : { $eq : data.email }}, 
        select : "mobile countryCode mobileVerified _id firstname"
       }) 


       if(!userWithEmail || userWithEmail.length === 0 ){

           userWithEmail = await UserServiceLayer.createUser({
               email : data.email,
               roles: req.role,
               ...(req?.subRole && { subRole: req.subRole }),
               mobileVerified: false,
               emailVerified: false,
               active: true,
               verified: false,
               status: "new"
           }
           )
       }
        
        checkUserCanAuthenticate(userWithEmail[0])
       //This will mean the user has a verified mobile already, so we send an otp to the otpEndpoint , with the mobile number associated with the email account

        const otpInfo = await OtpServiceLayer.createOtp({
            type: "SMS",
            mobile: userWithEmail[0].mobile,
            user : userWithEmail[0]._id.toString(),
            countryCode : userWithEmail[0].countryCode,
            next: userWithEmail[0]?.firstName ? "nameAuth" : "home",
            expiry: 10
        })

        return AppResponse(req, res, StatusCodes.OK, { message: "User data retrieved successfully", data: {otpId : otpInfo.otpId, firstName : userWithEmail[0]?.firstName  } })
    }



    async signInGoogle(req : Request, res :Response  ){ 

        const data: SocialAuthData = req.body

        const { token } = data;

        const userGoogleData = await verifyGoogleToken(token);

        if (!userGoogleData)
            throw new AppError(
                getReasonPhrase(StatusCodes.BAD_REQUEST),
                StatusCodes.BAD_REQUEST
            );

        const { sub, email: googleEmail } = userGoogleData;

         
        let googleUser : (IUser & { _id : Types.ObjectId})[] =  []

        googleUser  =  await UserServiceLayer.getUsers({ 
          query : { 
              googleId: { $eq: sub },
              googleEmail,

          }, 

        })

        if(!googleUser){ 
            const createdUser = await UserServiceLayer.createUser(
                 {
                    googleId: { $eq: sub },
                    googleEmail,
                        mobileVerified : false , 
                        emailVerified : true , 
                        status : "new",
                        role: req.role,
                        ...(req.subRole && { subRole: req.subRole }),
                        active: true,
                        emailVerifiedAt: new Date(),
                
                    
                    }
            );

            if (!googleUser) throw new AppError("An Error Occured. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

         googleUser = createdUser
        }

     
    
        checkUserCanAuthenticate(googleUser[0])

        const result = {
            user : googleUser[0]._id,
            sub,
            mobile: googleUser[0]?.mobile,
            countryCode: googleUser[0]?.countryCode,
            firstname: googleUser[0]?.firstName,
          
        };

        return AppResponse(req, res, StatusCodes.OK, result);
    }

    async checkUserMobileInputDuplicateAccount (req : Request, res : Response ) {

     const data :  { mobile : number, countryCode : number, otpType : "WhatsApp" | "SMS", user? : string, email? : string } =  req.body

     const users =  await UserServiceLayer.getUsers({ 

        query : { 

         countryCode : { $eq : data.countryCode }, 
         mobile : { $eq : data.mobile }
        }, 
        select : "_id  email"
     })

     //Create the otp for the record and redirect to the duplicate account screen on completion of verification of the otp
     
    const hasDuplicateAccount =  users.length > 0  && ( (data?.user && users[0]._id?.toString() !== data?.user)  || (data?.email && users[0]?.email !==  data?.email) )

     const otpData =  await OtpServiceLayer.createOtp({ 
        type : data.otpType, 
        mobile : data.mobile, 
        countryCode : data.countryCode, 
        expiry : 5 , 
         ...(hasDuplicateAccount && { next: "DuplicateAccountScreen" } )
     }) 


     return AppResponse(req, res, hasDuplicateAccount ? StatusCodes.CONFLICT : StatusCodes.OK, { 
         message: ` ${hasDuplicateAccount ? "Duplicate account found" : "No duplicate accounts found" } `,
        data : { 
            users : [ users[0]._id], 
            otpId : otpData?.otpId
        }
     })

    }

    // async archiveUnselectedDuplicateAccount(req : Request,  res : Response ){
       
    // const data : {  otpId : string ,  accountId, userId : string } =  req.body  

    // const otpData =  await OtpServiceLayer.getOtps({
    //     query : { 
    //         _id : data.otpId,  
    //         next : "DuplicateAccountScreen"
    //     }
    // })

    // if(!otpData || otpData?.length < 1 ) throw new Error("Something went wrong. Please try again ") 


    // }
  
    async verifyAccountViaMobile (req : Request, res : Response){ 
        //Once this happens a user can have their tokens set, 
        const data : { otpId  : string,  otp : number, isNonMobileSignup : boolean,
        
        } = req.body  


        const otpData  =  await OtpServiceLayer.verifyOTP({
            otpId : data.otpId, 
            otp : data.otp
        })

        console.log(otpData)
        if(!otpData ||  !otpData?.otpData) throw new AppError(`Something went wrong. Please try again`, StatusCodes.INTERNAL_SERVER_ERROR) 

        const users = await UserServiceLayer.getUsers({

            query: {

                countryCode: { $eq: otpData.otpData.countryCode },
                mobile: { $eq: otpData.otpData.mobile }
            },
            select: "_id  email firstName roles"
        })

        const hasDuplicateAccount = users.length > 0 && ((otpData.otpData?.user && users[0]._id?.toString() !== otpData.otpData?.user?.toString()))

       

        const user =  await UserServiceLayer.getUserById(otpData.otpData.user!.toString(), "firstName roles")

       

        if(!user) throw new AppError("Something went wrong. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)


        //Prevent a normal from assuming the roles of an admin or a role higher than its roles
        if (!(users[0]?.roles in [ROLES.DRIVER, ROLES.RIDER]) || users[0].roles > user.roles) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

        if (!hasDuplicateAccount && data.isNonMobileSignup) {
            //Set the mobile and countryCode on the user data 

            await UserServiceLayer.updateUser({
                docToUpdate: {
                    _id: otpData?.otpData?.user,

                },
                updateData: {
                    mobile: otpData.otpData.mobile!, 
                    countryCode : otpData.otpData!.countryCode!,
                    isOnline : true

                }, 
                options : { new : false }
            })
        }

       if(!hasDuplicateAccount && user?.firstName) { 

           await UserServiceLayer.updateUser({
               docToUpdate: {
                   _id: otpData?.otpData?.user,

               },
               updateData: {
                 
                    isOnline: true

               },
               options: { new: false }
           })

         setTokens(req, res, req.role, req.subRole)
        //    return res.redirect("/home")

        return AppResponse(req, res, StatusCodes.OK, { 
            message : "User authenticated succesfully", 
            data : { 
                next : "home"
            }
        })
     
   
       }
       if(!hasDuplicateAccount && !user?.firstName){ 

           await UserServiceLayer.updateUser({
               docToUpdate: {
                   _id: otpData?.otpData?.user,

               },
               updateData: {
                   
                    isOnline: true

               },
               options: { new: false }
           })

           setTokens(req, res, req.role, req.subRole)

           accessLogger.info(`login Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]} `)
      
           return AppResponse(req, res, StatusCodes.OK, {
               message: "User authenticated succesfully",
               data: {
                   next: "nameAuth"
               }
           })

       }

          return AppResponse(req, res, StatusCodes.CONFLICT, { 
            message : "Duplicate account found", 
            data : { 
                next : "duplicateAccount",
                users , 
                userId : otpData.otpData.user,
                isNonMobileSignup : data.isNonMobileSignup,
                mobile : otpData?.otpData?.mobile,
                countryCode: otpData?.otpData?.countryCode,
              
            }
          })
       
    }


    async handleDuplicateAccount (req : Request,  res : Response) {
       
        const data: { user: string, isNonMobileSignup: boolean, selectedAccount: { _id: string, firstName?: string }, accountToArchive: { _id: string, firstName?: string }, mobile : number ,  countryCode : number  }   = req.body 

        const accounts = await UserServiceLayer.getUsers(
            { 
                query : { 
                    _id : { $in :  [ data.selectedAccount._id, data.accountToArchive._id]}
                }, 
                select : "roles"
            }
        ) 

    
          const roles =  accounts.map(account => account.roles)  
          
          if(roles[0] !== roles[1] || !(roles[0] in [ROLES.DRIVER, ROLES.RIDER]) || !(roles[1] in [ROLES.DRIVER, ROLES.RIDER]) ) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


        
        const  updatedUsers  =  await UserServiceLayer.bulkUpdateUser([
            {
                updateOne : { 
                    filter  : { _id : data.accountToArchive._id} ,
                    update : {archived : true }
                }
            }, 

          {  ...(data.isNonMobileSignup && {
                updateOne: {
                    filter: { _id: data.selectedAccount._id },
                    update: { mobile : data.mobile, countryCode : data.countryCode }
                }
            })}, 
              { 
                updateOne: {
                  filter: { _id: data.selectedAccount._id }, update : { 
                    isOnline : true
                  }
                }
            }

        ])
 
     if(!updatedUsers) throw new AppError("An Error occurred. Please try again.", StatusCodes.INTERNAL_SERVER_ERROR)


    req.user =  data.selectedAccount._id

    if(!data.selectedAccount?.firstName){

        setTokens(req, res, req.user , req.role, req.subRole)

        accessLogger.info(`login Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]} `)
        //    return res.redirect("/home")

        return AppResponse(req, res, StatusCodes.OK, {
            message: "User authenticated succesfully",
            data: {
                next: "nameAuth"
            }
        })
    }
//Change the request user to the selectedAccount User since the user may select the other account
         req.user =  data.selectedAccount._id

        setTokens(req, res, data.selectedAccount._id, req.role, req.subRole)
        //    return res.redirect("/home")
        accessLogger.info(`login Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]} `)

        return AppResponse(req, res, StatusCodes.OK, {
            message: "User authenticated succesfully",
            data: {
                next: "home"
            }
        })


    }
  
 

    async logout(req: Request, res: Response) {
        const data: { user: string } = await req.body

        if (!data)
            throw new AppError(
                "An Error occurred.Please try again",
                StatusCodes.BAD_REQUEST,
                `Invalid data received for logout - ${req.user}`
            );

        const loggedOutUser = await this.authService.logout({ user: data.user });

        accessLogger.info(`logout Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]} `)

        removeAccessTokens(req)

        return AppResponse(req, res, StatusCodes.OK, loggedOutUser);
    }



    

}
export const authController = new AuthController(authService);

export default AuthController;
