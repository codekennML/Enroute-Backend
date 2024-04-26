import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IPackageScheduleRequest } from "./interfaces";

const packageScheduleRequestSchema = new Schema<IPackageScheduleRequest>(
  {
    createdBy: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    budget: {
      type: Number,
      required: true,
      default: 1000,
    },

    body: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["accepted", "rejected", "pending"],
      default: "pending",
    },

    town: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Town",
    },

    state: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "State",
    },

    country: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Country",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

packageScheduleRequestSchema.index({
  town: 1,
  state: 1,
  createdBy: 1,
  country: 1,
  status: 1,
  budget: 1,
});

const PackageScheduleRequest: Model<IPackageScheduleRequest> =
  model<IPackageScheduleRequest>(
    "packageScheduleRequest",
    packageScheduleRequestSchema
  );

export default PackageScheduleRequest;
