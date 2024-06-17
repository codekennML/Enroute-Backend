
import * as z from "zod"
import { dateSeekSchema } from "./base"

export const MessageSchema  =  z.object({ 
    body:z.string(), 
    // deliveredAt : Date, 
    chatId : z.string(), 
    sentBy : z.string()
})
 
export const getMessagesSchema =  dateSeekSchema.extend({
    chatId : z.string(),
    cursor : z.string().optional(),
    sort : z.string().optional(), 
    userId : z.string().optional()
})

export const deleteMessagesSchema =  z.object({
     messageIds : z.array(z.string())
})

export const deleteMessageSchema = z.object({
    messageIds : z.array(z.string())
})
