
import express from "express"
const router = express.Router()

import Controller from "../controllers/tripsController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { canStartTripSchema, getTripByIdSchema, getTripsSchema, updateTripSchema, deleteTripsSchema, endTripSchema, statsSchema, tripSchema } from "./schemas/trips"

router.post("create", validateRequest(tripSchema), verifyPermissions([ROLES.DRIVER, ROLES.SUPERADMIN, ROLES.ADMIN]), tryCatch(Controller.createTrips))

router.get("all", validateRequest(getTripsSchema),  verifyPermissions(excludeEnum(ROLES, ["RIDER", "DEV"]), Object.values(SUBROLES)), tryCatch(Controller.getTrips))

router.post("canStartTrip", validateRequest(canStartTripSchema), verifyPermissions([ROLES.DRIVER]),  tryCatch(Controller.canStartTrip))

router.post(":id", validateRequest(getTripByIdSchema), verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)), tryCatch(Controller.getTripById))

router.put("updateTrip", validateRequest(updateTripSchema), verifyPermissions([ROLES.CX, ROLES.ADMIN, ROLES.DRIVER, ROLES.SUPERADMIN], [ SUBROLES.STAFF, SUBROLES.MANAGER]), tryCatch(Controller.updateTrip))

router.put("end", validateRequest(endTripSchema),  verifyPermissions([ROLES.DRIVER, ROLES.ADMIN, ROLES.ADMIN, ROLES.CX], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.endTrip))

router.delete("delete", validateRequest(deleteTripsSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.ACCOUNT],[SUBROLES.MANAGER]), tryCatch(Controller.deleteTrips))

router.get("stats", validateRequest(statsSchema), verifyPermissions(excludeEnum(ROLES, ['RIDER', 'DRIVER'])),  tryCatch(Controller.getTripStats))