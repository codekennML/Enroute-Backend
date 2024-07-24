import * as z from "zod"

export const documentsSchema = z.object({
    userId: z.string(),
    vehicleId: z.optional(z.string()),
    name: z.string().min(1).max(100),
    imageUrl: z.array(z.string()).min(1),
    isVerified: z.optional(z.boolean()),
    verificationResponse: z.optional(z.record(z.unknown())),
    issued: z.optional(z.date()),
    expiry: z.optional(z.date()),
    isRejected: z.optional(z.boolean()),
    archived: z.optional(z.boolean()),
    fieldData: z.optional(z.record(z.string())),
    rejectionFeedback: z.optional(z.string()),
    status: z.optional(z.union([z.literal('pending'), z.literal('assessed'), z.literal('none')])),
    approvedBy: z.optional(z.string()),
    country : z.string()
});


export const findDocumentsSchema =  z.object({
    isVerified :z.boolean().optional(),
    status:  z.optional(z.union([z.literal('pending'), z.literal('assessed')])) ,
    cursor : z.string().optional(), 
    name : z.string().optional(), 
    user : z.string().optional(),
    sort: z.string().optional()
}) 

export const getPendingUserDocumentsSchema = z.object({ 
    user :z.string(),
    cursor : z.string()
})
 

export const getDocumentByIdSchema =  z.object({
    id :z.string()
}) 

export const markDocumentApprovedSchema =  z.object({ 
    documentId : z.string(), 

}) 

export const getUserVerificationDocumentsSchema =  z.object({ 
    userId : z.string()
})

export const markDocumentRejectedSchema = z.object({
    documentId: z.string(),
    adminId: z.string(), 
    rejectionFeedback : z.string()
}) 

export const getDocumentStatsSchema = z.object({ 
    userId : z.string().optional(), 
    dateFrom :z.date().optional(), 
    dateTo : z.date().optional(), 
    status : z.enum(['pending', 'assessed']).optional(), 
    country : z.string().optional()
})






