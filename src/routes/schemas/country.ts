import  * as z from "zod" 

const countryDocs =  z.object({ 
    name : z.string(), 
    options : z.array(z.string())
})

const CountrySchema =  z.object({ 
    name : z.string(), 
    code : z.string(), 
    boundary : z.array(z.number()), 
    requiredDriverDocs : countryDocs, 
    requiredRiderDocs : countryDocs
}) 

export const getCountriesSchema =  z.object({
    countryId : z.string().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional(),
    
})


export const getCountriesByIdSchema
 = z.object({ 
    id : z.string()
 })

 export const updateCountrySchema = z.optional(CountrySchema.extend({ countryId : z.string()}))
  

 export const deleteCountriesSChema =  z.object({ 
    countryIds : z.array(z.string())
 })


