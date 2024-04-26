import { Schema, Model, model, SchemaTypes, Document } from "mongoose";
import { IVehicle } from "./interfaces";

export interface IVehicleModel extends IVehicle, Document {}

const vehicleSchema = new Schema<IVehicleModel>(
  {
    driverId: {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },

    vehicleMake: {
      type: String,
      required: true,
    },

    vehicleModel: {
      type: String,
      required: true,
    },

    year: {
      type: Number,
      default: 2000,
      required: true,
    },
    isVerified: { type: Boolean, required: true, default: false },
    insurance: {
      type: SchemaTypes.ObjectId,
      ref: "Documents",
    },

    inspection: {
      type: SchemaTypes.ObjectId,
      ref: "Documents",
    },

    hasAC: {
      type: Boolean,
      default: false,
      required: true,
    },

    isArchived: {
      type: Boolean,
      required: true,
      default: false,
    },

    status: {
      type: String,
      enum: ["assessed", "pending"],
      required: true,
      default: "pending",
    },
    town: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    approvedBy: {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

vehicleSchema.index({
  isArchived: 1,
  licensePlate: 1,
  driverId: 1,
});

export const Vehicle: Model<IVehicleModel> = model<IVehicleModel>(
  "Vehicle",
  vehicleSchema
);

export default Vehicle;
