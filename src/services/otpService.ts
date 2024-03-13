import { ClientSession } from "mongoose";
import {
  createCryptoHashToken,
  hashCryptoToken,
} from "../utils/helpers/authTokens";
import OtpRepository, { otpDataLayer } from "../repository/mongo/otp";
import otpGenerator from "otp-generator";
import { IOtp } from "../model/interfaces";

import { QueryData } from "../repository/mongo/shared";
import { UpdateRequestData } from "../../types/types";
import IOtpModel from "../model/otp";

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

    return otp;
  }

  hashOTP(otp: string) {
    const hashedOTP = hashCryptoToken(JSON.stringify(otp));

    console.log(hashedOTP);
    return hashedOTP;
  }

  appendAndHashOTP(stringToAppend?: string) {
    return createCryptoHashToken(stringToAppend);
  }

  async updateOtpForResend(
    request: Omit<IOtp, "expiry" | "channel"> & {
      otpId: string;
    }
    // session?: ClientSession
  ) {
    const otp = this.generateOTP(6);
    const hashedOTP = this.hashOTP(otp);

    const expiry = 10;

    //get the otp and the resultant data , copy it over to a new otp : P:S : This should never be null
    const otpData = (await this.updateOTP({
      docToUpdate: {
        _id: request.otpId,
      },
      updateData: { active: false },
      options: { new: true, select: "-_id -active" },
    })!) as IOtpModel;

    const newCreatedOtp = await this.createOtp({
      ...otpData,
      expiry,
      hash: hashedOTP,
      active: true,
    });

    //If there is an error , the global error handler will pick it and return a 500

    return { otpData: newCreatedOtp, otp };
  }

  async createOtp(
    request: Omit<IOtp, "expiry"> & { expiry: number },
    session?: ClientSession
  ) {
    const otpRecord = {
      user: request.user,
      email: request.email,
      hash: request.hash,
      expiry: new Date(Date.now() + request.expiry * 60 * 1000),
      active: true,
      next: request.next,
      channel: request.channel,
    };

    const otp = await this.otpDataLayer.createOTP(otpRecord, session);

    return otp[0];
  }

  async getOtps(request: QueryData) {
    const Otps = await this.otpDataLayer.findOtp(request);

    return Otps;
  }

  async updateOTP(request: UpdateRequestData) {
    const updatedOTP = await this.otpDataLayer.updateOtp(request);

    return updatedOTP;
  }

  async verifyOTPs(request: { otpId: string; otp: string }) {
    const { otpId, otp } = request;
    console.log("request,", request);

    const hashedOtp = this.hashOTP(otp);
    //Change this to an update so we just update teh Otp statsus to used , once its been verified
    const otpData = await this.otpDataLayer.updateOtp({
      docToUpdate: {
        _id: otpId,
        hash: hashedOtp,
        expiry: { $gte: new Date() },
        active: true,
      },
      updateData: { $set: { active: false } },
      options: { new: true },
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
