
import * as z from "zod"

export const ChatSchema  =  z.object({ 
    latestMessage :z.string().optional(), 
    users : z.array(z.string()), 
    status : z.union([z.literal("closed"),  z.literal("open")]).optional(), 
    tripId : z.string(), 
    rideId : z.string()
})
 
export const getChatByRideIdSchema =  z.object({
    id : z.string()
})


export const getChatByIdSchema =  z.object({ 
    id : z.string()
})

export const endChatSchema =  z.object({
    chatId : z.string()
}) 


export const deleteChatSchema = z.object({
    chatIds : z.array(z.string())
})
