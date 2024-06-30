import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { Town as Controller } from "../controllers/townController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { deleteTownsSchema, getTownByIdSchema, getTownsSchema, townSchema, updateTownSchema } from "./schemas/town"

const acceptableRoles =  excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER])
const acceptableSubRoles  =  Object.values(SUBROLES)



const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(
    townSchema) , verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.createTown
) ) 
 
router.get("/", validateRequest(getTownsSchema), verifyPermissions(acceptableRoles,  acceptableSubRoles) , tryCatch(Controller.getTowns) )

router.get("/:id", validateRequest(getTownByIdSchema),  verifyPermissions(acceptableRoles,  acceptableSubRoles), tryCatch(Controller.getTownById)) 
 

router.patch('/update', validateRequest(updateTownSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.updateTown
)) 

router.delete("/delete",  validateRequest(deleteTownsSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteTowns))


export default router