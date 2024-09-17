import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import otpGenerator from "otp-generator";
import AppError from "../../middlewares/errors/BaseError";

export const createJWTAuthToken = async (
  data: object,
  signer: string,
  expiry: string
) => {
  const token = await jwt.sign(data, signer, {
    expiresIn: expiry,
  });
  return token;
};

export const decodeJWTToken = async (token: string, signer: string) => {

  const response = await jwt.verify(token, signer)

  return response

}


export const createCryptoHashToken = (
  stringToAppend?: string
): { token: string; hashedToken: string; mainHash: string } => {
  let hashData: string = crypto.randomBytes(20).toString("hex");

  const mainHash = hashData;

  if (stringToAppend) {
    hashData += stringToAppend;
  }

  //concatenate userId to random string to create unique token

  const hashedToken = hashCryptoToken(hashData);

  console.log(hashData, hashedToken, mainHash);

  return { token: hashData, hashedToken, mainHash };
};

export const hashCryptoToken = (token: string): string => {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  return hash;
};

export const generateOTP = (): string => {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  return otp;
};
