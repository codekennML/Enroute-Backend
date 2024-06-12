
import express from "express" 
const router  = express.Router()
import rideController from "../controllers/rideController" 
import { tryCatch } from "../middlewares/errors/tryCatch"
import { verifyPermissions } from "../middlewares/permissionGuard"
import { ROLES, SUBROLES, excludeEnum} from "../config/enums"




//RIDERS
router.post("/live/start", verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(rideController.createLiveRide))


router.post("/live/package/start", 
    verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), 
tryCatch(rideController.createLivePackageRide))

router.post("/schedule/start", verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.SUPERADMIN],[SUBROLES.MANAGER]), tryCatch(rideController.startScheduledRide))
router.post("/schedule/package/start", verifyPermissions([ROLES.DRIVER]), tryCatch(rideController.startScheduledRide))


router.get("/rides",
verifyPermissions(Object.values(ROLES), Object.values(SUBROLES) ),
tryCatch(rideController.getRides))

router.get("/ride/:id", verifyPermissions([...Object.values(ROLES)], Object.values(SUBROLES)), tryCatch(rideController.getRideById))

router.put("/cancel", verifyPermissions([ROLES.RIDER, ROLES.RIDER, ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CX],  [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(rideController.cancelRide))


//DRIVERS
router.put("/end",
verifyPermissions([ROLES.DRIVER, ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CX],  [SUBROLES.MANAGER,  SUBROLES.STAFF]),
tryCatch(rideController.endRide))

router.get("/settlements_total", 
verifyPermissions(excludeEnum(ROLES, ['RIDER'])),
tryCatch(rideController.getOutstandingDriverSettlements))


//ADMIN
router.get("/stats", 
verifyPermissions(excludeEnum(ROLES, ["DRIVER", "RIDER","DEV"])),
tryCatch(rideController.getRideStats))

export default router