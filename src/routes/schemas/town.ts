import * as z from "zod"

const townDocs = z.object({
    name: z.string(),
    options: z.array(z.object({
        type: z.enum(["text", "image"]), //format
        format: z.string() //mp4, png
    }))
})

export const townSchema = z.object({
    name: z.string(),
    state: z.string(),
    country: z.string(),
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

export const autoCompleteTownSchema
    = z.object({
        townName: z.string()
    })


export const updateTownSchema = z.optional(townSchema.extend({
    townId: z.string()
}))

export const deleteTownsSchema = z.object({
    townIds: z.array(z.string())
})



