import OTPService, { OtpServiceLayer } from "../services/otpService";
import { Request, Response } from "express";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes } from "http-status-codes";


class OTP {
  private otpService: OTPService;

  constructor(otp: OTPService) {
    this.otpService = otp;
  }

  // async createOTP(req: Request, res: Response) {

  //   const data: {
  //     type: "SMS" | "Email" | "WhatsApp";
  
  //     countryCode?: string;
  //     mobile?: string; //This is a combination of mobile and country code without the + sign
  //     email?: string;
  //     user?: string;
  //     next: string;
  //   } = req.body
 

  //   // const messageChannel  =  data?.channel

  //     return AppResponse(req, res, StatusCodes.CREATED, result);
  //   } else {
  //     await this.sendOTPEmail({ otp, email: data.email! });

  //     const result = { otpId: createdOTP._id };

  //     return AppResponse(req, res, StatusCodes.CREATED, result);
  //   }
  // }

  // async verifyOTP(req: Request, res: Response) {
  //   const data: {
  //     otpId: string;
  //     otp: string;
  //   } = req.body
  //   //This endpoint verifies an otp and sets it to used by making the active property false

  //   const result = await this.otpService.verifyOTPs({
  //     otpId: data.otpId,
  //     otp: data.otp,
  //   });

  //   if (!result?.otpData)
  //     throw new AppError(`Invalid or expired token`, StatusCodes.NOT_FOUND);

  //   return AppResponse(req, res, StatusCodes.OK, { otpData: result.otpData });
  // }


  async updateOTP(req: Request, res: Response) {
    //this endpoint updates the otp, otp hash and expiry of the user when they click the resendCode button on the frontend

    const data: {
      otpId: string;
      mobile?: string;
      type : "SMS"
    } = req.body

    //Get the otp`s data and create another with the data of the previous otp
    const response = await this.otpService.updateOtpForResend({
      otpId: data.otpId,
      type : data.type
    });

    return AppResponse(req, res, StatusCodes.OK, {
      otpId: response.otpData?.otpId,
    });
  }

  
}

export const OtpController = new OTP(OtpServiceLayer);

export default OtpController;
