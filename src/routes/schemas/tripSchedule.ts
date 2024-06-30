import z from "zod"
import { placeSchema } from "./base";

export  const tripScheduleSchema = z.object({
    driverId: z.string(),
    origin: placeSchema,
    destination: placeSchema,
    departureTime: z.date(),
    seatAllocationsForTrip: z.number(),
    route: z.string(),
    status: z.union([z.literal('created'), z.literal('cancelled')]),
});


export const getTripScheduleSchema =  z.object({
    scheduleId : z.string().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional(),
    driverId : z.string().optional(),
    dateFrom :z.date().optional(),
    dateTo : z.date().optional(),
    town : z.string().optional(),
    state: z.string().optional(),
    country : z.string().optional(),
})


export const getTripScheduleByIdSchema
 = z.object({ 
    tripScheduleId : z.string()
 })

 export const cancelTripScheduleSchema = z.object({ 
    tripScheduleId : z.string()
 })

 export const updateTripDepartureTimeSchema =  z.object({
    tripScheduleId : z.string(),
    departureTime :z.date()
 })


 export const deleteTripScheduleSchema =  z.object({ 
    tripScheduleIds : z.array(z.string())
 })

 export const tripScheduleStatsSchema =  z.object({
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    status: z.union([z.literal("created"), z.literal("cancelled"), z.literal("started")]).optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    town: z.string().optional()
 })

