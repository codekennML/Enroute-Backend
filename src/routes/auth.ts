import express from "express";
import { authController } from "../controllers/authController";
import assignRoleOnSignup from "../middlewares/auth/assignRole";
import validateRequest from "../middlewares/validation/base";
import { changeAuthDataSchema, checkDuplicateSchema, checkLoginUpdateSchema, handleDuplicateAccountSchema, logoutSchema, signInEmailSchema, signInGoogleSchema, signInMobileSchema, verifyAccountViaMobileSchema, verifyUserEmailSchema } from "./schemas/auth";
import { tryCatch } from "../middlewares/errors/tryCatch";
import AuthGuard from "../middlewares/auth/verifyTokens";

const authRouter = express.Router();

authRouter.post(
  "/mobile",
  assignRoleOnSignup,
  validateRequest(signInMobileSchema),
  tryCatch(authController.signInMobile)
);

authRouter.post(
  "/email",
  assignRoleOnSignup,
  validateRequest(signInEmailSchema),
  tryCatch( authController.signInEmail)
);

authRouter.post(
  "/email/verify",
  assignRoleOnSignup,
  validateRequest(verifyUserEmailSchema),
  tryCatch(authController.verifyUserEmail)
);


authRouter.post(
  "/verify_duplicate/account_roles",
  assignRoleOnSignup,
  validateRequest(checkDuplicateSchema),
  tryCatch(authController.checkDuplicateAccountOfAnotherRole)
);

authRouter.post(
  "/authenticate_duplicate",
  assignRoleOnSignup,
  validateRequest(handleDuplicateAccountSchema),
  tryCatch(authController.handleDuplicateRolesAccount)
);

authRouter.post(
  "/authenticate_with_mobile",
  assignRoleOnSignup,
  validateRequest(verifyAccountViaMobileSchema),
  tryCatch(authController.verifyAccountViaMobile)
);

authRouter.post("/login/google", assignRoleOnSignup,
  validateRequest(signInGoogleSchema), tryCatch(authController.signInGoogle));

authRouter.post("/login/facebook");


authRouter.post("/verify_duplicate_auth_data", AuthGuard, validateRequest(checkLoginUpdateSchema),  tryCatch(authController.handleUserCanUpdateLoginData));

authRouter.patch("/update_user/email", AuthGuard, validateRequest(changeAuthDataSchema),  tryCatch(authController.changeUserEmailWithinAccount));

authRouter.patch("/update_user/mobile", AuthGuard, validateRequest(changeAuthDataSchema), tryCatch(authController.changeUserMobileWithinAccount));

authRouter.post("/logout", AuthGuard, tryCatch(authController.logout));

authRouter.post("/revoke/tokens",AuthGuard, tryCatch(authController.revokeTokens))

export default authRouter;
