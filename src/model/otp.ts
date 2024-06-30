import { Schema, Model, model,  } from "mongoose";
import { IOtp } from "./interfaces";


const otpSchema = new Schema<IOtp>(
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
    
    mobile : Number , 

    countryCode : Number,

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

otpSchema.index({ 
  expiry : 1 , 
  active : 1 , 
  user : 1,

})


otpSchema.set("toJSON", { getters : true, virtuals : true})

export const Otp: Model<IOtp> = model<IOtp>("Otp", otpSchema);
