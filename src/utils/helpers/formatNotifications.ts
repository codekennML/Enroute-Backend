import { Message, TopicMessage } from "firebase-admin/messaging";
import { MailData } from "../../../types/types"


export const buildSendRequest = (tokens: string | string[], messageInfo: { [k: string]: string }, callToAction?: string, topic?: string) => {



    const message: Message =
    {

        data: {
            notifee: JSON.stringify({
                ...messageInfo,
                active: true,
                imageUrl: process.env.COMPANY_LOGO as string
            })

        },

        ...(Array.isArray(tokens) ? { tokens: tokens } : { token: tokens }),


        notification: {
            ...messageInfo,
        },

        ...(topic && { topic }) as TopicMessage,
    }

    if (callToAction) {
        message.android = {
            notification: {
                clickAction: callToAction
            }

        }
    }


    message.android = {
        notification: {
            ...message.android?.notification,
            imageUrl: process.env.COMPANY_LOGO as string
        }
    }



    return message

}




export const formatBatchEmailMessages = (mailData: MailData["data"]) => {

    // Define the batch size
    const batchSize = 100


    // Slice the email messages into the first batch
    const formattedMailData = mailData.slice(0, batchSize);


    // Generate the bcc list by extracting the email addresses from the remaining email messages
    const bcc = mailData
        .slice(batchSize)
        .flatMap(mailData => mailData.to);

    // Add the bcc list to each email message
    formattedMailData.forEach((mailData, index) => {

        // Add the bcc list to the email message based on the index
        mailData.bcc = bcc.slice(index * batchSize, index * batchSize + batchSize);

    });

    // Return the formatted batch email messages
    return formattedMailData;
}


