import * as z from "zod"
import { placeSchema } from "./base"

export const packageScheduleSchema = z.object({
    createdBy: z.string(),
    type: z.union([z.literal('HTH'), z.literal('STS')]),
    budget: z.number(),
    acceptedBudget: z.number().optional(),
    packageDetails: z.object({
        recipient: z.object({
            firstname: z.string(),
            lastname: z.string(),
            countryCode: z.number(),
            mobile: z.number(),
        }),
        comments: z.string(),
    }),
    dueAt: z.date(),
    expiresAt: z.date(),
    status: z.union([z.literal("filled"),  z.literal("created"), z.literal("expired")]),
    totalDistance: z.number(),
    destinationAddress: placeSchema,
    pickupAddress : placeSchema
})

export const getPackageSchedules = z.object({ 
    packageScheduleId: z.string().optional(),
    cursor: z.string().optional(),
    pickupTown: z.string().optional(),
    destinationTown: z.string().optional(),
    sort: z.string().optional(),
    expiresAt: z.date().optional(),
    budget : z.optional(z.object({
        max: z.number(),
        min: z.number()
    })),
    type: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional()
})

export const getPackageByIdSchema =  z.object({ 
    id : z.string()
})

export const cancelPackageSchedule =  z.object({ 
    scheduleId : z.string()
}) 

export const deletePackageSchedulesSchema  =  z.object({ 
    scheduleIds : z.array(z.string())
})
