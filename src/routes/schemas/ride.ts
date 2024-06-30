import z  from "zod"
import { placeSchema,  cancellationDataSchema, coordinatesSchema, dateSeekSchema} from "./base"
import { busStationSchema } from "./busStation"



export const rideSchema = z.object({
    driverId: z.string(),
    tripId: z.string(),
    riderId: z.string(),
    packageRequestId: z.optional(z.string()),
    dropOffTime: z.optional(z.date()),
    type: z.union([z.literal('solo'), z.literal('share'), z.literal('package')]),
    packageCategory: z.optional(z.union([z.literal('STS'), z.literal('HTH')])),
    cancellationData: z.optional(cancellationDataSchema),
    seatsOccupied: z.optional(z.number()),
    pickupStation: z.union([placeSchema, busStationSchema.extend({
        active : z.boolean().optional()
    }).optional()]),
    origin:z.object({
        type :  z.literal("Point"),
        coordinates : z.array(z.number(), z.number())
    }).optional(),
    distance: z.optional(z.number()),
    destination: z.union([busStationSchema, placeSchema]),
    dropOffLocation: z.object({
        type :  z.literal("Point"),
        coordinates : z.array(z.number(), z.number())
    }).optional(),
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
})
.refine((data) => {

    const hasPickupStation = data.pickupStation !== undefined;
    const hasOrigin = data.origin !== undefined;
    
  
    return (hasPickupStation && hasOrigin) 
}, {
    message: 'Pick-up station must be provided',
})


export const getRidesSchema =  dateSeekSchema.extend({ 
    rideId: z.string().optional(),
    cursor: z.string().optional(),
    status: z.string().optional(),
    town: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    sort: z.string().optional(),
    tripId: z.string().optional()
})


export const livePackageScheduleSchema =z.object({
    driverId: z.string(),
    acceptedFare: z.number(),
    tripId: z.string(),
    createdBy : z.string(),
    pickupAddress : placeSchema, 
    destinationAddress : placeSchema,
    type : z.union([z.literal("STS"),  z.literal("HTH")]),
    totalDistance : z.number()
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

export const billRideSchema = z.object({ 
    tripId :z.string(), 
    rideId : z.string(), 
    currentLocation : placeSchema
})

export const rideStatsSchema =  z.object({
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    country : z.optional(z.string()),
    state : z.optional(z.string()),
    town : z.optional(z.string()),
    type:  z.enum(["solo", "share", "package"]).optional(),
    user: z.optional(z.string()), 
    // userType: z.enum(["driver", "rider"]).optional(),
})