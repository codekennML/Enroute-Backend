import createAxiosInstance from "../../config/axios";
import { COMPANY_NAME } from "../../config/constants/base";
import {
    SENDCHAMP_SMS_CLIENT_API_KEY,
    SENDCHAMP_SMS_CLIENT_BASE__URL
} from "../../config/constants/notification";

const smsClient = createAxiosInstance({
    baseURL: SENDCHAMP_SMS_CLIENT_BASE__URL,
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SENDCHAMP_SMS_CLIENT_API_KEY}`,
    }
    
});


export type SENDCHAMPSMSDATA = {
    message: string;
    to : number| number[]
    route: "dnd" | "non_dnd" | "international"
   
};

export type SENDCHAMPWHATSAPPDATA =  { 
    recipient : string, 
    customData : Record<string, string | number>
}

export type SENDCHAMPRESPONSE = {
   code : number , 
   data : {[k : string] : string}
};

class SendChamp {
    async sendSMS(request: SENDCHAMPSMSDATA) {
        const { message, route, to} = request;

        const SMS_INFO = {
            to, //Country code + phone number
            sender_name: COMPANY_NAME,
            message: message,
            route : route ?? "dnd"
    
        };

        const SMS_URL = `/sms/send`;

        const response = await smsClient.post<SENDCHAMPRESPONSE>(SMS_URL, SMS_INFO);

        return { success: true, smsResponse: response };
    }

 async sendWhatsApp(request : SENDCHAMPWHATSAPPDATA){ 
     const { recipient,  customData } = request;

     const WHATSAPP_INFO = {
         recipient , //Country code + phone number
         sender_name: process.env.SENDCHAMP_COMPANY_NUMBER  as string,
         template : process.env.SENDCHAMP_WHATSAPP_TEMPLATE as string,
         type : "template",
         customData

     };

     const WHATSAPP_URL = `whatsapp/message/send`;

     const response = await smsClient.post<SENDCHAMPRESPONSE>(WHATSAPP_URL, WHATSAPP_INFO);

     return { success: true, smsResponse: response };
 }
 

    async walletBalance(){
        const SMS_URL = `/wallet/wallet_balance`;

        const response = await smsClient.get<{[k : string] : string | object}>(SMS_URL);

        return { success: true, smsResponse: response };
    }
}

export const SendChampService = new SendChamp();

export default SendChamp;
