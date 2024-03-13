import createAxiosInstance from "../../../config/axios";
import { COMPANY_NAME } from "../../../config/constants/base";
import {
  SMS_CLIENT_API_KEY,
  SMS_CLIENT_BASE_URL,
} from "../../../config/constants/mail";

const smsClient = createAxiosInstance({
  baseURL: SMS_CLIENT_BASE_URL,
  timeout: 5000,
});

// type OTPGenerateResponse = {
//   pinId: string;
//   to: string;
//   smsStatus: string;
// };

// type OTPVerificationResponse = Pick<OTPGenerateResponse, "pinId"> & {
//   verified: string;
//   msisdn: string;
// };

type SMSDATA = {
  message: string;
  channel: "dnd" | "whatsapp";
  mobile: string;
};

type SMSRESPONSE = {
  message_id: string;
  message: string;
  balance: number;
  user: string;
};

class Termii {
  async sendSMS(request: SMSDATA) {
    const { message, channel, mobile } = request;

    const SMS_INFO = {
      api_key: SMS_CLIENT_API_KEY,
      to: mobile,
      from: COMPANY_NAME,
      sms: message,
      type: "plain",
      channel,
    };

    const SMS_URL = `/sms/send`;

    const response = await smsClient.post<SMSRESPONSE>(SMS_URL, SMS_INFO);

    return { success: true, smsResponse: response };
  }

  // async generateSendOTP(channel: "WhatsApp" | "generic", mobile: string) {
  //   const mobileOtpUrl = "/sms/otp/send";

  //   const otpData = {
  //     api_key: SMS_CLIENT_API_KEY,
  //     message_type: "NUMERIC",
  //     to: mobile,
  //     from: SMS_CLIENT_CONFIG_ID,
  //     channel: channel,
  //     pin_attempts: 10,
  //     pin_time_to_live: 10,
  //     pin_length: 6,
  //     pin_placeholder: "user_verify_pin",
  //     message_text: "Your pin is user_verify_pin",
  //     pin_type: "NUMERIC",
  //   };

  //   const response = await smsClient.post<OTPGenerateResponse>(
  //     mobileOtpUrl,
  //     otpData
  //   );

  //   console.log(
  //     "response here",
  //     response.statusText,
  //     response.data,
  //     response.status
  //   );

  //   return response.data.pinId;
  // }

  // async verifyOTP(request: { pinId: string; pin: string }) {
  //   const verifyUrl = "/sms/otp/verify";

  //   const verificationData = {
  //     api_key: SMS_CLIENT_API_KEY,
  //     pin_id: request.pinId,
  //     pin: request.pin,
  //   };

  //   const response = await smsClient.post<OTPVerificationResponse>(
  //     verifyUrl,
  //     verificationData
  //   );

  //   return response.data;
}

const termii = new Termii();

export default termii;
