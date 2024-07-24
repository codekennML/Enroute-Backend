import z from "zod"

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
    image : z.array(z.record(z.string())),
    year: z.number(),
    hasAC: z.boolean(),
    driverId: z.string(),
    isVerified: z.boolean(),
    isArchived: z.boolean(),
    status: z.union([z.literal('pending'), z.literal('assessed')]),
    approvedBy: z.string(),
    country : z.string(),
    state : z.string()
});

export const approveVehicleChangeSchema =z.object({
    vehicleId : z.string()
})

export const rejectVehicleChangeSchema =z.object({
    vehicleId : z.string(),
    userEmail :z.string().email()
})

export const deleteVehiclesSchema =z.object({
    vehicleIds : z.array(z.string()),
})

export const getVehicleSchema = z.object({
    vehicleId: z.string().optional(),
    cursor: z.string().optional(),
    sort :  z.string().optional()
})