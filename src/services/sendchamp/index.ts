import axios from "axios";
import createAxiosInstance from "../../config/axios";
import { COMPANY_NAME } from "../../config/constants/base";
import {
    SENDCHAMP_SMS_CLIENT_API_KEY,
    SENDCHAMP_SMS_CLIENT_BASE__URL
} from "../../config/constants/notification";
import AppError from "../../middlewares/errors/BaseError";


const smsClient = createAxiosInstance({
    baseURL: SENDCHAMP_SMS_CLIENT_BASE__URL,
    headers: {
        "Accept": 'application/json',
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SENDCHAMP_SMS_CLIENT_API_KEY}`,
    }
    
});


export type SENDCHAMPSMSDATA = {
    message: string;
    to : number| string[]
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
            sender_name: "Sendchamp" ?? COMPANY_NAME,
            message: message,
            route : route ?? "dnd"
        };
   
        const SMS_URL = `/sms/send`;

     

    const response  = await     smsClient.post<SENDCHAMPRESPONSE>(SMS_URL, SMS_INFO)

    console.log(response)

    return { success : true , response}
       
   
    }

 async sendWhatsApp(request : SENDCHAMPWHATSAPPDATA){ 
     const { recipient,  customData } = request;

     const WHATSAPP_INFO = {
         recipient , //Country code + phone number
         sender: 2348120678278 ?? process.env.SENDCHAMP_WHATSAPP_SENDER_ID  as string,
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
