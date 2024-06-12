import { MulticastMessage } from "firebase-admin/messaging";
import { QueueLogger, notificationsLogger } from "../middlewares/logging/logger";
import { notificationFCM } from "./3rdParty/Google/notification";
import { StatusCodes } from "http-status-codes"
import AppError from "../middlewares/errors/BaseError";
import resend from "./3rdParty/resend";
import { buildSendRequest, formatBatchEmailMessages } from "../utils/helpers/formatNotifications";
import { MailData, PushData, SMSData } from "../../types/types";
import { SendChampService } from "./sendchamp";



class CommunicationService {


  async sendSMS(
 data : SMSData) {

    const messageData = {
      message  : data.message,
      to: data.mobile,
      route: data.channel
    }

    try {

      await SendChampService.sendSMS(messageData)
    } catch (e: unknown) {

      notificationsLogger.error(`SMS to ${data?.mobile.length} users failed with error ${(e as Error)?.message} `, {
        extra: {
          error: e,
          channel : data.channel,
          mobile : data?.mobile
        }
      })
    }

    return 

  }

  async sendPushNotificationToDevice(data: PushData) {

    const message = buildSendRequest(data.deviceTokens, data.message, data.callToAction, data.imageUrl, data.topic)

    const sentPush = await notificationFCM.send(message)

    if (!sentPush) notificationsLogger.error(`Push Notification of message ${data.message} for ${data.deviceTokens?.length || data.deviceTokens}  `)

    return
  }


  async sendPushNotificationToDevices(data: PushData) {

    if (!data?.deviceTokens || data?.deviceTokens.length > 500) {
      throw new AppError("Tokens for batch push notifications cannot be more than 500", StatusCodes.BAD_REQUEST)
    }

    const message = buildSendRequest(data?.deviceTokens, data.message, data.callToAction, data.imageUrl, data.topic)

    const sentPush = await notificationFCM.sendEachForMulticast(message as unknown as MulticastMessage)

    if (!sentPush) notificationsLogger.error(`Push Notification of message ${data.message} for ${data?.deviceTokens?.length} devices -  ${data.message}  `)

    return
  }

  async sendSingleEmail(
    data: MailData

  ) {

    const emailMessage = await resend.emails.send({
      from: data.from,
      to: data.to,
      reply_to: data.reply_to,
      subject: data.subject,
      html: data.template,
      attachments: data.attachments
    })

    const { error } = emailMessage


    if (error) QueueLogger.error(`Email transmission failed for ${data.to} with subject ${data.subject}`)

    return

  }

  async sendBatchEmails(mailData: MailData[]) {

    if (mailData.length > 100) throw new AppError("Something went wrong. Please try again later", StatusCodes.BAD_REQUEST, "More than 100 emails added for email message in one request")

    const formattedMessages = formatBatchEmailMessages(mailData)
    //Send the message to the queue for processing 
    await resend.batch.send(formattedMessages)
  }


}

export const CommunicationServiceLayer = new CommunicationService();


export default CommunicationService;
