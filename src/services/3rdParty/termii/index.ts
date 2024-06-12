import createAxiosInstance from "../../../config/axios";
import { COMPANY_NAME } from "../../../config/constants/base";
import {
  TERMII_SMS_CLIENT_API_KEY,
  TERMII_SMS_CLIENT_BASE_URL,
} from "../../../config/constants/notification";

const smsClient = createAxiosInstance({
  baseURL: TERMII_SMS_CLIENT_BASE_URL,
  timeout: 5000,
});


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
      api_key: TERMII_SMS_CLIENT_API_KEY,
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
}

const termii = new Termii();

export default termii;
