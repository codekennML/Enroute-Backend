
import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { KnowledgeBase as Controller } from "../controllers/knowledgeBaseController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { deleteKnowledgeBaseSchema, getKnowledgeBaseByIdSchema, getKnowledgeBaseSchema, knowledgeBaseSchema,  updateKnowledgeBaseSchema } from "./schemas/knowledgeBase"



const router =  express.Router() 

router.get("/", validateRequest(getKnowledgeBaseSchema),  tryCatch(Controller.getKnowledgeBase) )

router.get("/:id", validateRequest(getKnowledgeBaseByIdSchema),   tryCatch(Controller.getKnowledgeBaseById)) 
 

router.use(AuthGuard)

router.post("/create",  validateRequest(knowledgeBaseSchema) , verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.MARKETING], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.createKnowledgeBase) ) 
 
router.patch('/update', validateRequest(updateKnowledgeBaseSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.MARKETING], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.updateKnowledgeBase)) 

router.delete("/delete",  validateRequest(deleteKnowledgeBaseSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteKnowledgeBase))


export default router