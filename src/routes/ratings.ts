import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { Rating as Controller } from "../controllers/ratingController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { deleteRatingsSchema, getRatingByIdSchema, getRatingsSchema, ratingSchema } from "./schemas/rating"

const acceptableRoles =  excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER])
const acceptableSubRoles  =  Object.values(SUBROLES)


const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(
    ratingSchema) , verifyPermissions(Object.values(ROLES), [SUBROLES.MANAGER, SUBROLES.STAFF]), tryCatch(Controller.createRating
) ) 
 
router.get("/", validateRequest(getRatingsSchema), verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)) , tryCatch(Controller.getRatings) )

router.get("/:id", validateRequest(getRatingByIdSchema),  verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)), tryCatch(Controller.getRatingById)) 
 

router.patch('/update', validateRequest(ratingSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.updateRating
)) 

router.delete("/delete",  validateRequest(deleteRatingsSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteRatings))


export default router