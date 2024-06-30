
import express from "express"
import { trips as Controller } from "../controllers/tripsController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { canStartTripSchema, getTripByIdSchema, getTripsSchema, updateTripSchema, deleteTripsSchema, endTripSchema, statsSchema, tripSchema, getDriverTripsSchema, createTripFromSchedule, createTripFromScheduleSchema } from "./schemas/trips"
import AuthGuard from "../middlewares/auth/verifyTokens"

const router = express.Router()

router.use(AuthGuard)

router.post("/create", validateRequest(tripSchema), verifyPermissions([ROLES.DRIVER, ROLES.SUPERADMIN, ROLES.ADMIN]), tryCatch(Controller.createTrip))

router.post("/create_from_schedule", validateRequest(createTripFromScheduleSchema), verifyPermissions([ROLES.DRIVER, ROLES.SUPERADMIN, ROLES.ADMIN]), tryCatch(Controller.createTripFromTripSchedule) )

router.get("/", validateRequest(getTripsSchema),  verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER, ROLES.DRIVER]), Object.values(SUBROLES)), tryCatch(Controller.getTrips))

router.get("/driver/:id", validateRequest(getDriverTripsSchema),  verifyPermissions([ROLES.DRIVER], Object.values(SUBROLES)), tryCatch(Controller.getTrips))

router.post("/canStartTrip", validateRequest(canStartTripSchema), verifyPermissions([ROLES.DRIVER]),  tryCatch(Controller.canStartTrip))

router.get("/:id", validateRequest(getTripByIdSchema), verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)), tryCatch(Controller.getTripById))

router.patch("/update_trip", validateRequest(updateTripSchema), verifyPermissions([ROLES.CX, ROLES.ADMIN, ROLES.DRIVER, ROLES.SUPERADMIN], [ SUBROLES.STAFF, SUBROLES.MANAGER]), tryCatch(Controller.updateTrip))

router.patch("/end", validateRequest(endTripSchema), 
//  verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.ADMIN, ROLES.CX], [SUBROLES.MANAGER, SUBROLES.STAFF]),

 tryCatch(Controller.endTrip))

router.delete("/delete", validateRequest(deleteTripsSchema),  
verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.ACCOUNT],[SUBROLES.MANAGER]), 
tryCatch(Controller.deleteTrips))

router.get("/stats/calculate", validateRequest(statsSchema), 
verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER, ROLES.DRIVER]))
, 
 tryCatch(Controller.getTripsStats))

export default router