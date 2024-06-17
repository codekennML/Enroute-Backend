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
      enum: ["accepted", "rejected", "created",  "cancelled"],
      default: "created",
    },


  },
  {
    timestamps: true,
    versionKey: false,
  }
);

packageScheduleRequestSchema.index({

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
