import { UserController } from "../controllers/userController";

import express from "express";
import { tryCatch } from "../middlewares/errors/tryCatch";
import validateRequest from "../middlewares/validation/base";
import { createUserSchema, getUserBasicInfo, getUsersSchema, getUsersStatsSchema, limitUserAccount, markUserVerifiedSchema, updateUserPeripheralDataSchema } from "./schemas/user";
import AuthGuard from "../middlewares/auth/verifyTokens";
import { verifyPermissions } from "../middlewares/auth/permissionGuard";
import { ROLES, SUBROLES, excludeEnum } from "../config/enums";

const userRouter = express.Router();

userRouter.use(AuthGuard)

userRouter.get("/", verifyPermissions(excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER])), validateRequest(getUsersSchema),  tryCatch(UserController.getUsers))

userRouter.post("/create", 
    verifyPermissions([ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.MANAGER]), 
    validateRequest(createUserSchema), 
    tryCatch(UserController.createUser))

userRouter.get("/:id", verifyPermissions(Object.values(ROLES), Object.values(SUBROLES)), validateRequest(getUserBasicInfo), tryCatch(UserController.getUserBasicInfo))

userRouter.post("/limit", verifyPermissions(excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER]), [SUBROLES.MANAGER, SUBROLES.STAFF]), validateRequest(limitUserAccount), tryCatch(UserController.createUser))

userRouter.patch("/verify", verifyPermissions([ROLES.CX, ROLES.ACCOUNT, ROLES.ADMIN, ROLES.SUPERADMIN], [SUBROLES.STAFF, SUBROLES.MANAGER]) ,validateRequest(markUserVerifiedSchema), tryCatch(UserController.markUserAsVerified))

userRouter.patch("/update", verifyPermissions(Object.values(ROLES), [SUBROLES.MANAGER, SUBROLES.STAFF]), validateRequest(updateUserPeripheralDataSchema), tryCatch(UserController.updateUserPeripheralData))

userRouter.get("/stats/calculate",
    verifyPermissions(excludeEnum(ROLES, [ROLES.DRIVER, ROLES.RIDER])),
    validateRequest(getUsersStatsSchema),
    tryCatch(UserController.getUserStats) )


export default userRouter;
