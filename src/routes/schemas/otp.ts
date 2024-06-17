import * as z from "zod"

export const otpSchema = z.object({
    user: z.string().optional(),
    mobile: z.number().optional(),
    countryCode: z.number().optional(),
    email: z.string().optional(),
    hash: z.string().optional(),
    expiry: z.date().optional(),
    active: z.boolean().optional(),
    channel: z.string(),
    next: z.string().optional(),
})