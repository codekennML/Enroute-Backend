import { Vehicle as Controller } from "../controllers/vehicleController"

import express from "express";
import { tryCatch } from "../middlewares/errors/tryCatch";
import validateRequest from "../middlewares/validation/base";
import AuthGuard from "../middlewares/auth/verifyTokens";
import { verifyPermissions } from "../middlewares/auth/permissionGuard";
import { ROLES, SUBROLES } from "../config/enums";

import { approveVehicleChangeSchema, deleteVehiclesSchema, getVehicleSchema, rejectVehicleChangeSchema, vehicleSchema } from "./schemas/vehicles";

const router = express.Router();

router.use(AuthGuard)

router.get("/", verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)), validateRequest(getVehicleSchema),  tryCatch(Controller.getVehicles))

router.post("/change", 
    verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.RIDER, ROLES.DRIVER]), 
    validateRequest(vehicleSchema), 
    tryCatch(Controller.changeVehicle))


router.post("/reject_vehicle_change", validateRequest(rejectVehicleChangeSchema), verifyPermissions([ROLES.SUPERADMIN,ROLES.ADMIN, ROLES.CX], [SUBROLES.MANAGER, SUBROLES.STAFF]),  tryCatch(Controller.rejectVehicleChange))

router.patch("/approve_vehicle_change", validateRequest(approveVehicleChangeSchema), verifyPermissions([ROLES.SUPERADMIN,ROLES.ADMIN, ROLES.CX], [SUBROLES.MANAGER, SUBROLES.STAFF]),  tryCatch(Controller.rejectVehicleChange))

router.patch("/delete_vehicles", validateRequest(deleteVehiclesSchema), verifyPermissions(Object.values(ROLES), [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.deleteVehicles))


export default router;
