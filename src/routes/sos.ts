import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum,} from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { SOS as Controller } from "../controllers/sosController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"

import { deleteSOSSchema, getSOSByIdSchema, getSOSSchema, getSOSStatsSchema, intializeSOSSchema } from "./schemas/sos"



const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(intializeSOSSchema) , verifyPermissions([ROLES.RIDER,ROLES.DRIVER]), tryCatch(Controller.createSOS) ) 
 
router.get("/", validateRequest(getSOSSchema), verifyPermissions([ROLES.CX, ROLES.ADMIN, ROLES.ACCOUNT, ROLES.MARKETING, ROLES.SUPERADMIN]) , tryCatch(Controller.getSOS) )

router.get("/:id", validateRequest(getSOSByIdSchema),  verifyPermissions(excludeEnum(ROLES, [ROLES.DEV, ROLES.RIDER,ROLES.DRIVER])), tryCatch(Controller.getSOSById)) 
 

// router.patch('/update', validateRequest(updateStateSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.updateState)) 

router.delete("/delete",  validateRequest(deleteSOSSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteSOS))

router.delete("/stats/calculate",  validateRequest(getSOSStatsSchema),  verifyPermissions(excludeEnum(ROLES, [ROLES.DEV, ROLES.RIDER,ROLES.DRIVER])), tryCatch(Controller.getSOSStats))


export default router