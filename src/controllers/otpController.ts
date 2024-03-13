import { HttpRequest, HttpResponse } from "uWebsockets.js";
import { Notification } from "../services/mailService";
import OTPService, { OtpServiceLayer } from "../services/otpService";
import { readJSON } from "../utils/helpers/decodePostJSON";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { COMPANY_MAIL_SENDER_ADDRESS } from "../config/constants/mail";
import { COMPANY_NAME } from "../config/constants/base";
import AppError from "../middlewares/errors/BaseError";
import termii from "../services/3rdParty/termii";
import { Types } from "mongoose";

class OTP {
  private otpService: OTPService;

  constructor(otp: OTPService) {
    this.otpService = otp;
  }

  createOtp = async (res: HttpResponse, req: HttpRequest) => {
    const data = await readJSON<{
      type: "SMS" | "Email" | "WhatsApp";
      countryCode?: string;
      mobile?: string; //This is a combination of mobile and country code without the + sign
      email?: string;
      user?: string;
      next: string;
    }>(res);

    // const messageChannel  =  data?.channel

    if (data.type === "Email" && !data?.email)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    if ((data.type === "SMS" || data.type === "WhatsApp") && !data?.mobile)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    //Create the otp Entry first
    const otp = this.otpService.generateOTP(6);
    const hashedOtp = this.otpService.hashOTP(otp);

    const createdOTP = await this.otpService.createOtp({
      user: data?.user ? new Types.ObjectId(data.user) : undefined,
      email: data.email,
      hash: hashedOtp,
      next: data?.next,
      expiry: 10,
      channel: data.type.toLowerCase(),
    });

    if (data.type === "SMS" || data.type === "WhatsApp") {
      //Send the sms to the user
      console.log(otp);

      // const otpMessage = `${otp} is your verification code. Please do not share it with anyone`;

      // await termii.sendSMS({
      //   message: otpMessage,
      //   channel: data.type === "WhatsApp" ? "whatsapp" : "dnd",
      //   mobile: `${data.countryCode}${data.mobile!}`,
      // });

      const result = { otpId: createdOTP._id };

      return AppResponse(res, req, StatusCodes.CREATED, result);
    } else {
      await this._sendOTPEmail({ otp, email: data.email! });

      const result = { otpId: createdOTP._id };

      return AppResponse(res, req, StatusCodes.CREATED, result);
    }
  };

  verifyOTP = async (res: HttpResponse, req: HttpRequest) => {
    const data = await readJSON<{
      otpId: string;
      otp: string;
    }>(res);
    //This endpoint verifies an otp and sets it to used by making the active property false

    const result = await this.otpService.verifyOTPs({
      otpId: data.otpId,
      otp: data.otp,
    });

    if (!result?.otpData)
      throw new AppError(`Invalid or expired token`, StatusCodes.NOT_FOUND);

    return AppResponse(res, req, StatusCodes.OK, { otpData: result.otpData });
  };

  updateOTP = async (res: HttpResponse, req: HttpRequest) => {
    //this endpoint updates the otp, otp hash and expiry of the user when they click the resendCode button on the frontend

    const data = await readJSON<{
      otpId: string;
      mobile?: string;
    }>(res);

    //Get the otp`s data and create another with the data of the previous otp
    const response = await this.otpService.updateOtpForResend({
      otpId: data.otpId,
    });

    //If the response fails to update the otp
    if (!response?.otpData || !response.otp)
      throw new AppError(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );

    const otpRoute = response.otpData.channel;

    if (data?.mobile) {
      const otpMessage = `${response.otp} is your verification code. Please do not share it with anyone`;

      await termii.sendSMS({
        message: otpMessage,
        channel: otpRoute === "whatsapp" ? "whatsapp" : "dnd",
        mobile: data.mobile,
      });

      console.log("otpHere", response.otp);

      const result = {
        otpId: response.otpData._id,
      };

      return AppResponse(res, req, StatusCodes.OK, result);
    } else {
      //This is an email otp that needs to be updated, so send the code to the email again

      if (!response?.otpData.email)
        throw new AppError(
          getReasonPhrase(StatusCodes.UNPROCESSABLE_ENTITY),
          StatusCodes.UNPROCESSABLE_ENTITY
        );

      await this._sendOTPEmail({
        otp: response.otp,
        email: response.otpData.email,
      });
    }

    return AppResponse(res, req, StatusCodes.OK, {
      otpId: response.otpData?._id,
    });
  };

  _sendOTPEmail = async (request: { otp: string; email: string }) => {
    if (!request.email || !request.otp)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const mailBody = `${request.otp} is your verification code. Do not share this code with anyone`;

    const mailMessage = {
      recipient: request.email,
      from: COMPANY_MAIL_SENDER_ADDRESS,
      subject: COMPANY_NAME,
      body: mailBody,
    };

    await Notification.sendEmailMessage(mailMessage);

    return { success: true };
  };
}

export const OtpController = new OTP(OtpServiceLayer);

export default OtpController;
