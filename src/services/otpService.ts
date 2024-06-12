import { ClientSession } from "mongoose";
import {
  createCryptoHashToken,
  hashCryptoToken,
} from "../utils/helpers/authTokens";
import OtpRepository, { otpDataLayer } from "../repository/otp";
import otpGenerator from "otp-generator";
import { IOtp } from "../model/interfaces";
import { Types } from "mongoose"
import { UpdateRequestData } from "../../types/types";

import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import { emailQueue, smsQueue } from "./bullmq/queue";
import { OTP_MAIL_ADDRESS } from "../config/constants/otp";

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
    request: Omit<IOtp, "expiry" | "channel"> & {
      otpId: string, type : "SMS" | "Email"
    }
    // session?: ClientSession
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
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    if ((request.type === "SMS" || request.type === "WhatsApp") && !request?.mobile)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
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

    if (request.type === "SMS" || request.type === "WhatsApp") {
      //Send the sms to the user
      console.log(otp);

      const otpMessage = `${otp} is your verification code. Please do not share it with anyone`;
      const to = parseInt(`${request.mobile}${request.countryCode}`)
      const route =  "dnd"


      smsQueue.add(`$SMS_OTP_${request.user}`, { message : otpMessage, to,  route}, { priority: 10 })


      

  } else {
    //send to email queue

      const mailBody = `${otp} is your verification code. Do not share this code with anyone`;

    
    const mailMessage = {
      to: request.email,
      from: OTP_MAIL_ADDRESS,
      subject: request.subject,
      html: mailBody,
    };

    emailQueue.add(`$OTP_EMAIL`, mailMessage, {
      priority: 10
    })



  }

  const result = { otpId: createdOTP[0]._id };
  return result

}
  // async getOneOtp(request: QueryData) {
  //   const Otps = await this.otpDataLayer.findOtp(request);

  //   return Otps;
  // }

  // async getOtps(request: QueryData) {
  //   const Otps = await this.otpDataLayer.findOtp(request);

  //   return Otps;
  // }

  async updateOTP(request: UpdateRequestData) {
    const updatedOTP = await this.otpDataLayer.updateOtp(request);

    return updatedOTP;
  }

  async verifyOTPs(request: { otpId: string; otp: number }, session? : ClientSession) {
    const { otpId, otp} = request;
    

    const hashedOtp = this.hashOTP(otp);
    //Change this to an update so we just update th Otp statsus to used , once its been verified
    const otpData = await this.otpDataLayer.updateOtp({
      docToUpdate: {
        _id: otpId,
        hash: hashedOtp,
        expiry: { $gte: new Date() },
        active: true,
      },
      updateData: { $set: { active: false } },
      options: { new: true,session  },
    });

    console.log(otpData);

    return { otpData, otp };
  }

  // async updateOtp(request: UpdateRequestData) {
  //   const updatedOtp = await this.otpDataLayer.updateOtp(request);
  //   return updatedOtp;
  // }
}

export const OtpServiceLayer = new OTPService(otpDataLayer);

export default OTPService;
