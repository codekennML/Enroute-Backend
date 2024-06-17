import * as z from "zod"
import { dateSeekSchema } from "./base";


export const tripSchema =  z.object({
  
    driverId: z.string(),
    origin: z.object({
        // Define the schema for the Place type
    }),
    destination: z.object({
        // Define the schema for the Place type
    }),
    distance: z.number(),
    departureTime: z.date(),
    endTime: z.date().optional(),
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

export const getTripByIdSchema=  z.object({ 
    id : z.string()
})

export const updateTripSchema = tripSchema.extend({ 
    tripId : z.string()
})
export const endTripSchema = z.object({
    tripId : z.string() ,
    driverId : z.string()
})

export const deleteTripsSchema = z.object({
tripIds : z.array(z.string())
})

export const statsSchema = dateSeekSchema.extend({ 
    dateFrom: z.date(),
    dateTo: z.date(),
    country: z.optional(z.string()),
    state: z.optional(z.string()),
    town: z.optional(z.string()),
    type: z.enum(["cancelled", "ongoing", "completed",  "crashed"]).optional(),
    user: z.optional(z.string()),
    userType: z.enum(["driver", "rider"]).optional(),
})