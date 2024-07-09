import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { Documents as Controller } from "../controllers/documentsController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { documentsSchema, findDocumentsSchema, getDocumentByIdSchema, getDocumentStatsSchema, getPendingUserDocumentsSchema, markDocumentApprovedSchema, markDocumentRejectedSchema } from "./schemas/documents"


const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(documentsSchema) , verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DRIVER , ROLES.RIDER], [SUBROLES.MANAGER]), tryCatch(Controller.createUserDocuments) ) 
 


router.get("/", validateRequest(findDocumentsSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.RIDER, ROLES.DRIVER, ROLES.CX]) , tryCatch(Controller.findDocuments))

router.get("/user/pending", validateRequest(getPendingUserDocumentsSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.CX]) , tryCatch(Controller.findDocuments))

router.get("/:id", validateRequest(getDocumentByIdSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.RIDER, ROLES.DRIVER, ROLES.CX]), tryCatch(Controller.findDocumentsById)) 
 

router.patch('/approve', validateRequest(markDocumentApprovedSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN,ROLES.CX], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.markDocumentApproved)) 

router.patch('/reject', validateRequest(markDocumentRejectedSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN,ROLES.CX], [SUBROLES.MANAGER]), tryCatch(Controller.markDocumentRejected)) 

router.delete("/stats/calculate",  validateRequest(getDocumentStatsSchema),  verifyPermissions(excludeEnum (ROLES,[ROLES.RIDER, ROLES.DRIVER, ROLES.DEV])), tryCatch(Controller.getDocumentsStats))


export default router