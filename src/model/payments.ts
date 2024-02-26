import { Schema, Model, model, Document } from "mongoose";
import { IPay } from "./interfaces";

export interface IPayModel extends IPay, Document {}

const paymentSchema = new Schema<IPayModel>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    data: {
      reference: String,
      authorization: String,
    },

    amountSettled: {
      type: Number,
      default: 0,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "NGN",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "success",
        "failed",
        "created",
        "unapproved",
        "queued",
        "abandoned",
      ],
      required: true,
    },

    processed: {
      type: Boolean,
      required: true,
      default: false,
    },

    approved: {
      type: Boolean,
    },

    approvedBy: {
      type: Boolean,
      required: function () {
        return this.approved ? true : false;
      },
    },

    autoRetries: {
      type: Number,
      default: 0,
    },

    manualRetries: {
      type: Number,
      default: 0,
      max: 3,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Pay: Model<IPayModel> = model<IPayModel>("Payment", paymentSchema);

export default Pay;
