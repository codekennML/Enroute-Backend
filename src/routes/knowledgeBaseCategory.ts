
import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { KnowledgeBaseCategory as Controller } from "../controllers/knowledgeBaseCategoryController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { deleteKnowledgeBaseCategoriesSchema, getKnowledgeBaseCategoryByIdSchema, getKnowledgeBaseCategorySchema, knowledgeBaseCategorySchema,  updateKnowledgeBaseCategorySchema,   } from "./schemas/knowledgeBaseCategory"

const router =  express.Router() 

router.get("/", validateRequest(getKnowledgeBaseCategorySchema),  tryCatch(Controller.getKnowledgeBaseCategories) )

router.get("/:id", validateRequest(getKnowledgeBaseCategoryByIdSchema),   tryCatch(Controller.getCategoryById)) 
 
router.use(AuthGuard)

router.post("/create",  validateRequest(knowledgeBaseCategorySchema) , verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.MARKETING], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.createKnowledgeBaseCategory) ) 

router.patch('/update', validateRequest(updateKnowledgeBaseCategorySchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.MARKETING], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.updateKnowledgeBaseCategory)) 

router.delete("/delete",  validateRequest(deleteKnowledgeBaseCategoriesSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteCategory))


export default router