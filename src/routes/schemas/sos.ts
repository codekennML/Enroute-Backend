import * as z from "zod"

export const intializeSOSSchema = z.object({
    tripId: z.string(),
    rideId: z.string(),
    initiator: z.string(),
    lastLocation: z.object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()])
    })
 

})

export const getSOSSchema = z.object({
    cursor: z.string().optional(),
    sosId: z.string().optional(),
    status: z.array(z.string()).optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    town: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    sort: z.string().optional(),
})


export const getSOSByIdSchema = z.object({
    id: z.string()
})

export const updateSOSSchema = z.optional(intializeSOSSchema).extend({
sosId : z.string()
}) 

export const deleteSOSsSchema = z.object({
    sosIds: z.array(z.string()),

})



export const getSOSStatsSchema = z.object({
   country: z.string().optional(),
    state: z.string().optional(),
    town : z.string().optional(),
    dateFrom: z.date(),
    dateTo: z.date().optional(),
})