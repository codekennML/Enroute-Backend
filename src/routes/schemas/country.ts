import  * as z from "zod" 

const countryDocs =  z.object({ 
    name : z.string(), 
    options : z.array(z.object({
        type : z.enum(["text", "image"]), //format
        format : z.string() //mp4, png
    }))
})

export const countrySchema =  z.object({ 
    name : z.string(), 
    code : z.string(), 
    boundary : z.array(z.number()), 
    monthlySubscription : z.number(),
    riderCommission : z.number(), 
    driverPercentage : z.number(),
    paymentProcessorbillingPercentage : z.number(), 
    currency : z.string(),
    paymentProcessorbillingExtraAmount: z.number(),
    requiredDriverDocs : countryDocs, 
    requiredRiderDocs : countryDocs
}) 

export const getCountriesSchema =  z.object({
    countryId : z.string().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional(),
    name : z.string().optional()
    
})


export const getCountriesByIdSchema
 = z.object({ 
    id : z.string()
 })

 export const updateCountrySchema = z.optional(countrySchema.extend({ countryId : z.string()}))
  

 export const deleteCountriesSchema =  z.object({ 
    countryIds : z.array(z.string())
 })


