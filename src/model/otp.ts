import { Schema, Model, model, Document } from "mongoose";
import { IOtp } from "./interfaces";

export default interface IOtpModel extends IOtp, Document {}

const otpSchema = new Schema<IOtpModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    email: {
      type: String,
      index: true,
    },

    channel: {
      type: String,
      enum: ["whatsapp", "sms", "email"],
      required: true,
      default: "sms",
    },

    expiry: {
      type: Date,
      index: true,
    },

    hash: {
      type: String,
      index: true,
    },

    next: String,

    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    versionKey: false,
  }
);

export const Otp: Model<IOtpModel> = model<IOtpModel>("Otp", otpSchema);
