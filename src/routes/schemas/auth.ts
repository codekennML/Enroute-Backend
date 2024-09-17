
import { z, ZodTypeAny } from "zod"


export const zodInputStringPipe = (zodPipe: ZodTypeAny) =>
    z
        .string()
        .transform((value) => (value === '' ? null : value))
        .nullable()
        .refine((value) => value === null || !isNaN(Number(value)), {
            message: 'Invalid number received',
        })
        .transform((value) => (value === null ? 0 : Number(value)))
        .pipe(zodPipe);


export const signInMobileSchema = z.object({
    mobile: z.number(),
    countryCode: z.number(),
    otpMode: z.enum(["WhatsApp", "SMS"])
})

export const isExistingMobileSchema = z.object({
    mobile: zodInputStringPipe(z.number().positive()),
    countryCode: zodInputStringPipe(z.number().positive()),
})

export const signInEmailSchema = z.object({
    email: z.string()
})
export const signInGoogleSchema = z.object({
    id: z.string(),
    token: z.string(),
    email: z.string(),
})

export const verifyAccountViaMobileSchema = z.object({
    otpId: z.string(),
    otp: z.number(),
    isNonMobileSignup: z.boolean(),

})

export const handleDuplicateAccountSchema = z.object({
    user: z.string(),
    isNonMobileSignup: z.boolean(),
    selectedAccount: z.object({
        id: z.string().optional(),
        firstName: z.string().optional(),
    }),
    accountToArchive: z.object({ id: z.string(), firstName: z.string().optional() }),

})

export const checkDuplicateSchema = z.object({
    mobile: z.number().optional(),
    countryCode: z.number().optional(),
    user: z.string(),

})

export const checkLoginUpdateSchema = z.object({
    mobile: z.number().optional(),
    countryCode: z.number().optional(),
    email: z.string().optional()
})

export const handleUserCanUpdateLoginDataSchema = checkDuplicateSchema.extend({
    email: z.string().email().optional(),
    isVet: z.boolean()
})

export const changeAuthDataSchema = z.object({
    otpId: z.string(),
    otp: z.number()
})

export const verifyUserEmailSchema = changeAuthDataSchema

export const logoutSchema = z.object({
    user: z.string()
})




