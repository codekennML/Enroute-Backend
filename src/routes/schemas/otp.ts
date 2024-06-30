import * as z from "zod"

// export const otpSchema = z.object({
//     user: z.string().optional(),
//     mobile: z.number().optional(),
//     countryCode: z.number().optional(),
//     email: z.string().optional(),
//     hash: z.string().optional(),
//     expiry: z.date().optional(),
//     active: z.boolean().optional(),
//     channel: z.string(),
//     next: z.string().optional(),
// })

export const createOTPSchema =  z.object({
type:  z.union([z.literal("SMS"), z.literal("WhatsApp"), z.literal("Email")]), 
     countryCode: z.optional(z.number()) ,
     mobile: z.optional(z.number()),
     email: z.string().optional(),
     user: z.string().optional(),
     next: z.string().optional(),
})

export const updateOTPSchema = z.object({ 
    otpId : z.string(), 
    type: z.union([z.literal("SMS"), z.literal("WhatsApp"), z.literal("Email")]),

})


export const verifyOTPSchema = z.object({
    otpId: z.string(),
    otp: z.number()
})
