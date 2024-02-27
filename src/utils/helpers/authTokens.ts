import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import otpGenerator from "otp-generator";
import AppError from "../../middlewares/errors/BaseError";

export const createJWTAuthToken = (
  data: object,
  signer: string,
  expiry: string
) => {
  const token = jwt.sign(data, signer, {
    expiresIn: expiry,
  });
  return token;
};

// Decode jwt tokens
export const decodeJWTAuthToken = (token: string, signer: string) => {
  const dataToReturn: {
    error: boolean;
    data?: Record<string, string>;
  } = { error: true };

  jwt.verify(token, signer, (err, decoded) => {
    if (err || !decoded) {
      dataToReturn.error = true;
    } else {
      dataToReturn.error = false;
      dataToReturn.data = decoded;
    }
    return;
  });

  return dataToReturn;
};

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
    specialChars: false,
  });

  return otp;
};
