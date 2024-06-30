import * as z from "zod"
import { dateSeekSchema, placeSchema } from "./base";


export const tripSchema =  z.object({
    driverId: z.string(),
    origin: placeSchema,
    destination: placeSchema,
    distance: z.number(),
    totalfare: z.number().optional(),
    seatAllocationsForTrip: z.number(),
    route: z.string(),
    initialStatus: z.union([z.literal('none'), z.literal('scheduled')]),
    status: z.union([z.literal('cancelled'), z.literal('ongoing'), z.literal('completed'), z.literal('crashed')]),
    
});


export const getTripsSchema = z.object({ 
      tripId : z.optional(z.string()),
        driverId: z.optional(z.string())   ,
        town: z.optional(z.string())  ,
        state: z.optional(z.string()),
        country: z.optional(z.string()),
        cursor: z.optional(z.string())
             
})
export const canStartTripSchema =  z.object({
    id : z.string()
})

export const getDriverTripsSchema =  canStartTripSchema

export const getTripByIdSchema=  z.object({ 
    id : z.string()
})

export const updateTripSchema = z.object({ 
    tripId : z.string(),
    origin : z.optional(placeSchema),
    destination : z.optional(placeSchema),
    status : z.union([z.literal("crashed"), z.literal("completed"), z.literal("paused"), z.literal("completed"), z.literal("ongoing")]).optional()
})

export const endTripSchema = z.object({
    tripId : z.string() ,
    driverId : z.string()
})

export const deleteTripsSchema = z.object({
tripIds : z.array(z.string())
})

export const statsSchema = dateSeekSchema.extend({ 
    country: z.optional(z.string()),
    state: z.optional(z.string()),
    town: z.optional(z.string()),
    type: z.enum(["cancelled", "ongoing", "completed",  "crashed"]).optional(),
    user: z.optional(z.string()),
    userType: z.enum(["driver", "rider"]).optional(),
})