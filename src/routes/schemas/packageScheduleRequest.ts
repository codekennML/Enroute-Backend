import * as z from "zod"


export const packageScheduleRequestSchema = z.object({
    packageScheduleId: z.string(),
    budget: z.number(),
    body: z.string(),
    status: z.union([z.literal('accepted') , z.literal('rejected') , z.literal('cancelled') , z.literal('created')] )
});
 
export const approvePackageScheduleRequestSchema =z.object({
    packageScheduleId : z.string(),
    packageRequestId : z.string()
})

export const getPackageSchedules = z.object({
    packageScheduleId: z.string().optional(),
    cursor: z.string().optional(),
    pickupTown: z.string().optional(),
    sort: z.string().optional(),
    expiresAt: z.date().optional(),
    budget: z.optional(z.object({
        max: z.number(),
        min: z.number()
    })),
    status: z.string().optional(),
    dateFrom :z.date().optional(),
    dateTo :z.date().optional()
})

export const getPackageRequestScheduleByIdSchema = z.object({
    id: z.string()
})

export const cancelPackageSchedule = z.object({
    scheduleRequestId: z.string()
})

export const deletePackageSchedulesSchema = z.object({
    scheduleRequestIds: z.array(z.string())
})
