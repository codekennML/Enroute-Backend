import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { TripSchedule as Controller } from "../controllers/tripScheduleController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"

import { cancelTripScheduleSchema, deleteTripScheduleSchema, getTripScheduleByIdSchema, getTripScheduleSchema, tripScheduleSchema, tripScheduleStatsSchema, updateTripDepartureTimeSchema } from "./schemas/tripSchedule"


const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(
    tripScheduleSchema) , verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER, SUBROLES.STAFF]),
     tryCatch(Controller.createTripSchedule
) ) 
 
router.get("/", validateRequest(getTripScheduleSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER]), Object.values(SUBROLES)) , tryCatch(Controller.getTripSchedules) )

router.get("/:id", validateRequest(getTripScheduleByIdSchema),  verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER]), Object.values(SUBROLES)), tryCatch(Controller.getTripScheduleId)) 
 

router.patch('/cancel', validateRequest(cancelTripScheduleSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN,ROLES.DRIVER], [SUBROLES.MANAGER,SUBROLES.STAFF]), tryCatch(Controller.cancelTripSchedule
)) 

router.patch('/update_time', validateRequest(updateTripDepartureTimeSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN,ROLES.DRIVER], [SUBROLES.MANAGER,SUBROLES.STAFF]), tryCatch(Controller.updateTripDepartureTime
)) 

router.delete("/delete",  validateRequest(deleteTripScheduleSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteTripSchedules))

router.delete("/stats/calculate",  validateRequest(tripScheduleStatsSchema),  verifyPermissions(excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER]), Object.values(SUBROLES)), tryCatch(Controller.deleteTripSchedules))



export default router