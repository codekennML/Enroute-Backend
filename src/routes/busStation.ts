import express from "express" 
import { busStationSchema, getStationsSchema, getStationByIdSchema, updateStationSchema, deleteBusStationsSchema } from "./schemas/busStation"
import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import Controller from "../controllers/busStationController"
import { tryCatch } from "../middlewares/errors/tryCatch"


const router =  express.Router() 



router.post("create",  validateRequest(busStationSchema) , verifyPermissions([ROLES.CX, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.STAFF, SUBROLES.MANAGER]), tryCatch(Controller.createBusStation) ) 
 
const acceptableRoles =  excludeEnum(ROLES, ["DRIVER", "RIDER"])
const acceptableSubRoles  =  Object.values(SUBROLES)


router.get("all", validateRequest(getStationsSchema), verifyPermissions(acceptableRoles,  acceptableSubRoles) , tryCatch(Controller.getBusStations) )

router.get(":id", validateRequest(getStationByIdSchema),  verifyPermissions(acceptableRoles,  acceptableSubRoles), tryCatch(Controller.getBuStationById)) 
 

router.patch('update', validateRequest(updateStationSchema),  verifyPermissions(acceptableRoles, [SUBROLES.MANAGER,  SUBROLES.STAFF]), tryCatch(Controller.updateBusStation)) 

router.delete("delete",  validateRequest(deleteBusStationsSchema),  verifyPermissions(acceptableRoles, [ SUBROLES.MANAGER, SUBROLES.STAFF]))
