import mongoose, { Model, Schema, model, Document } from "mongoose";
import { ITransaction } from "./interfaces";

export interface ITransactionModel extends ITransaction, Document {}

const transactionSchema = new Schema<ITransactionModel>(
  {
    type: {
      type: String,
      required: true,
      enum: ["deposit", "booking", "payout", "commission", "tip", "tripRefund"],
    },

    receiver: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },

    creator: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    approved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },

    systemApproved: Boolean,

    status: {
      type: String,
      enum: ["failed", "processing", "success"],
      default: "processing",
    },

    userTransferRef: String,

    paymentRef: String,

    class: {
      type: String,
      enum: ["promo", "credit", "debit"],
      required: true,
    },

    fraudulent: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({
  type: 1,
  creator: 1,
  receiver: 1,
  createdAt: -1,
  paymentRef: 1,
});

const Transaction: Model<ITransactionModel> = model<ITransactionModel>(
  "Transaction",
  transactionSchema
);

export default Transaction;
