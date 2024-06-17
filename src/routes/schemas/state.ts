import * as z from "zod"

const stateDocs = z.object({
    name: z.string(),
    options: z.array(z.string())
})

const stateSchema = z.object({
    name: z.string(),

    country: z.string(),
    requiredDriverDocs: stateDocs,
    requiredRiderDocs: stateDocs
})

export const getStatesSchema = z.object({
    country: z.string().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional(),
  

})


export const getStateByIdSchema
    = z.object({
        id: z.string()
    })

export const updateStateSchema = z.optional(stateSchema.extend({
    stateId: z.string()
}))

export const deleteStatesSchema = z.object({
    stateIds: z.array(z.string())
})

export const deleteStatesSchema = z.object({
    countryIds: z.array(z.string())
})


