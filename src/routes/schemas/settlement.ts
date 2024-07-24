import * as z from "zod" 

export const intializeSettlementPaymentSchema =  z.object({ 
    amount: z.number(),
    processor:  z.union([z.literal("Paystack"), z.literal("Stripe")]),
    driverId: z.string(),
    driverEmail: z.string().optional(),
    driverPushId: z.string().optional(),
    data: z.record(z.unknown()).optional(),
    rides: z.array(z.string()).optional(),
    isPaymentInit: z.boolean(),
    refunded : z.boolean(),
    workerCreated: z.boolean().optional(),
    settlements: z.array(z.object({ type: z.union([z.literal("commission"), z.literal("subscription")]),   amount : z.number()})).optional() ,
    type: z.union([z.literal("commission"), z.literal("subscription"), z.literal("both")])
}) 

export const getSettlementsforDriverSchema =  z.object({
    cursor : z.string().optional(),
    driverId : z.string(),

})

const stringOrObjectSchema = z.union([z.string(), z.unknown()]);

const objectWithStringKeysSchema = z.record(z.string(), stringOrObjectSchema);

export const webhookSchema = z.object({
    event : z.string(),
    data : objectWithStringKeysSchema
})

export const getSingleSettlementSchema = z.object({
    id: z.string()
})

export const updateSettlementSchema = z.object({
    status : z.string(), 
    settlementId : z.string()
})

export const deleteSettlementsSchema = z.object({
    settlementIds: z.array(z.string()),

})

export const getSettlementAdmin =z.object({
    maxAmount: z.number().optional(),
    minAmount: z.number().optional(),
    processor: z.union([z.literal("Paystack"), z.literal("Stripe")]).optional(),
    driverId: z.string().optional(),
    sort : z.string().optional(),
    cursor : z.string().optional(),
    status: z.union([z.literal("created"), z.literal("success"), z.literal("failed")]).optional(),
    rides: z.array(z.string()).optional(),
})

export const getSettlementStatsSchema = z.object({
   
    driverId: z.string().optional(),
    sort: z.string().optional(),
    type: z.string().optional(),
    amountFrom: z.number(),
    amountTo: z.date().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
})