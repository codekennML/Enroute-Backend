import  * as z from "zod" 

const countryDocs =  z.object({ 
    name : z.string(), 
    options : z.array(z.string())
})

export const countrySchema =  z.object({ 
    name : z.string(), 
    code : z.string(), 
    boundary : z.array(z.number()), 
    monthlySubscription : z.number(),
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

 export const updateCountrySchema = z.optional(CountrySchema.extend({ countryId : z.string()}))
  

 export const deleteCountriesSChema =  z.object({ 
    countryIds : z.array(z.string())
 })


