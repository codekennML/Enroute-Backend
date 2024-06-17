import z from "zod"
import { placeSchema,  cancellationDataSchema, coordinatesSchema, dateSeekSchema} from "./base"
import { busStationSchema } from "./busStation"
import {packageScheduleSchema} from "./packageSchedule"


export const rideSchema = z.object({
    driverId: z.string(),
    tripId: z.string(),
    riderId: z.string(),
    packageRequestId: z.optional(z.string()),
    pickedUp: z.boolean(),
    pickupTime: z.date(),
    alighted: z.optional(z.boolean()),
    dropOffTime: z.optional(z.date()),
    type: z.union([z.literal('solo'), z.literal('share'), z.literal('package')]),
    packageCategory: z.optional(z.union([z.literal('STS'), z.literal('HTH')])),
    cancellationData: z.optional(cancellationDataSchema),
    seatsOccupied: z.optional(z.number()),
    pickupStation: z.optional(busStationSchema),
    origin: z.union([placeSchema, busStationSchema]),
    distance: z.optional(z.number()),
    destination: z.union([busStationSchema, placeSchema]),
    dropOffLocation: z.optional(placeSchema),
    route: z.optional(z.string()),
    rideTotalDistance: z.number(),
    acceptedFare: z.number(),
    paidFare: z.optional(z.number()),
    driverCommission: z.optional(z.number()),
    riderCommission: z.optional(z.number()),
    totalCommission: z.optional(z.number()),
    commissionPaid: z.optional(z.boolean()),
    settlement: z.optional(
        z.object({
            identifier: z.string(),
            amount: z.number(),
        })
    ),
    initialStatus: z.union([z.literal('none'), z.literal('scheduled')]),
    status: z.union([
        z.literal('scheduled'),
        z.literal('cancelled'),
        z.literal('ongoing'),
        z.literal('completed'),
        z.literal('crashed'),
        z.literal('abandoned'),
    ]),
    packageDetails: z.optional(
        z.object({
            recipient: z.object({
                firstname: z.string(),
                lastname: z.string(),
                countryCode: z.string(),
                mobile: z.string(),
            }),
            comments: z.string(),
        })
    ),
    friendData: z.optional(
        z.array(
            z.object({
                firstname: z.string(),
                lastname: z.string(),
                countryCode: z.string(),
                mobile: z.string(),
            })
        )
    ),
});


export const getRidesSchema =  dateSeekSchema.extend({ 
    rideId: z.string().optional(),
    cursor: z.string().optional(),
    town: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    sort: z.string().optional(),
    tripId: z.string().optional()
})


export const livePackageScheduleSchema = packageScheduleSchema.extend({
    driverId: z.string(),
    acceptedFared: z.number(),
    tripId: z.string()
})

export const startScheduledPackageRideSchema = z.object({
    tripId: z.string(),
    origin: placeSchema,
    packageScheduleRequestId: z.string()
})

export const getRideByIdSchema = z.object({
    id : z.string()
})
export const canStartRideSchema =  z.object({ 
    town : z.string(), 
})

export const getOutstandingDriverRideSettlementsSchema = z.object({
    id: z.string()
})

export const cancelRideSchema = z.object({ 
    userId : z.string(), 
    cancellationData : cancellationDataSchema, 
    rideId : z.string()

})

export const endRideSchema = z.object({ 
    tripId :z.string(), 
    rideId : z.string(), 
    userId : z.string(), 
    origin : coordinatesSchema, 
    destination : coordinatesSchema, 
    currentLocation : placeSchema

})

export const rideStatsSchema =  z.object({
    dateFrom: z.date(),
    dateTo: z.date(),
    country : z.optional(z.string()),
    state : z.optional(z.string()),
    town : z.optional(z.string()),
    type:  z.enum(["solo", "share", "package"]).optional(),
    user: z.optional(z.string()), 
    // userType: z.enum(["driver", "rider"]).optional(),
})