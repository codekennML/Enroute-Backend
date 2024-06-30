
import express from "express" 
const router  = express.Router()

import {Ride as rideController} from "../controllers/rideController" 
import { tryCatch } from "../middlewares/errors/tryCatch"
import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum} from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { IRideScheduleSchema,    } from "./schemas/base"
import { 
    canStartRideSchema, cancelRideSchema, endRideSchema, 
    getOutstandingDriverRideSettlementsSchema, getRideByIdSchema, 
    rideSchema,
    livePackageScheduleSchema,
startScheduledPackageRideSchema,
getRidesSchema,
rideStatsSchema,
billRideSchema
} from "./schemas/ride"
import AuthGuard from "../middlewares/auth/verifyTokens"


router.use(AuthGuard)
//RIDERS
router.post("/live/start", 
    validateRequest(rideSchema)
, 
verifyPermissions([ROLES.RIDER, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), 
tryCatch(rideController.createLiveRide)
)

router.post("/live/package/start", 
validateRequest(livePackageScheduleSchema),
verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), 
tryCatch(rideController.createLivePackageRide))

router.post("/schedule/start", validateRequest(IRideScheduleSchema), verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN],[SUBROLES.MANAGER]), tryCatch(rideController.startScheduledRide))

router.post("/schedule/package/start", validateRequest(startScheduledPackageRideSchema),  verifyPermissions([ROLES.DRIVER]), tryCatch(rideController.startScheduledRide))

router.get("/",
validateRequest(getRidesSchema),
verifyPermissions(Object.values(ROLES), Object.values(SUBROLES) ),
tryCatch(rideController.getRides))

router.get("/:id", validateRequest(getRideByIdSchema), verifyPermissions([...Object.values(ROLES)], Object.values(SUBROLES)), tryCatch(rideController.getRideById))

router.get("/can_ride", validateRequest(canStartRideSchema), verifyPermissions([ROLES.RIDER]), tryCatch(rideController.canStartRide ))

router.patch("/cancel", validateRequest(cancelRideSchema), verifyPermissions([ROLES.RIDER, ROLES.RIDER, ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CX],  [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(rideController.cancelRide))

router.get("/settlements/:id", validateRequest(getOutstandingDriverRideSettlementsSchema),  

verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.CX, ROLES.ACCOUNT], Object.values(SUBROLES)), 

tryCatch(rideController.getOutstandingDriverRideSettlements))

//DRIVERS
router.patch("/bill",
     validateRequest(billRideSchema),
     verifyPermissions([ROLES.DRIVER, ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CX],  [SUBROLES.MANAGER,  SUBROLES.STAFF]),
tryCatch(rideController.calculateRideBill))



//ADMIN
router.get("/stats/calculate", 
validateRequest(rideStatsSchema),
verifyPermissions(excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER])),
tryCatch(rideController.getRideStats))

export default router