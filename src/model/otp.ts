import { Schema, Model, model, Document } from "mongoose";
import { IOtp } from "./interfaces";

export default interface IOtpModel extends IOtp, Document {}

const otpSchema = new Schema<IOtpModel>({
  user: {
    type: Schema.Types.ObjectId,
    required: [true, "Hash User is required"],
    ref: "User",
    index: true,
  },
  type: {
    type: String,
    enum: ["signup", "login", "tripVerify"],
    required: true,
    index: true,
  },

  expiry: {
    type: Date,
    required: true,
    index: true,
  },

  hash: {
    type: String,
    required: true,
    index: true,
  },

  active: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export const Otp: Model<IOtpModel> = model<IOtpModel>("Otp", otpSchema);
