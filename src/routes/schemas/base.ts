import * as z from 'zod';




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

export const dateSeekSchema =  z.object({ 
  dateFrom :z.optional(z.date())  ,
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

export  const emergencyContactSchema = z.object({
    name: z.string(),
    mobile: z.number(),
    countryCode: z.number(),
    address: z.string(),
});


export const userSchema = z.object({
    firstName: z.string().optional(),
    email: z.string().optional(),
    avatar: z.string().optional(),
    socialName: z.string().optional(),
    lastName: z.string().optional(),
    birthDate: z.date().optional(),
    mobile: z.number(),
    gender: z.enum(["male", "female"]).optional(),
    deviceToken: z.string(),
    roles: z.number(),
    subRole: z.number().optional(),
    hasUsedSocialAuth: z.boolean(),
    googleId: z.string().optional(),
    googleEmail: z.string().optional(),
    fbId: z.string().optional(),
    fbEmail: z.string().optional(),
    appleId: z.string().optional(),
    appleEmail: z.string().optional(),
    status: z.enum(["new", "verified"]),
    verifyHash: z.object({
        token: z.string(),
        expiresAt: z.date(),
    }).optional(),
    verified: z.boolean(),
    active: z.boolean().optional(),
    suspended: z.boolean().optional(),
    banned: z.boolean().optional(),
    lastLoginAt: z.date(),
    emailVerifiedAt: z.date(),
    mobileVerifiedAt: z.date(),
    emailVerificationData: z.object({
        token: z.string(),
        expiry: z.date(),
    }).optional(),
    mobileVerificationData: z.object({
        token: z.string(),
        expiry: z.date(),
    }).optional(),
    emailVerified: z.boolean().optional(),
    mobileVerified: z.boolean().optional(),
    resetTokenHash: z.string().optional(),
    refreshToken: z.string().optional(),
    countryCode: z.number(),
    resetTokenData: z.record(z.union([z.date(), z.boolean()])).optional(),
    paymentMethod: paymentMethodSchema.optional(),
    about: z.string().optional(),
    street: z.string().optional(),
    isOnline: z.boolean().optional(),
    dispatchType: z.array(z.string()).optional(),
    rating: z.number(),
    emergencyContacts: z.array(emergencyContactSchema).optional(),
    stateOfOrigin: z.string().optional(),
    serviceType: z.array(z.string()),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deviceIds: z.array(z.string()),
})

export const cancellationDataSchema = z.object({
    status: z.boolean(),
    initiator: z.string(),
    initiatedBy: z.union([z.literal('driver'), z.literal('rider'), z.literal('admin')]),
    time: z.date(),
    cancellationReason: z.string(),
    driverDistanceFromPickup: z.number(),
    driverEstimatedETA: z.number(),
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


export  const otpSchema = z.object({
    user: z.string().optional(),
    mobile: z.number().optional(),
    countryCode: z.number().optional(),
    email: z.string().optional(),
    hash: z.string().optional(),
    expiry: z.date().optional(),
    active: z.boolean().optional(),
    channel: z.string(),
    next: z.string().optional(),
})

export const packageScheduleRequestSchema = z.object({
    packageScheduleId: z.string(),
    budget: z.number(),
    body: z.string(),
    createdBy: z.string(),
    status: z.string(),
});

export const packageScheduleSchema = z.object({
    createdBy: z.string(),
    type: z.union([z.literal('HTH'), z.literal('STS')]),
    budget: z.number(),
    acceptedBudget: z.number().optional(),
    packageDetails: z.object({
        recipient: z.object({
            firstname: z.string(),
            lastname: z.string(),
            countryCode: z.string(),
            mobile: z.string(),
        }),
        comments: z.string(),
    }),
    dueAt: z.date(),
    expiresAt: z.date(),
    status: z.string(),
    totalDistance: z.number(),
    destinationAddress: z.unknown(), // Update this based on the actual structure of the 'Place' type
})


export  const ticketsSchema = z.object({
    userId: z.string(),
    email: z.string(),
    category: z.string(),
    title: z.string(),
    body: z.string(),
    documentsUrl: z.object({
        url: z.string(),
        type: z.union([z.literal('image'), z.literal('video')]),
        format: z.union([z.literal('mp4'), z.literal('mp4')]),
        name: z.string(),
    })
});

export  const inspectionSchema = z.object({
    provider: z.string(),
    issueDate: z.date(),
    expiryDate: z.date(),
    image: z.object({
        front: z.string(),
        back: z.string().optional(),
    }),
});

const insuranceSchema = z.object({
    provider: z.date(),
    issueDate: z.date(),
    expiryDate: z.date(),
    image: z.object({
        front: z.string(),
        back: z.string().optional(),
    }),
});

export  const vehicleSchema = z.object({
    vehicleModel: z.string(),
    vehicleMake: z.string(),
    inspection: inspectionSchema,
    insurance: insuranceSchema,
    licensePlate: z.string(),
    year: z.number(),
    hasAC: z.boolean(),
    driverId: z.string(),
    isVerified: z.boolean(),
    isArchived: z.boolean(),
    status: z.union([z.literal('pending'), z.literal('assessed')]),
    approvedBy: z.string(),
});

export  const friendDataSchema = z.object({
    firstname: z.string(),
    lastname: z.string(),
    countryCode: z.string(),
    mobile: z.string(),
});

export  const rideRequestSchema = z.object({
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
    driverDecision: z.union([z.literal('accepted'), z.literal('rejected'), z.literal('riderBudget')]),
    riderDecision: z.union([z.literal('accepted'), z.literal('rejected')]),
    status: z.union([z.literal('created'), z.literal('cancelled'), z.literal('closed')]),
    friendData: z.array(friendDataSchema).optional(),
})

export  const requiredDocSchema = z.object({
    name: z.string(),
    options: z.array(z.string()),
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

export  const tripScheduleSchema = z.object({
    driverId: z.string(),
    origin: placeSchema,
    originTown: z.string(),
    originState: z.string(),
    originCountry: z.string(),
    destinationTown: z.string(),
    destinationState: z.string(),
    destination: placeSchema,
    vehicleId: z.string(),
    departureTime: z.date(),
    seatAllocationsForTrip: z.number(),
    route: z.string(),
    status: z.union([z.literal('created'), z.literal('cancelled')]),
});

export const coordinatesSchema = z.object({
    coordinates: z.array(z.number),
    name: z.optional(z.string()),
    placeId: z.optional(z.string()),
});
