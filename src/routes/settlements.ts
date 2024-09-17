import express from "express"

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { Settlement as Controller } from "../controllers/settlementsController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"

import { deleteSettlementsSchema, getSettlementAdmin, getSettlementStatsSchema, getSettlementsforDriverSchema, getSingleSettlementSchema, intializeSettlementPaymentSchema, updateSettlementSchema, webhookSchema } from "./schemas/settlement"


const router = express.Router()

router.use(AuthGuard)

router.post("/initialize", validateRequest(intializeSettlementPaymentSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER]), [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.initializeSettlementPayments))

router.get("/callback/flutterwave",

    validateRequest(webhookSchema),

    tryCatch(Controller.settlementsWebhookHandler))

router.get("/", validateRequest(getSettlementAdmin), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER, ROLES.DRIVER])), tryCatch(Controller.getSettlementsAdmin))

router.get("/:id", validateRequest(getSingleSettlementSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER])), tryCatch(Controller.getSingleSettlement))

router.get("/driver", validateRequest(getSettlementsforDriverSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER])), tryCatch(Controller.getSingleSettlement))

router.patch('/update', validateRequest(updateSettlementSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.updateSettlement))

router.get("/stats/calculate", validateRequest(getSettlementStatsSchema), verifyPermissions(excludeEnum(ROLES, [ROLES.RIDER, ROLES.DRIVER])), tryCatch(Controller.getSettlementsStats))

router.delete("/delete", validateRequest(deleteSettlementsSchema), verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteSettlements))


export default router