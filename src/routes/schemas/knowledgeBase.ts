import * as z from "zod" 


export const knowledgeBaseSchema = z.object({
    title: z.string(),
    body: z.string(),
    parentCategory: z.optional(z.string()),
    subCategory: z.optional(z.string()),
    country: z.string(),
    state : z.string().optional(), 
    town : z.string().optional(),
    
});

export const getKnowledgeBaseSchema =  z.object({
    knowledgeBaseId: z.string().optional(),
    parentCategoryId: z.string().optional(),
    subCategoryId: z.string().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional()
})

export const getKnowledgeBaseByIdSchema =  z.object({ 
    id : z.string()
})


export const updateKnowledgeBaseSchema =  z.optional(knowledgeBaseSchema.extend({ 
    knowledgeBaseId : z.string()
}))

export const deleteKnowledgeBaseSchema =  z.object({
knowledgeBaseIds : z.array(z.string())
})
