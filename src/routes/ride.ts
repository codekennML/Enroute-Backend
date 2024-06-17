
import express from "express" 
const router  = express.Router()

import rideController from "../controllers/rideController" 
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
rideStatsSchema
} from "./schemas/ride"


//RIDERS
router.post("/live/start", validateRequest(rideSchema), verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(rideController.createLiveRide))


router.post("/live/package/start", 
    validateRequest(livePackageScheduleSchema),
    verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), 
tryCatch(rideController.createLivePackageRide))

router.post("/schedule/start", validateRequest(IRideScheduleSchema), verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN],[SUBROLES.MANAGER]), tryCatch(rideController.startScheduledRide))

router.post("/schedule/package/start", validateRequest(startScheduledPackageRideSchema),  verifyPermissions([ROLES.DRIVER]), tryCatch(rideController.startScheduledRide))


router.get("/all",
    validateRequest(getRidesSchema),
verifyPermissions(Object.values(ROLES), Object.values(SUBROLES) ),
tryCatch(rideController.getRides))

router.get("/:id", validateRequest(getRideByIdSchema), verifyPermissions([...Object.values(ROLES)], Object.values(SUBROLES)), tryCatch(rideController.getRideById))

router.get("/can_ride", validateRequest(canStartRideSchema), verifyPermissions([ROLES.RIDER]), tryCatch(rideController.canStartRide ))

router.put("/cancel", validateRequest(cancelRideSchema), verifyPermissions([ROLES.RIDER, ROLES.RIDER, ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CX],  [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(rideController.cancelRide))

router.get("/driver/settlements", validateRequest(getOutstandingDriverRideSettlementsSchema),  verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.CX, ROLES.ACCOUNT], Object.values(SUBROLES)))

//DRIVERS
router.put("/end",
     validateRequest(endRideSchema),
     verifyPermissions([ROLES.DRIVER, ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CX],  [SUBROLES.MANAGER,  SUBROLES.STAFF]),
tryCatch(rideController.endRide))



//ADMIN
router.get("/stats", 
    validateRequest(rideStatsSchema),
verifyPermissions(excludeEnum(ROLES, ["DRIVER", "RIDER","DEV"])),
tryCatch(rideController.getRideStats))

export default router