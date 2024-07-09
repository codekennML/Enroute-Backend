import z from "zod"

export const ticketsSchema =  z.object({
    title : z.string() ,
    body : z.string(), 
    senderAvatarUrl : z.string(), 
    senderEmail : z.string().email()
})