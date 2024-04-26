import express from "express";
import { authController } from "../controllers/authController";
import assignRoleOnSignup from "../middlewares/auth/assignRole";

const authRouter = express.Router();

authRouter.post(
  "/login/mobile",
  assignRoleOnSignup,
  authController.signInUserMobile
);

authRouter.post(
  "/login/email",
  assignRoleOnSignup,
  authController.signInUserEmail
);

authRouter.patch("/update_user/email");

authRouter.patch("/update_user/mobile");

authRouter.post("/login/google");

authRouter.post("/login/facebook");

authRouter.post("/logout");

export default authRouter;
