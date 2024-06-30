import * as z from "zod"



// export const userSchema = z.object({
//     firstName: z.string().optional(),
//     email: z.string().optional(),
//     avatar: z.string().optional(),
//     socialName: z.string().optional(),
//     lastName: z.string().optional(),
//     birthDate: z.date().optional(),
//     mobile: z.number(),
//     gender: z.enum(["male", "female"]).optional(),
//     deviceToken: z.string(),
//     roles: z.number(),
//     subRole: z.number().optional(),
//     hasUsedSocialAuth: z.boolean(),
//     googleId: z.string().optional(),
//     googleEmail: z.string().optional(),
//     fbId: z.string().optional(),
//     fbEmail: z.string().optional(),
//     appleId: z.string().optional(),
//     appleEmail: z.string().optional(),
//     status: z.enum(["new", "verified"]),
//     verifyHash: z.object({
//         token: z.string(),
//         expiresAt: z.date(),
//     }).optional(),
//     verified: z.boolean(),
//     active: z.boolean().optional(),
//     suspended: z.boolean().optional(),
//     banned: z.boolean().optional(),
//     lastLoginAt: z.date(),
//     emailVerifiedAt: z.date(),
//     mobileVerifiedAt: z.date(),
//     emailVerificationData: z.object({
//         token: z.string(),
//         expiry: z.date(),
//     }).optional(),
//     mobileVerificationData: z.object({
//         token: z.string(),
//         expiry: z.date(),
//     }).optional(),
//     emailVerified: z.boolean().optional(),
//     mobileVerified: z.boolean().optional(),
//     resetTokenHash: z.string().optional(),
//     refreshToken: z.string().optional(),
//     countryCode: z.number(),
//     resetTokenData: z.record(z.union([z.date(), z.boolean()])).optional(),
//     paymentMethod: paymentMethodSchema.optional(),
//     about: z.string().optional(),
//     street: z.string().optional(),
//     isOnline: z.boolean().optional(),
//     dispatchType: z.array(z.string()).optional(),
//     rating: z.number(),
//     emergencyContacts: z.array(emergencyContactSchema).optional(),
//     stateOfOrigin: z.string().optional(),
//     serviceType: z.array(z.string()),
//     createdAt: z.date().optional(),
//     updatedAt: z.date().optional(),
//     deviceIds: z.array(z.string()),
// })


export const createUserSchema = z.object({ 
    firstName : z.string(), 
    lastName : z.string(), 
    email : z.string(), 
    roles : z.number(), 
    subRole : z.number().optional(), 
})

export const getUsersSchema = z.object({
    userId :  z.string().optional(),
    cursor : z.string().optional(),
    town : z.string().optional(),
    sort : z.string().optional(),
    state :z.string().optional(),
    country :  z.string().optional(),
    role : z.string().optional(),
    status: z.enum(["new", "verified"]).optional(),
    verified : z.string().optional(),
    gender : z.string().optional() ,
    suspended : z.boolean().optional(),
    banned : z.boolean().optional(),
})


export const getUserBasicInfo = z.object({
    id : z.string()
})

export const limitUserAccount = z.object({
    limitType : z.union([z.literal("ban"), z.literal("suspended")]), 
    limitReason :z.string(), 
    user : z.string()
})

export const markUserVerifiedSchema = z.object({
    _id: z.string()
})
//TODO
export const changeRoleSchema = z.object({
   
})

 const emergencyContactSchema = z.object({
    name: z.string(),
    mobile: z.number(),
    countryCode: z.number(),
    address: z.string(),
}).optional()

export const updateUserPeripheralDataSchema  =  z.object({
    avatar: z.string().optional() ,
    about : z.string().optional(), 
    emergencyContacts: emergencyContactSchema,
    firstName : z.string().optional(),
    lastName : z.string().optional(),
    deviceToken: z.string().optional(),
    birthDate : z.date().optional(),
    image : z.string().optional()
})

export const getUsersStatsSchema = z.object({ 
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    country: z.optional(z.string()),
    state: z.optional(z.string()),
    town: z.optional(z.string()),
    status: z.enum(["new", "verified"]).optional(),
    userId: z.optional(z.string()),
})
