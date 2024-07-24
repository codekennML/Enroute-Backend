import * as z from "zod"


export const knowledgeBaseCategorySchema = z.object({
    name: z.string(),
    isParent: z.boolean(),
    parentId: z.optional(z.string())
})

export const getKnowledgeBaseCategorySchema = z.object({
   categoryId: z.string().optional(),
    parentId: z.string().optional(),
    subCategoryId: z.string().optional(),
    isParent : z.boolean().optional(),
    cursor: z.string().optional(),
    sort: z.string().optional()
})

export const getKnowledgeBaseCategoryByIdSchema = z.object({
    id: z.string()
})

export const updateKnowledgeBaseCategorySchema = z.optional(knowledgeBaseCategorySchema.extend({
    knowledgeBaseCategoryId: z.string()
}))

export const deleteKnowledgeBaseCategoriesSchema = z.object({
    knowledgeBaseIds: z.string()
})

