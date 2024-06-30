import { MulticastMessage } from "firebase-admin/messaging";
import { QueueLogger, notificationsLogger } from "../middlewares/logging/logger";
import { notificationFCM } from "./3rdParty/Google/notification";
import { StatusCodes } from "http-status-codes"
import AppError from "../middlewares/errors/BaseError";
import resend from "./3rdParty/resend";
import { buildSendRequest } from "../utils/helpers/formatNotifications";
import { EmailData, PushData } from "../../types/types";
import { AxiosError } from "axios";
import termii, { SMSDATA } from "./3rdParty/termii";



class CommunicationService {


  async sendOTPMobile(data : SMSDATA ) {
 
     console.log("processing OTP")

    try { 
  

      if('recipient' in  data){ 
        //This is for whatsapp 
        await termii.sendWhatsApp(data)
      }
      else {
        // This is for sms
           await termii.sendSMS(data)

    
      }

    } catch (e: unknown) {
 
      notificationsLogger.error(`SMS to ${'recipient' in data ?  data?.recipient : data?.mobile } failed with error ${e},  - ${(e as Error | AxiosError)?.message} , {
        extra: {
          error: ${e?.message},
          error_status : ${e.status}
          channel: ${'recipient' in data ? "WhatsApp" : "SMS"}
         
        }
      }`)
    }

    return 

  }

  async sendPushNotificationToDevice(data: PushData) {

    const message = buildSendRequest(data.deviceTokens, data.message, data.callToAction, data.topic)

    const sentPush = await notificationFCM.send(message)

    if (!sentPush) notificationsLogger.error(`Push Notification of message ${data.message} for ${data.deviceTokens?.length || data.deviceTokens}  `)

    return
  }


  async sendPushNotificationToDevices(data: PushData) {

    if (!data?.deviceTokens || data?.deviceTokens.length > 500) {
      throw new AppError("Tokens for batch push notifications cannot be more than 500", StatusCodes.BAD_REQUEST)
    }

    const message = buildSendRequest(data?.deviceTokens, data.message, data.callToAction, data.topic)

    const sentPush = await notificationFCM.sendEachForMulticast(message as unknown as MulticastMessage)

    if (!sentPush) notificationsLogger.error(`Push Notification of message ${data.message} for ${data?.deviceTokens?.length} devices -  ${data.message}  `)

    return
  }

  async sendSingleEmail(
    data: EmailData

  ) {

    try { 
      const emailMessage = await resend.emails.send({
        from: data.from,
        to: data.to,
        reply_to: data.reply_to,
        subject: data.subject,
        html: data.template,
        attachments: data.attachments
      })

      const { error } = emailMessage

      console.log(error)
      if (error) QueueLogger.error(`Email transmission failed for ${data.to} with subject ${data.subject}`)
    }catch(e){
        console.log(e)
    }
   

    return

  }


}

export const CommunicationServiceLayer = new CommunicationService();


export default CommunicationService;
