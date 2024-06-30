import express from "express" 

import { verifyPermissions } from "../middlewares/auth/permissionGuard"
import { ROLES, SUBROLES, excludeEnum } from "../config/enums"
import validateRequest from "../middlewares/validation/base"
import { Country as Controller } from "../controllers/countryController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import AuthGuard from "../middlewares/auth/verifyTokens"
import { countrySchema, deleteCountriesSchema, getCountriesByIdSchema, getCountriesSchema, updateCountrySchema } from "./schemas/country"

const acceptableRoles =  excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER])
const acceptableSubRoles  =  Object.values(SUBROLES)



const router =  express.Router() 

router.use(AuthGuard)

router.post("/create",  validateRequest(countrySchema) , verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.createCountry) ) 
 


router.get("/", validateRequest(getCountriesSchema), verifyPermissions(acceptableRoles,  acceptableSubRoles) , tryCatch(Controller.getCountries) )

router.get("/:id", validateRequest(getCountriesByIdSchema),  verifyPermissions(acceptableRoles,  acceptableSubRoles), tryCatch(Controller.getCountryById)) 
 

router.patch('/update', validateRequest(updateCountrySchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.updateCountry)) 

router.delete("/delete",  validateRequest(deleteCountriesSchema),  verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), tryCatch(Controller.deleteCountries))


export default router