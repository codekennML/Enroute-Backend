
import * as z from "zod"

export const signInMobileSchema = z.object({ 
    mobile : z.number(), 
    countryCode : z.number()
})

export const signInEmailSchema = z.object({
 email : z.string()
})
export const signInGoogleSchema  =  z.object({
    id : z.string(), 
    token : z.string(), 
    email : z.string(), 
})

export const verifyAccountViaMobileSchema  =  z.object({
    otpId : z.string(),
    otp : z.number(), 
    isNonMobileSignup: z.boolean(),
    deviceId: z.string(), deviceOS: z.string(), deviceBrowser: z.string(), deviceIP: z.string() 

})

export const handleDuplicateAccountSchema =  z.object({
    user: z.string(), 
    isNonMobileSignup: z.boolean(), 
    selectedAccount: z.object({ 
        id: z.string().optional(),
        firstName: z.string().optional(),
    }),
    accountToArchive: z.object({ id: z.string(), firstName : z.string().optional() }), 
     deviceId: z.string(), 
     deviceOS: z.string(), 
     deviceBrowser: z.string(),
     deviceIP: z.string()
})

export const checkDuplicateSchema =  z.object({
    mobile :z.number().optional(), 
    countryCode: z.number().optional(), 
    user: z.string(),

})

export const checkLoginUpdateSchema =  z.object({
    mobile :z.number().optional(), 
    countryCode: z.number().optional(), 
   email : z.number().optional()
})

export const handleUserCanUpdateLoginDataSchema =  checkDuplicateSchema.extend({
    email : z.string().email().optional(),
    isVet : z.boolean()
})

export const changeAuthDataSchema =  z.object({ 
   otpId : z.string(), 
   otp : z.number() 
})

export const verifyUserEmailSchema =  changeAuthDataSchema

export const logoutSchema = z.object({ 
    user :z.string()
})




