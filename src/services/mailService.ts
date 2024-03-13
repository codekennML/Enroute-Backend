import nodemailer from "nodemailer";
import createAxiosInstance from "../config/axios";
import { COMPANY_MAIL_SENDER_ADDRESS } from "../config/constants/mail";

const smsClient = createAxiosInstance({
  baseURL: "https://api.ng.termii.com/api/",
  timeout: 2000,
  headers: { "Content-Type": "application/json" },
});

interface MobileMessage {
  recipient: string;
  message: string;
}

interface EmailMessage {
  recipient: string;
  subject: string;
  from: string;
  body: string;
}

const MAIL_PROVIDER = process.env.RESEND_API_USER as string;
const MAIL_PROVIDER_PASSWORD = process.env.RESEND_API_SECRET as string;
const SMS_PROVIDER_API_KEY = process.env.SMS_PROVIDER_API_KEY as string;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID as string;
// const SMS_PROVIDER_SECRET = process.env.SMS_PROVIDER_SECRET as string;
const ONBOARDING_MAIL = process.env.ONBOARDING_MAIL;

class NotificationService {
  async sendMobileMessage(messageData: MobileMessage) {
    const { recipient, message } = messageData;

    const smsData = {
      api_key: SMS_PROVIDER_API_KEY,
      to: recipient,
      from: SMS_SENDER_ID,
      channel: "generic",
      type: "plain",
      sms: message,
    };

    await smsClient.post("/sms/send", smsData);
  }

  async sendEmailMessage(messageData: EmailMessage) {
    const { recipient, subject = "Hey there! ", from, body } = messageData;

    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      secure: true,
      port: 465,
      auth: {
        user: MAIL_PROVIDER,
        pass: MAIL_PROVIDER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: from ?? COMPANY_MAIL_SENDER_ADDRESS,
      to: recipient,
      subject,
      html: body,
    });
  }

  // async sendPushNotification(message) {}
}

export const Notification = new NotificationService();
