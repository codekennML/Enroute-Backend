
import { SocialAuthData } from "./../../types/types.d";
import { UserServiceLayer } from "./../services/userService";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import AppResponse from "../utils/helpers/AppResponse";
import AppError from "../middlewares/errors/BaseError";
import verifyGoogleToken from "../services/3rdParty/Google/auth";
import { checkUserCanAuthenticate } from "../utils/helpers/canLogin";
import { Request, Response } from "express";
import { OtpServiceLayer } from "../services/otpService";
import { removeAccessTokens, setTokens } from '../middlewares/auth/setTokens';
import { accessLogger, authLogger } from "../middlewares/logging/logger";
import { IUser } from "../model/interfaces"
import { ClientSession, Types } from "mongoose";
import { excludeEnum, ROLES, SUBROLES } from "../config/enums";
import { COMPANY_NAME } from "../config/constants/base";
import { retryTransaction } from "../utils/helpers/retryTransaction";

class AuthController {
  

  constructor() {}

  async signInMobile(req: Request, res: Response) {

    console.log(req.role)

    const data: { mobile: number, countryCode: number } = req.body

    let user: (IUser & { _id: Types.ObjectId })[] = []

    user = await UserServiceLayer.getUsers({
      query: { countryCode: data.countryCode, mobile: data.mobile,  archived : false },
      select: "_id mobileVerified roles"
    })


    
    if(user &&  user?.length > 0  &&  user[0]) {

      const errorMessage  = "This mobile number is associated with another account.If this is your account :  <br/> Please ensure you are on the appropriate application interface. <br /> otherwise : </br> Register using a different mobile number"
    console.log(req.role, user[0].roles, 'micc')
       if(req.role !== user[0].roles)
   //Trying to access the user profile for one app on the other app 
  //e.g a driver trying to use their driver mobile on the rider app
        throw new AppError(errorMessage, StatusCodes.FORBIDDEN)
     }


//If the user was
    if (!user || user?.length === 0 ) {
      //Create the user and send them an otp  
      user = await UserServiceLayer.createUser({
        mobile: data.mobile,
        countryCode: data.countryCode,
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
    console.log("user", user[0])
    checkUserCanAuthenticate(user[0])


    const otpInfo = await OtpServiceLayer.createOtp({
      type: "SMS",
      mobile: data.mobile,
      countryCode: data.countryCode,
      user: user[0]._id.toString(),
      expiry: 10
    })

    if (!otpInfo || !otpInfo.otpId) throw new AppError(`Something went wrong. Please try again`, StatusCodes.INTERNAL_SERVER_ERROR)

    //Send the otp from here 

    return AppResponse(req, res, StatusCodes.OK, {
      message: "user retrieved successfully",
      data: { otpId: otpInfo.otpId, firstName: user[0]?.firstName, mobileVerified: user[0]?.mobileVerified, next : "otpscreen" }
    })
  }

  async signInEmail(req: Request, res: Response) {

    const data: { email: string } = req.body

    let userWithEmail: (IUser & { _id: Types.ObjectId })[] = []


    userWithEmail = await UserServiceLayer.getUsers({
      query: { 
        email: { $eq: data.email } ,
         archived : { $eq : false}  },
      select: "mobile countryCode _id firstname roles"
    })
 
    if(userWithEmail && userWithEmail?.length > 0 &&  userWithEmail[0]) {
     const errorMessage  = "This email is associated with another account.If this is your account. If this is your account :  <br/> Please ensure you are on the appropriate application interface. <br /> otherwise : </br> Register using a different email addresss"
console.log(userWithEmail)

      if(req.role !== userWithEmail[0].roles)
  //Trying to access the user profile for one app on the other app 
 //e.g a driver trying to use their driver email on the rider app
          throw new AppError(errorMessage, StatusCodes.FORBIDDEN)
    }

    if (!userWithEmail || userWithEmail.length === 0) {

      userWithEmail = await UserServiceLayer.createUser({
        email: data.email,
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

    if(userWithEmail[0]?.mobile && userWithEmail[0]?.countryCode){
      //Send otp to the mobile
      const otpInfo = await OtpServiceLayer.createOtp({
        type: "SMS",
        mobile: userWithEmail[0]?.mobile,
        countryCode: userWithEmail[0]?.countryCode,
        user: userWithEmail[0]._id.toString(),
        expiry: 10
      })

      if (!otpInfo || !otpInfo.otpId) throw new AppError(`Something went wrong. Please try again`, StatusCodes.INTERNAL_SERVER_ERROR)

      return AppResponse(req, res, StatusCodes.OK, { message: "User data retrieved successfully", data: { otpId: otpInfo.otpId, firstName: userWithEmail[0]?.firstName } })

    } 

 
    const otpInfo = await OtpServiceLayer.createOtp({
      type: "Email",
      email : data.email,
      subject : `${COMPANY_NAME} Verification`,
      user: userWithEmail[0]._id.toString(),
      next: "mobileentry",
      expiry: 10
    })

    return AppResponse(req, res, StatusCodes.OK, { message: "User data retrieved successfully", data: { otpId: otpInfo.otpId, firstName: userWithEmail[0]?.firstName, emailVerified : userWithEmail[0]?.emailVerifiedAt, next : "otpScreen"} })
  }
  async signInGoogle(req: Request, res: Response) {

    const data: SocialAuthData = req.body

    const { token } = data;

    const userGoogleData = await verifyGoogleToken(token);

    if (!userGoogleData)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const { sub, email: googleEmail } = userGoogleData;


    let googleUser: (IUser & { _id: Types.ObjectId })[] = []

    googleUser = await UserServiceLayer.getUsers({
      query: {
        googleId: { $eq: sub },
        googleEmail,

      },

    })

    if (!googleUser) {
      const createdUser = await UserServiceLayer.createUser(
        {
          googleId: { $eq: sub },
          googleEmail,
          mobileVerified: false,
          emailVerified: true,
          status: "new",
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
      user: googleUser[0]._id,
      sub,
      mobile: googleUser[0]?.mobile,
      countryCode: googleUser[0]?.countryCode,
      firstname: googleUser[0]?.firstName,

    };

    return AppResponse(req, res, StatusCodes.OK, result);
  }

  checkDuplicateAccountOfAnotherRole = async (req : Request,  res : Response) => {


    const data : { countryCode : number, mobile : number, user : string} = req.body
 
    const query : Record<string, object>[] = [
    
      {
        _id: { $eq: new Types.ObjectId(data.user)},
        archived: { $eq: false }

      },
      {
        countryCode: { $eq: data.countryCode },
        mobile: { $eq: data.mobile },
      }
      
    ]

   
    const users = await UserServiceLayer.getUsers({

      query: {
        $or: query
      },
      select: "_id roles"
    })


    if(!users) throw new AppError("An Error occured. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

    const errorMessage = `This mobile number is associated with another account. Please try another number`


      const roles = users.map(user => user.roles)

      //There should only ever be two users matching this data
console.log(users, roles)
  if(users.length > 1){
      if (roles[0] !== roles[1]) {
      
        throw new AppError(errorMessage, StatusCodes.CONFLICT)
      } 
    }

    return AppResponse(req, res, StatusCodes.OK, {
      message: ` No duplicate accounts matching another role was  found `,

    })
  }

  
 async verifyUserEmail(req : Request, res : Response){
   //This is for new emails, instead of using verify otp, we need to set the email as verified
  const data : {otpId : string, otp : number } = req.body


 const updateEmailSession =  async (args : typeof data , session : ClientSession)    => {

   

  const result =   await session.withTransaction(async() => {
       
      const otpData =     await OtpServiceLayer.verifyOTP({
      otpId:     args.otpId, 
       otp :   args.otp
      }, session)
    
      console.log(otpData)
   
   if(!otpData || !otpData.otpData?.user) throw new AppError("Invalid or expired token received", StatusCodes.INTERNAL_SERVER_ERROR)

  
  if(req.role !== otpData.otpData.user?.roles){
    //This user is trying to sign 
    throw new AppError("We are unable to process this request at this time. Please try again later ", StatusCodes.FORBIDDEN, "Potential intruder trying to access an account from the wrong interface ")
  }
  
  if(!otpData?.otpData?.user?.emailVerifiedAt){
    // console.log("here", otpData?.otpData.user?.emailVerifiedAt)
    
  
    const user =    await UserServiceLayer.updateUser({
     docToUpdate : { _id : { $eq : otpData.otpData.user._id?.toString()}}, 
     updateData : {
      $set : { 
        emailVerifiedAt : new Date()
      }
     }, 
     options : { new : true, session,  select : "_id roles email"}
    })

    if(!user) throw new AppError("Email verification failed. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

    
      return { 
        _id :  user._id ,
        roles  : user.roles,
        email : user.email 
      }

     
    }
  
    return   { 
      _id : otpData.otpData.user?._id, 
      roles : otpData.otpData.user?.roles, 
      email : otpData.otpData.user?.email,
      verified : true

     }
       
     })
  return result
}
 
  const response = await retryTransaction(updateEmailSession, 1  , data)

  if(!response) throw new AppError("An error occurred. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)
   
  return AppResponse(req, res,StatusCodes.OK, { 
    message : `${response?.verified ? "Email already verified" : "Email verified sccessfully"}`, 
    data : {
      ...response,  
      next : "mobileentry"
    }
  })
 }

 async verifyAccountViaMobile(req: Request, res: Response) {
    //Once this happens a user can have their tokens set, 
    const data: {
      otpId: string, otp: number, isNonMobileSignup: boolean,
      deviceId : string , deviceOS : string , deviceBrowser : string, deviceIP : string 
    } = req.body

   
    const currentDevice = data.deviceId ?  `${data.deviceOS}-${data.deviceId}` : `${data.deviceOS}-${data.deviceBrowser}`

    const otpData = await OtpServiceLayer.verifyOTP({
      otpId: data.otpId,
      otp: data.otp
    })


console.log(otpData, "dhhdh")


    if (!otpData || !otpData?.otpData) throw new AppError(`Invalid or Expired token `, StatusCodes.BAD_REQUEST)
 
    if(!req.role && !excludeEnum(ROLES,[ROLES.DRIVER, ROLES.RIDER]).includes(otpData.otpData.user?.roles) ||  req.role !== otpData.otpData.user?.roles  ){
        //This user is trying to sign 
        throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN, "Potential intruder trying to access an account from the wrong interface")
      }
      
    const users = await UserServiceLayer.getUsers({
      query: {
        countryCode: { $eq: otpData.otpData.countryCode },
        mobile: { $eq: otpData.otpData.mobile }
      },
      select: "_id  email firstName roles"
    })
   

    const hasDuplicateAccount = users.length > 0 && ((otpData.otpData?.user && users[0]._id.toString() !== otpData.otpData.user?._id.toString()))

    //Check again that there wasnt another user of another role created with this number, this should have been checked earlier with the checkDuplicateAccount, but we are redoing this check incase a user tries to create an account with the driver app and rider app at the same time to exploit and game the system 

    
    const isExistingUserWithAnotherRole = users.length > 0 && ((otpData.otpData?.user && users[0].roles !== otpData.otpData?.user.roles))

    if (isExistingUserWithAnotherRole) throw new AppError("An error occurred. Please try again later.", StatusCodes.FORBIDDEN, `User - ${otpData.otpData?.user} attempt to create another account with details of user - ${users[0]?._id} for another role` )
  
    
    const isKnownDevice = otpData.otpData.user?.devices ? otpData.otpData.user?.devices?.includes(currentDevice) : true 
    
    const updateData : Record<string, string | object> = {
      $addToSet: {
        devices: currentDevice
      }
    }

      if(data.isNonMobileSignup) {
    updateData["$set"] = 
       {
        mobile: otpData.otpData.mobile!,
        countryCode: otpData.otpData!.countryCode!,
        mobileVerifiedAt : new Date()
      } 
    }
   
    if (!hasDuplicateAccount) {
      //Set the mobile and countryCode on the user data 

      await UserServiceLayer.updateUser({
        docToUpdate: {
          _id: otpData?.otpData?.user._id,

        },
        updateData ,
        options: { new: false }
      })

      
    await setTokens(req, res, otpData.otpData.user._id, req.role, req.subRole)


      if(!isKnownDevice){
        authLogger.info(`Login from unknown device - ${currentDevice} - ip : ${data.deviceIP} - user - ${otpData.otpData.user._id}`)
      }
   
      accessLogger.info(`login Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]} `)

      return AppResponse(req, res, StatusCodes.OK, {
        message: "User authenticated succesfully",
        data: {
          next: otpData?.otpData?.user?.firstName ? "home" : "nameAuth"
        }
      })
    }

  
    return AppResponse(req, res, StatusCodes.CONFLICT, {
      message: "Duplicate account found",
      data: {
        next: "duplicateAccount",
        users,
        userId: otpData.otpData.user,
        isNonMobileSignup: data.isNonMobileSignup,
        mobile: otpData?.otpData?.mobile,
        countryCode: otpData?.otpData?.countryCode,

      }
    })

 }


  async handleDuplicateRolesAccount(req: Request, res: Response) {

    const data: { user: string, isNonMobileSignup: boolean, selectedAccount: { id: string, firstName?: string }, accountToArchive: { id: string, firstName?: string },  deviceId: string, deviceOS: string, deviceBrowser: string, deviceIP: string } = req.body


    const accounts = await UserServiceLayer.getUsers(
      {
        query: {
          _id: { $in: [data.selectedAccount.id, data.accountToArchive.id] }
        },
        select: "roles subRole devices mobile countryCode"
      }
    )
    
    
    const roles = accounts.map(account => account.roles)

   

    //First check ,  is the role on the selectedAccount greater than the account to archive Role and any of the roles is not in driver || rider, it means the user wants to upgrade to an admin role which should not be possible
    
    const isDriverOrRider = roles.every((role : number) => [ROLES.DRIVER, ROLES.RIDER].includes(role))

    //Second ensure the user cannot go above their roles, or subrole

    const mobileNumber  =  accounts[0]?.mobile ? accounts[0].mobile : accounts[1].mobile as number

    const countryCode = accounts[0]?.countryCode ? accounts[0].countryCode : accounts[1].countryCode as number

    if(roles[0] !== roles[1] ||  !isDriverOrRider) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

  
    const updateUserSession =  async (args : typeof data & {device:string, mobile : number , countryCode : number  } , session : ClientSession) => {

      const result  = await session.withTransaction(async()=> {
      
        await UserServiceLayer.updateUser({
       docToUpdate : { 
  _id :  new Types.ObjectId(args.accountToArchive.id)
}, 
updateData : { 
  $set : { 
    archived:  true , 
   accessTokenExpiresAt: new Date(Date.now()) ,
   active: false, 
  }, 
  $unset : {
    mobile: 1,  countryCode: 1, googleId: 1, googleEmail: 1, email: 1, refreshToken: 1, 
    mobileAuthId : 1
  }
  
  },

    options : { session ,  new : true, select : "archived mobile email" }
        })
   
        //If this is an email or google signup, we need to update the user mobile and countryCode, we can safely assume that if this is not a nonMobileSignup, the mobile number will be same as the existing account , for there to have been a duplicate, so no need to update the mobile, also we do not want an intruder to be able to call this endpoint and be able to change the mobile of a user with their own inputs
       const updateData : Record<string , object>  =  
        {
          $addToSet : {
            devices : args.device
          }
        }
       

        if (args.isNonMobileSignup) updateData["$set"] = 
           {
              mobile: args.mobile,
              countryCode: args.countryCode,
              mobileVerifiedAt  : new Date()
            }
          


         const user  =     await UserServiceLayer.updateUser({
          docToUpdate: {
            _id:  new Types.ObjectId(args.selectedAccount.id) 
          },
          updateData,
          options: { session, new: true, select : "firstName _id devices mobile countryCode" }
        })
        console.log(user)
       
        return user
        

    })

    return result 
    }

    const currentDevice = data.deviceId ? `${data.deviceOS}-${data.deviceId}` : `${data.deviceOS}-${data.deviceBrowser}`

    const updatedUsers = await retryTransaction(updateUserSession, 1, { ...data, countryCode , mobile : mobileNumber, device: currentDevice}  )

    if (!updatedUsers) throw new AppError("An Error occurred. Please try again.", StatusCodes.INTERNAL_SERVER_ERROR)

  
    req.user = data.selectedAccount.id

    await setTokens(req, res, data.selectedAccount.id, req.role, req.subRole)
    //    return res.redirect("/home")
    authLogger.info(`DuplicateAccount - archived ${data.accountToArchive.id} - active - ${data.selectedAccount.id}`)

    accessLogger.info(`login Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]} `)



    if (!updatedUsers?.firstName) {

     await setTokens(req, res, req.user, req.role, req.subRole)

      accessLogger.info(`login Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]} `)
      //    return res.redirect("/home")
      console.log("L11")
      return AppResponse(req, res, StatusCodes.OK, {
        message: "User authenticated succesfully",
        data: {
          next: "nameAuth"
        }
      })
    }
    //Change the request user to the selectedAccount User since the user may select the other account

   
    return AppResponse(req, res, StatusCodes.OK, {
      message: "User authenticated succesfully",
      data: {
        next: "home"
      }
    })


  }

  async handleUserCanUpdateLoginData (req : Request,  res: Response) {

    const data : {  email? : string , mobile? : number, countryCode? : number } = req.body

    console.log(data)

    if(!data?.email && !(data?.mobile && data?.countryCode)) throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST)
   
    const query : Record<string, object>[] = [
    
      {
        _id: { $eq: new Types.ObjectId(req.user)},
        archived: { $eq: false }
      },
      
    ]

    if(data?.countryCode && data?.mobile){
      query.push(
        {
        countryCode: { $eq: data.countryCode },
        mobile: { $eq: data.mobile },

      })

    }

    if(data.email){
      query.push({ email: { $eq: data.email } })
    }

    console.log(query)
    const users = await UserServiceLayer.getUsers({

      query: {
        $or: query
      },
      select: "_id roles mobile countryCode email"
    })

    if(!users) throw new AppError("An Error occurred.Please try again", StatusCodes.NOT_FOUND)

      console.log(users)
 const errorMessage = `This ${ data?.email ? "email" : "mobile number"} is associated with another account. Please try another ${data?.email ? "email" : "number"}`

 if(users.length === 1 && (users[0]?.mobile &&users[0]?.countryCode) && users[0]?.mobile == data?.mobile && users[0]?.countryCode  == data?.countryCode ) throw new AppError("This mobile is already associated with your account", StatusCodes.FORBIDDEN)

  if(users.length === 1 && users[0]?.email && users[0]?.email == data?.email ) throw new AppError("This email address is already associated with your account", StatusCodes.FORBIDDEN)

   if(users.length > 1) throw new AppError(errorMessage, StatusCodes.CONFLICT)
   


    const otpData  =  await OtpServiceLayer.createOtp({
      type : data?.email ? "Email" : "SMS",
      countryCode :  data.countryCode, 
      mobile : data.mobile ,
      email : data.email, 
      subject : `${COMPANY_NAME} Verification`, 
      user : req.user,
      expiry : 10,
      next : data?.email ? "email_changed" : "mobile_changed"
    })
    
    if(!otpData) throw new AppError("An Error occurred.Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

    return AppResponse(req, res, StatusCodes.OK, {
      message : "otp created successfully", 
        data : { otpId : otpData.otpId}
    })
  }

  changeUserMobileWithinAccount =  async(req : Request, res : Response) => { 

  if(!req.user) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

  const data : {otpId : string , otp : number } =  req.body 

  //Verify the otp and then update the user 

  const otpData = await OtpServiceLayer.verifyOTP(data)

  //Check again to ensure this mobile is not assigned to anyone 

  if(!otpData || !otpData.otpData) throw new AppError("Invalid or expired token received", StatusCodes.BAD_REQUEST)

const hasExistingUser =  await UserServiceLayer.getUsers({
  query  : {
     countryCode : otpData.otpData.countryCode, 
     mobile : otpData.otpData.mobile
  }, 
  select : "_id"
})

if(!hasExistingUser) throw new AppError("An error occured. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)
  
if(hasExistingUser.length > 0 ) throw new AppError("We are unable to process this request at this time", StatusCodes.FORBIDDEN)

  if(!otpData.otpData?.next || otpData.otpData?.next !== "mobile_changed" ) throw new AppError("An error occured. Please try again later", StatusCodes.FORBIDDEN)

  if (req.user !== otpData.otpData.user?._id?.toString()) throw new AppError("An Error occured. Please try again later", StatusCodes.FORBIDDEN)


const updatedUser   =  await UserServiceLayer.updateUser({
docToUpdate : {_id : new Types.ObjectId(req.user) }, 
updateData : { 
$set : { 
  mobile : otpData?.otpData.mobile, 
  countryCode : otpData?.otpData.countryCode
 }
}, 
options  : { 
new : true, select : "_id"
}
})
 
    if (!updatedUser) throw new AppError("An Error occured.Please try again later", StatusCodes.INTERNAL_SERVER_ERROR)
  
    authLogger.info(`Mobile Change Event -  user : ${req.user} - new_mobile : ${otpData.otpData.countryCode}${otpData.otpData.countryCode}`)

  return AppResponse(req, res, StatusCodes.OK, {
    message : "User Mobile changed  successfully",
    next : otpData.otpData.next
  })

  }

  changeUserEmailWithinAccount =  async(req : Request,  res : Response) => {

    if (!req.user ) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

    const data: { otpId: string, otp: number } = req.body

    //Verify the otp and then update the user 

    const otpData = await OtpServiceLayer.verifyOTP(data)

    if (!otpData || !otpData.otpData) throw new AppError("Invalid or expired token received", StatusCodes.BAD_REQUEST)

      const hasExistingUser =  await UserServiceLayer.getUsers({
        query  : {
         email : otpData.otpData.email
        }, 
        select : "_id"
      })
      
    if(!hasExistingUser) throw new AppError("An error occured. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)
        
    if(hasExistingUser.length > 0 ) throw new AppError("We are unable to process this request at this time", StatusCodes.FORBIDDEN)
      

  
    if (!otpData.otpData?.next || otpData.otpData?.next !== "email_changed") throw new AppError("An Error occured. Please try again later", StatusCodes.FORBIDDEN)


    if (req.user !== otpData.otpData.user._id.toString()) throw new AppError("An Error occured. Please try again later", StatusCodes.FORBIDDEN)


    const updatedUser = await UserServiceLayer.updateUser({
      docToUpdate: { _id: otpData.otpData.user._id },
      updateData: {
        $set: {
          mobile: otpData?.otpData.mobile,
          countryCode: otpData?.otpData.countryCode
        }
      },
      options: {
        new: true, select: "_id"
      }
    })

    if (!updatedUser) throw new AppError("An Error occured.Please try again later", StatusCodes.INTERNAL_SERVER_ERROR)

    authLogger.info(`Email Change Event -  user : ${req.user} - new_email : ${otpData.otpData.email}`)

    return AppResponse(req, res, StatusCodes.OK, {
      message: "User Email changed  successfully",
      next: otpData.otpData.next
  })



  }
 
  async logout(req: Request, res: Response) {
  
   const user = req.user



    if (!user)
      throw new AppError(
        "An Error occurred.Please try again",
        StatusCodes.BAD_REQUEST,
        `Invalid data received for logout - ${req.user}`
      );

    
  await UserServiceLayer.updateUser({
      docToUpdate: { _id: { $eq: user } },
      updateData: {
        accessTokenExpiresAt: new Date(),
        refreshToken : undefined
      },
      options: {
        select: "_id "
      }
    })

    accessLogger.info(`logout Event : ${req.user} - ${req.ip} - ${req.headers["mobile-device-id"]} `)

    removeAccessTokens(req)

    return AppResponse(req, res, StatusCodes.OK, { 
      message : "User logged out successfully",

    });
  }
   
  async revokeTokens (req : Request, res : Response){ 
 
  const userRole =  req.role
   const userSubRole  =  req.subRole

   if(!(userRole in [ROLES.SUPERADMIN,  ROLES.ADMIN] && ! (userSubRole in [ SUBROLES.MANAGER]) )) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

  const updateAllUsers=  await  UserServiceLayer.bulkUpdateUser({
   operations : [
    {
      updateMany : {
        filter : { refreshToken : { $exists : true }, _id : { $ne : req.user}  }, 
        update : { $set : { accessTokenExpiresAt : new Date, refreshToken : undefined}}  
      }
    }
   ]
  
  })

  if(!updateAllUsers) throw new AppError("Something went wrong. Please try again", StatusCodes.FORBIDDEN)
    
    return AppResponse(req, res, StatusCodes.OK, {message : "Tokens revoked successfully"})
  }  

}
export const authController = new AuthController();

export default AuthController;


