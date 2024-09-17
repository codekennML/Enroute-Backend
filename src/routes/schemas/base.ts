import * as z from 'zod';


type LatLngCoordinates = [number, number]

export const placeSchema = z.object({
    name: z.string(),
    location: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]).transform((coords): LatLngCoordinates => coords),
    }),
    state: z.optional(z.string()),
    town: z.optional(z.string()),
    country: z.optional(z.string()),
    placeId: z.string(),
});

export const dateSeekSchema = z.object({
    dateFrom: z.optional(z.date()),
    dateTo: z.optional(z.date())
}
)

export const IRideScheduleSchema = z.object({
    rideRequest: z.string(),
    tripId: z.string(),
    driverId: z.string(),
    riderId: z.string(),
    driverPushId: z.string(),
    riderPushId: z.string(),
    driverEmail: z.optional(z.string().email("Invalid driver email")),
    riderEmail: z.optional(z.string().email("Invalid rider email")),
    status: z.enum(["created", "closed", "cancelled"]),
    driverBudget: z.number(),
    riderAccepted: z.boolean()
})

export const sosSchema = z.object({
    tripId: z.string(),
    rideId: z.string(),
    initiator: z.string(),
    lastLocation: z.object({
        type: z.literal("Point"),
        coordinates: z.array(z.number()),
    }),


})

export const paymentMethodSchema = z.object({
    authorization: z.object({
        authorization_code: z.string(),
        bin: z.string(),
        last4: z.string(),
        exp_month: z.string(),
        exp_year: z.string(),
        channel: z.string(),
        card_type: z.string(),
        bank: z.string(),
        country_code: z.string(),
        brand: z.string(),
        reusable: z.boolean(),
    }),
    customer: z.object({
        id: z.number(),
        first_name: z.string(),
        last_name: z.string(),
        email: z.string(),
        customer_code: z.string(),
        phone: z.string(),
        metadata: z.unknown(),
    }),
    isValid: z.boolean(),
});


export const cancellationDataSchema = z.object({
    cancellationReason: z.string().optional(),
    driverDistanceFromPickup: z.number().optional(),
    driverEstimatedETA: z.number().optional(),
});

const timedGeojsonSchema = z.object({
    coordinates: z.array(z.tuple([z.number(), z.number()])),
    timestamp: z.date(),
});

export const routeSchema = z.object({
    tripId: z.string().optional(),
    rideId: z.string().optional(),
    vehicleId: z.string().optional(),
    timedGeojson: z.array(timedGeojsonSchema),
});


export const friendDataSchema = z.object({
    firstname: z.string(),
    lastname: z.string(),
    countryCode: z.string(),
    mobile: z.string(),
});




export const settlementSchema = z.object({
    amount: z.number(),
    processor: z.union([z.literal('paystack'), z.literal('flutterwave'), z.literal('stripe')]),
    driverId: z.string(),
    driverEmail: z.string(),
    processed: z.boolean(),
    status: z.union([z.literal('success'), z.literal('created'), z.literal('failed')]),
    data: z.optional(z.record(z.unknown())),
    rides: z.optional(z.array(z.string())),
    isPaymentInit: z.boolean(),
    failedCount: z.number()

})


export const coordinatesSchema = z.object({
    coordinates: z.array(z.number()),
    name: z.optional(z.string()),
    placeId: z.optional(z.string()),
});
