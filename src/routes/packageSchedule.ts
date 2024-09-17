
import express from "express"

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { packageSchedule as Controller } from "../controllers/packageScheduleController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { deletePackageSchedulesSchema, getPackageByIdSchema, getPackageScheduleStats, packageScheduleSchema } from "./schemas/packageSchedule"


const router = express.Router()

router.use(AuthGuard)

router.post("/create", validateRequest(packageScheduleSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.RIDER], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.getPackageSchedules))

router.get("/", validateRequest(packageScheduleSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER])), tryCatch(Controller.getPackageSchedules))

router.get("/:id", validateRequest(getPackageByIdSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER])), tryCatch(Controller.getPackageScheduleById))

router.post("/cancel", validateRequest(getPackageByIdSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER]), [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.cancelSchedule))

router.post("/delete", validateRequest(deletePackageSchedulesSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER]), [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.deletePackageSchedules))

router.post("/stats/schedule", validateRequest(getPackageScheduleStats), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER, SUBROLES.STAFF, SUBROLES.INTERN]), tryCatch(Controller.getPackageScheduleStats))




export default router