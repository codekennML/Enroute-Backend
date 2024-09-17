import createAxiosInstance from "../../../config/axios";
import { COMPANY_NAME } from "../../../config/constants/base";
import {
  TERMII_SMS_CLIENT_API_KEY,
  TERMII_SMS_CLIENT_BASE_URL,
} from "../../../config/constants/notification";


const smsClient = createAxiosInstance({
  baseURL: TERMII_SMS_CLIENT_BASE_URL,

  // timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  }

});



// Define the base SMS data type
type BaseSMSData = {

  channel: "dnd" | "whatsapp";
  message: string;
  mobile: string
};

export type WhatsAppDATA = {
  recipient: string,
  channel: "dnd" | "whatsapp";
  message: string;
}

// Combine Receiver with BaseSMSData to define SMSDATA
export type SMSDATA = BaseSMSData




type SMSRESPONSE = {
  message_id: string;
  message: string;
  balance: number;
  user: string;
};



class Termii {

  async sendSMS(request: SMSDATA) {

    const { message, channel, mobile } = request;
    // const { message, channel, mobile } = request;

    const SMS_INFO = {
      api_key: TERMII_SMS_CLIENT_API_KEY,
      to: mobile,
      from: 'Gofar',
      sms: message,
      type: "plain",
      channel: "generic"
    };

    console.log(SMS_INFO)

    const SMS_URL = `api/sms/send`;

    try {
      const response = await smsClient.post<SMSRESPONSE>(SMS_URL, SMS_INFO);

    } catch (e) {
      console.log(e)
    }



    // return { success: true, smsResponse: response };

  }


  async sendWhatsApp(request: WhatsAppDATA
  ) {

    const { recipient, message, channel, } = request;

    const WHATSAPP_INFO = {
      api_key: TERMII_SMS_CLIENT_API_KEY,
      to: recipient,
      from: 'Gofar',
      sms: message,
      type: "plain",
      channel
    };

    const WHATSAPP_URL = `whatsapp/message/send`;

    const response = await smsClient.post<SMSRESPONSE>(WHATSAPP_URL, WHATSAPP_INFO);



    return { success: true, smsResponse: response };
  }

}

const termii = new Termii();

export default termii;
