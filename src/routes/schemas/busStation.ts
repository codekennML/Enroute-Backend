import * as z from "zod"
import { dateSeekSchema } from "./base"

export const busStationSchema = z.object({
    name: z.string(),
    placeId: z.string(),
    active : z.boolean(),
    location: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    }),
    suggestedBy : z.string().optional(),
    approvedBy : z.string().optional(),
    
})

export const createBusStationSchema =  busStationSchema.extend({
    user : z.string()
})

export const getStationsSchema = dateSeekSchema.extend({
    stationId: z.string().optional(),
    cursor: z.string().optional(),
    town: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    sort: z.string().optional(),
    active: z.boolean().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional()
})

export const suggestBusStationSchema = z.object({
user : z.string()
})

export const considerSuggestedStationSchema =  z.object({
    stationId : z.string(), 
    decision : z.union([z.literal("approved"), z.literal( "rejected") ])
})

export const getStationByIdSchema = z.object({
    id: z.string()
})

export const updateStationSchema = busStationSchema.extend({ 
    stationId : z.string()
})

export const deleteBusStationsSchema = z.object({ 
    busStationIds : z.array(z.string()) 
})

export const busStationsStatsSchema =  z.object({
    country : z.string().optional(),
    town : z.string().optional(),
    state : z.string().optional()
})