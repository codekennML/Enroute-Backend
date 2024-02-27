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

class OTPService {
  private otpDataLayer: OtpRepository;

  constructor(dataLayer: OtpRepository) {
    this.otpDataLayer = dataLayer;
  }

  generateOTP(length: number) {
    const otp = otpGenerator.generate(length, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    return otp;
  }

  hashOTP(otp: string) {
    const hashedOTP = hashCryptoToken(JSON.stringify(otp));
    return hashedOTP;
  }

  appendAndHashOTP(stringToAppend?: string) {
    return createCryptoHashToken(stringToAppend);
  }

  async createDBOtpEntry(
    request: Pick<IOtp, "user" | "type"> & {
      expiryInMins: number;
      otpHash: string;
    },
    session?: ClientSession
  ): Promise<string> {
    const otpRecord = {
      user: request.user,
      type: request.type,
      hash: request.otpHash,
      expiry: new Date(Date.now() + request.expiryInMins * 60 * 1000),
      active: true,
    };

    const otp = await this.otpDataLayer.createOTP(otpRecord, session);

    return otp[0]._id.toString();
  }

  compareHash(hash: string, token: number) {
    const hashedToken = this.hashOTP(token);
    const isMatchingHash = hash === hashedToken;

    return isMatchingHash;
  }

  async getOtps(request: QueryData) {
    const Otps = await this.otpDataLayer.findOtp(request);

    return Otps;
  }

  async updateOtp(request: UpdateRequestData) {
    const updatedOtp = await this.otpDataLayer.updateOtp(request);
    return updatedOtp;
  }
}

export const OtpServiceLayer = new OTPService(otpDataLayer);

export default OTPService;
