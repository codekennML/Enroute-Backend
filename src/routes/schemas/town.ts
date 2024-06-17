import * as z from "zod"

const townDocs = z.object({
    name: z.string(),
    options: z.array(z.string())
})

const townSchema = z.object({
    name: z.string(),
    state: z.string(),
    country : z.string(),
    requiredDriverDocs: townDocs,
    requiredRiderDocs: townDocs
})

export const getTownsSchema = z.object({
    countryId: z.string().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),

})


export const getTownByIdSchema
    = z.object({
        id: z.string()
    })

export const updateTownSchema = z.optional(townSchema.extend({
    townId: z.string()
}))

export const deleteTownSchema =  z.object({ 
    townIds : z.array(z.string())
})



