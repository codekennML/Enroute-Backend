
import express from "express"
const router = express.Router()

import {OtpController} from "../controllers/otpController"
import { tryCatch } from "../middlewares/errors/tryCatch"
import validateRequest from "../middlewares/validation/base"

import {
    createOTPSchema,
    verifyOTPSchema, 
    updateOTPSchema
} from "./schemas/otp"


//RIDERS
router.post("/create_otp", validateRequest(createOTPSchema), tryCatch(OtpController.createOTP))

router.post("/verify_otp",
    validateRequest(verifyOTPSchema),
    tryCatch(OtpController.verifyOTP))

router.post("/update_otp", validateRequest(updateOTPSchema),  tryCatch(OtpController.updateOTP))

export default router

