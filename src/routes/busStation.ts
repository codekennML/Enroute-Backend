import express from "express" 
import {  getStationsSchema, getStationByIdSchema, updateStationSchema, deleteBusStationsSchema, busStationsStatsSchema, createBusStationSchema, suggestBusStationSchema, considerSuggestedStationSchema } from "./schemas/busStation"
import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import Controller from "../controllers/busStationController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"

const acceptableRoles =  excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER])
const acceptableSubRoles  =  Object.values(SUBROLES)

const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(createBusStationSchema) , verifyPermissions([ROLES.CX, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.STAFF, SUBROLES.MANAGER]), tryCatch(Controller.createBusStation) ) 
 

router.get("/", validateRequest(getStationsSchema), verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)) , tryCatch(Controller.getBusStations) )

router.get("/:id", validateRequest(getStationByIdSchema),  verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)), tryCatch(Controller.getBuStationById)) 
 
router.post('/suggest', validateRequest(suggestBusStationSchema),  verifyPermissions([ROLES.RIDER, ROLES.RIDER, ROLES.CX, ROLES.ACCOUNT, ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DEV], [SUBROLES.MANAGER,  SUBROLES.STAFF]), tryCatch(Controller.suggestBusStation)) 

router.post('/considerSuggestion', validateRequest(considerSuggestedStationSchema),  verifyPermissions([ ROLES.CX, ROLES.ACCOUNT, ROLES.SUPERADMIN, ROLES.ADMIN], [SUBROLES.MANAGER,  SUBROLES.STAFF]), tryCatch(Controller.considerSuggestedStation)) 


router.patch('/update', validateRequest(updateStationSchema),  verifyPermissions([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CX], [SUBROLES.MANAGER,  SUBROLES.STAFF]), tryCatch(Controller.updateBusStation)) 

router.delete("/delete",  validateRequest(deleteBusStationsSchema),  verifyPermissions(acceptableRoles, [ SUBROLES.MANAGER, SUBROLES.STAFF]))

router.delete("/stats/calculate",  validateRequest(busStationsStatsSchema),  verifyPermissions(acceptableRoles, acceptableSubRoles))

export default router