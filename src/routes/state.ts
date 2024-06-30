import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { State as Controller } from "../controllers/statesController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { deleteStatesSchema, getStateByIdSchema, getStatesSchema, stateSchema, updateStateSchema } from "./schemas/state"

const acceptableRoles =  excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER])
const acceptableSubRoles  =  Object.values(SUBROLES)



const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(stateSchema) , verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.createState) ) 
 
router.get("/", validateRequest(getStatesSchema), verifyPermissions(acceptableRoles,  acceptableSubRoles) , tryCatch(Controller.getStates) )

router.get("/:id", validateRequest(getStateByIdSchema),  verifyPermissions(acceptableRoles,  acceptableSubRoles), tryCatch(Controller.getStateById)) 
 

router.patch('/update', validateRequest(updateStateSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.updateState)) 

router.delete("/delete",  validateRequest(deleteStatesSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteStates))


export default router