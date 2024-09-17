
import OTPService, { OtpServiceLayer } from "../services/otpService";
import { Request, Response } from "express";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";


class OTP {

  private otpService: OTPService;

  constructor(otp: OTPService) {
    this.otpService = otp;
  }

  createOTP = async (req: Request, res: Response) => {

    const data: {
      type: "SMS" | "Email" | "WhatsApp";
      countryCode?: number;
      mobile?: number;
      email?: string;
      user?: string
      next?: string;
    } = req.body


    const createdOTP = await this.otpService.createOtp({
      type: data.type,
      ...((data.type === "SMS" || data.type === "WhatsApp") && { countryCode: data.countryCode, mobile: data.mobile }),
      ...(data.type === "Email" && { subject: "Email Verification", email: data.email }),
      expiry: 5,

      ...(data?.next && { next: data.next }),
      ...(data?.user && { user: data.user })

    })

    const { otpId } = createdOTP

    if (!otpId) throw new AppError("Something went wrong, Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

    return AppResponse(req, res, StatusCodes.CREATED, { message: "otp sent successfully", data: { otpId } });
  }


  verifyOTP = async (req: Request, res: Response) => {
    const data: {
      otpId: string;
      otp: number;
    } = req.body
    //This endpoint verifies an otp and sets it to used by making the active property false


    const result = await this.otpService.verifyOTP({
      otpId: data.otpId,
      otp: data.otp,
    });

    if (!result?.otpData)
      throw new AppError(`Invalid or expired token`, StatusCodes.BAD_REQUEST);

    return AppResponse(req, res, StatusCodes.OK, {
      otpData: {
        user: result.otpData?.user._id,
        email: result.otpData?.user.email,
        mobile: result.otpData?.user.mobile,
        countryCode: result.otpData?.user.countryCode
      }
    });
  }


  updateOTP = async (req: Request, res: Response) => {
    //this endpoint updates the otp, otp hash and expiry of the user when they click the resendCode button on the frontend

    const data: {
      otpId: string;
      mobile?: string;
      type: "SMS"
    } = req.body

    //Get the otp`s data and create another with the data of the previous otp
    const response = await this.otpService.updateOtpForResend({
      otpId: data.otpId,
      type: data.type
    });

    return AppResponse(req, res, StatusCodes.OK, {
      otpId: response.otpData?.otpId,
    });
  }


}

export const OtpController = new OTP(OtpServiceLayer);

export default OtpController;
