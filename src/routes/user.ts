import { UserController } from "../controllers/userController";

import express from "express";
import { tryCatch } from "../middlewares/errors/tryCatch";

const userRouter = express.Router();

userRouter.get("/get_all_users", tryCatch(UserController.getUserBasicInfo));

export default userRouter;
