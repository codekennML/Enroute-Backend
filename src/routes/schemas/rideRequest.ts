import * as z from "zod"
import { cancellationDataSchema, friendDataSchema } from "./base";
import { busStationSchema } from "./busStation";


export const rideRequestSchema = z.object({
    tripScheduleId: z.string().optional(),
    driverId: z.string(),
    riderId: z.string(),
    destination: busStationSchema,
    pickupPoint: busStationSchema,
    hasLoad: z.boolean(),
    numberOfSeats: z.number().optional(),
    type: z.union([z.literal('share'), z.literal('solo')]),
    cancellationData: cancellationDataSchema.optional(),
    totalRideDistance: z.number(),
    initialStatus: z.union([z.literal('scheduled'), z.literal('live')]),
    riderBudget: z.number(),
    driverBudget: z.number(),
    driverDecision: z.optional(z.union([z.literal('accepted'), z.literal('rejected'), z.literal('riderBudget')])),
    riderDecision: z.optional(z.union([z.literal('accepted'), z.literal('rejected')])),
    status: z.union([z.literal('created'), z.literal('cancelled'), z.literal('closed')]),
    friendData: z.array(friendDataSchema).optional(),
})

export const getRideSCheduleSchema= z.object({ 
    tripScheduleId : z.string(),
    cursor : z.string(), 
    driverId : z.string()
}) 

export const acceptRideScheduleRequestDriverSchema = z.object({ 
    rideRequestId : z.string(), 
    driverId : z.string()
})


export const rejectRideScheduleRequestDriverSchema = acceptRideScheduleRequestDriverSchema 


export const negotiateRideScheduleRequestPriceSchema =  z.object({ 
    rideRequestId: z.string(),
    driverBudget: z.number(),
    driverId: z.string()
})

export const rejectNegotaiatedScheduleRequestPriceRider =  z.object({ 
    rideRequestId :z.string(), 
    riderId : z.string()
})

export const cancelRideRequestSchema =  z.object({ 
   rideRequestId  : z.string()
})

export const getRideRequestsSchema =  z.object({ 
    cursor: z.string().optional(),
    status: z.string().optional(),
    tripScheduleId: z.string().optional(),
    driverId: z.string().optional(),
    sort: z.string().optional(),
    type: z.string().optional(),
    forThirdParty: z.boolean().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
})

