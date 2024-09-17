import * as z from "zod"

export const stateDocs = z.object({
    name: z.string(),
    options: z.array(z.object({
        type: z.enum(["text", "image"]), //format
        format: z.string() //mp4, png
    }))
})

export const stateSchema = z.object({
    name: z.string(),
    country: z.string(),
    requiredDriverDocs: stateDocs,
    requiredRiderDocs: stateDocs
})

export const getStatesSchema = z.object({
    country: z.string().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional(),
    name: z.string().optional(),
})

export const autoComplete = z.object({
    countryId: z.string(),
    stateName: z.string()
})

export const getStateByIdSchema
    = z.object({
        id: z.string()
    })
export const getStateRequiredDocs = getStateByIdSchema.extend({
    serviceType: z.string().optional(),
    userRole: z.string()
})

export const updateStateSchema = z.optional(stateSchema.extend({
    stateId: z.string()
}))

export const deleteStatesSchema = z.object({
    stateIds: z.array(z.string())
})



