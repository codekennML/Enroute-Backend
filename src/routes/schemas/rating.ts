import * as z from "zod"


export const ratingSchema = z.object({
    userId : z.string(),
    raterId : z.string(), 
    rideId : z.string(),
    rating : z.number()
})

export const getRatingsSchema = z.object({
    ratingId: z.string().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),

})


export const getRatingByIdSchema
    = z.object({
        id: z.string()
    })

export const updateRatingSchema = z.optional(ratingSchema.extend({
    ratingId: z.string()
}))

export const deleteRatingsSchema =  z.object({ 
    ratingIds : z.array(z.string())
})



