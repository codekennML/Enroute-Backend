import { ClientSession } from "mongoose";
import {
  createCryptoHashToken,
  hashCryptoToken,
} from "../utils/helpers/authTokens";
import OtpRepository, { otpDataLayer } from "../repository/otp";
import otpGenerator from "otp-generator";

import { Types } from "mongoose"
import { UpdateRequestData } from "../../types/types";

import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import { emailQueue, smsQueue } from "./bullmq/queue";
import { OTP_MAIL_ADDRESS } from "../config/constants/otp";
import { QueryData } from "../repository/shared";

class OTPService {
  private otpDataLayer: OtpRepository;

  constructor(dataLayer: OtpRepository) {
    this.otpDataLayer = dataLayer;
  }

  generateOTP(length: number) {
    const otp = otpGenerator.generate(length, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      digits: true,
      specialChars: false,
    });

    return parseInt(otp)
  }

  hashOTP(otp:number | string) {
    const hashedOTP = hashCryptoToken(JSON.stringify(otp));

  
    return hashedOTP;
  }

  appendAndHashOTP(stringToAppend?: string) {
    return createCryptoHashToken(stringToAppend);
  }

  async updateOtpForResend(
    request: 
    {
 
      otpId: string, type : "SMS" | "Email" | "WhatsApp"
    }

  ) {

    
    const expiry = 5;

    //get the otp and the resultant data , copy it over to a new otp : P:S : This should never be null
    const otpData = (await this.updateOTP({
      docToUpdate: {
        _id: request.otpId,
      },
      updateData: { active: false },
      options: { new: true, select: "-_id -active" },
    })!)

    const user =  otpData?.user?.toString()
    
    const newCreatedOtp = await this.createOtp({
      ...otpData,
      user,
      expiry,
      type : request.type, 
    });

    //If there is an error , the global error handler will pick it and return a 500

    return { otpData: newCreatedOtp };
  }

  async createOtp(
    request: {
      type: "SMS" | "Email" | "WhatsApp";
      subject? : string, //Only necessary for emails
      mobile?: number;
      countryCode?: number
      email?: string;
      user?: string;
      next?: string
      expiry : number
},
    session?: ClientSession
  ) {
   
    if (request.type === "Email" && !request?.email)
      throw new AppError(
        "Email is required",
        StatusCodes.BAD_REQUEST
      );

    if ((request.type === "SMS" || request.type === "WhatsApp") && (!(request?.mobile|| request.countryCode) ))
      throw new AppError(
       "Mobile number is required",
        StatusCodes.BAD_REQUEST
      );


    const otp = this.generateOTP(4);

    const hashedOtp = this.hashOTP(otp);

   

    const createdOTP = await this.otpDataLayer.createOTP({
      user: request?.user ? new Types.ObjectId(request.user) : undefined,
      email: request?.email,
      hash: hashedOtp,
      next: request?.next,
      expiry: new Date(Date.now() + request.expiry * 60 * 1000),
      channel: request.type.toLowerCase(),
      mobile : request?.mobile,
      countryCode : request?.countryCode
    }, session);

    const otpMessage = `${otp} is your verification code. Please do not share it with anyone`;

    if (request.type === "SMS") {
      //Send the sms to the user
      console.log(otp);

      const to = [`${request.countryCode}${request.mobile}`]
      const route =  "dnd"

//TODO UNCOMMENT THE CODE BELOW AFTER TESTING

      // smsQueue.add(`SMS_OTP_${createdOTP[0]._id}`, {
      //   message: otpMessage, mobile: to, channel: route
      // }, {
      //   priority: 10, removeOnFail: true,
      //   removeOnComplete: true,
      //   attempts: 3,
      //   backoff: {
      //     type: 'exponential',
      //     delay: 1000,
      //   } })
      
    } else if(request.type === "WhatsApp"){ 
      console.log(otp);


      const recipient = `${request.mobile}${request.countryCode}`

      
      smsQueue.add(`$WHATSAPP_OTP_${createdOTP[0]._id}`, {
         recipient,
         message : otpMessage, 
        channel: "whatsapp"
      }, {
        priority: 10, removeOnFail: true,
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        }})

     } else {
    //send to email queue

      const mailBody = `${otp} is your verification code. Do not share this code with anyone`;
  
    const mailMessage = {
      to: request.email!,
      from: process.env.NODE_ENV as string === "production" ? OTP_MAIL_ADDRESS : "onboarding@resend.dev",
      subject: request.subject!,
      template: `<strong>${mailBody}</>`,
    };

    console.log("User Data",createdOTP[0]._id,  otp)

    // emailQueue.add(`$OTP_EMAIL`, mailMessage, {
    //   priority: 10,
    //   removeOnFail : true, 
    //   removeOnComplete : true,
    //   attempts: 3,
    //   backoff: {
    //     type: 'exponential',
    //     delay: 1000,
    //   },
    // })

  }

  const result = { otpId: createdOTP[0]._id };
  return result

}
  // async getOneOtp(request: QueryData) {
  //   const Otps = await this.otpDataLayer.findOtp(request);

  //   return Otps;
  // }

  async getOtps(request: QueryData) {
    const Otps = await this.otpDataLayer.findOtp(request);
  
    return Otps;
  }

  async updateOTP(request: UpdateRequestData) {
    const updatedOTP = await this.otpDataLayer.updateOtp(request);

    return updatedOTP;
  }

  async verifyOTP(request: { otpId: string; otp: number }, session? : ClientSession) {
    const { otpId, otp} = request;
    

    const hashedOtp = this.hashOTP(otp);

    // const updatedDocument = await this.otpDataLayer.updateOtp(
    // { 
    //   docToUpdate :   {
    //     _id: new Types.ObjectId(otpId),
    //     hash: hashedOtp,
    //     expiry: { $gte: new Date() },
    //     active: true,
    //   },
    //  updateData :    {
    //     $set: {
    //       active: false,
    //     },
    //   },
    //   options : {
    //     session: session,
    //     new : true 
    //   }
    // }
    // );

    const otpData = await this.otpDataLayer.aggregateOtp({
      pipeline: [
        {
          $match: {
            _id: new Types.ObjectId(otpId),
            hash: hashedOtp,
            expiry: { $gte: new Date() },
            active: true,
          }
        },  
        {
          $set : { active : false }
        },
  
        {
          $lookup : {
            from : "users",
            localField: "user",
            foreignField: "_id", 
             pipeline : [
               { 
                $project : { 
                roles : 1 ,
                _id : 1 , 
                mobile : 1 , 
                countryCode : 1 ,
                devices : 1 , 
                firstName : 1,
                emailVerifiedAt : 1,
                email : 1,
                active : 1
              }
            }
            ],
            as : "user"
          }
        }, 
        {
          $unwind : "$user"
        }, 

      ],
    session})

 


    return { otpData : otpData[0], otp };
  }

  // async updateOtp(request: UpdateRequestData) {
  //   const updatedOtp = await this.otpDataLayer.updateOtp(request);
  //   return updatedOtp;
  // }
}

export const OtpServiceLayer = new OTPService(otpDataLayer);

export default OTPService;
