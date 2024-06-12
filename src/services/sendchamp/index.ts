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


// };

type SCHAMPSMSDATA = {
    message: string;
    to : number[]
    route: "dnd" | "non_dnd" | "international"
   
};

type SCHAMPSMSRESPONSE = {
   code : number , 
   data : {[k : string] : string}
};

class SendChamp {
    async sendSMS(request: SCHAMPSMSDATA) {
        const { message, route, to} = request;

        const SMS_INFO = {
           
            to, //Country code + phone number
            sender_name: COMPANY_NAME,
            message: message,
            route : route ?? "dnd"
    
        };

        const SMS_URL = `/sms`;

        const response = await smsClient.post<SCHAMPSMSRESPONSE>(SMS_URL, SMS_INFO);

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
