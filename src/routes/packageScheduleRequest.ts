
import express from "express" 
import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { PackageScheduleRequest as Controller } from "../controllers/packageScheduleRequestController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import {  approvePackageScheduleRequestSchema, cancelPackageScheduleSchema, deletePackageScheduleRequestSchema, getPackageRequestScheduleByIdSchema, getPackageScheduleRequestSchema, packageScheduleRequestSchema } from "./schemas/packageScheduleRequest"



const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(packageScheduleRequestSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DRIVER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.createPackageScheduleRequest) ) 

router.post("/approve/schedule",  validateRequest(approvePackageScheduleRequestSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DRIVER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.approvePackageScheduleRequest)) 

router.post("/cancel/schedule",  validateRequest(cancelPackageScheduleSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DRIVER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.cancelScheduleRequest)) 

router.get("/", validateRequest(getPackageScheduleRequestSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.DRIVER])),  tryCatch(Controller.getPackageScheduleRequests) )

router.get("/:id", validateRequest(getPackageRequestScheduleByIdSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER])),  tryCatch(Controller.getPackageScheduleRequestById)) 


router.post("/delete", 
validateRequest(deletePackageScheduleRequestSchema), 
verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER, SUBROLES.STAFF]),  
tryCatch(Controller.deletePackageScheduleRequests)
)
 
// router.post("/stats/schedule", validateRequest(getPackageScheduleStats), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER, SUBROLES.STAFF,SUBROLES.INTERN]),  tryCatch(Controller.getPackageScheduleStats)) 
 

export default router