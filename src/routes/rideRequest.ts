import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { RideRequest as Controller } from "../controllers/rideRequestController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { acceptRideScheduleRequestDriverSchema, cancelRideRequestSchema, deleteRequestSchema, getRideRequestByIdSchema, getRideRequestByTripScheduleSchema, getRideRequestStatsSchema, getRideRequestsSchema, rejectRideScheduleRequestDriverSchema, rideRequestSchema } from "./schemas/rideRequest"




const router =  express.Router() 

router.use(AuthGuard)

router.post("/create/schedule", 
     validateRequest(rideRequestSchema), 
     verifyPermissions([ROLES.RIDER ,  ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER, SUBROLES.STAFF]), 
     tryCatch(Controller.createRideScheduleRequest) ) 


router.get("/create/live",
      
    validateRequest(rideRequestSchema),
    verifyPermissions([ROLES.RIDER ,  ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER, SUBROLES.STAFF]), 
    tryCatch(Controller.createLiveRideRequest) ) 

router.get("/trip_schedule", validateRequest(getRideRequestByTripScheduleSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER, ROLES.DRIVER])) , tryCatch(Controller.getRideRequestByTripSchedule) )


router.get("/", validateRequest(getRideRequestsSchema), verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)) , tryCatch(Controller.getRideRequests) )

router.get("/:id", validateRequest(getRideRequestByIdSchema),  verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)), tryCatch(Controller.getRideRequests)) 
 
router.patch("/driver/accept_schedule", validateRequest(acceptRideScheduleRequestDriverSchema),  verifyPermissions([ROLES.RIDER, ROLES.ADMIN, ROLES.SUPERADMIN])), tryCatch(Controller.acceptRideScheduleRequestDriver) 

router.patch('/driver/reject_request', validateRequest(rejectRideScheduleRequestDriverSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DRIVER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.rejectRideScheduleRequestDriver)) 

router.patch('/driver/negotiate_schedule_fee', validateRequest(rejectRideScheduleRequestDriverSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DRIVER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.negotiateRideScheduleRequestPriceDriver)) 

router.patch('/rider/accept_negotiated_fee', validateRequest(rejectRideScheduleRequestDriverSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DRIVER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.acceptNegotiatedSchedulePriceRider)) 

router.patch('/rider/reject_negotiated_fee', validateRequest(rejectRideScheduleRequestDriverSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.DRIVER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.rejectRideScheduleRequestDriver)) 

router.patch('/cancel', validateRequest(cancelRideRequestSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.RIDER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.rejectRideScheduleRequestDriver)) 

router.get("/stats/calculate", validateRequest(getRideRequestStatsSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER, ROLES.DRIVER, ROLES.DEV])), tryCatch(Controller.getRideRequestStats))

router.delete("/delete",  validateRequest(deleteRequestSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteRideRequests))


export default router