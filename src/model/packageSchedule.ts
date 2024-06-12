import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IPackageSchedule } from "./interfaces";

const packageScheduleSchema = new Schema<IPackageSchedule>(
  {
    createdBy: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "User",
    },

    type: {
      type: String,
      enum: ["HTH", "STS"],
      required: true,
    },

    budget: {
      type: Number,
      required: true,
      default: 1000,
    },

    status: {
      type: String,
      enum: ["filled", "expired", "created"],
      default: "created",
      required: true,
    },

    destinationAddress: {
      name: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
          default: "Point",
        },
        coordinates: [Number, Number],
      },
      placeId: String,
    },

    pickupAddress: {
      name: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
          default: "Point",
        },
        coordinates: [Number, Number],
      },
      placeId: String,
    },

    packageDetails: Object,

    expiresAt: Date,

    dueAt: Date,

    destinationTown: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Town",
    },

    destinationState: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "State",
    },

    pickupCountry: {
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

packageScheduleSchema.index({
  "pickupPoint.coordinates": "2dsphere",
});

packageScheduleSchema.index({
  town: 1,
  state: 1,
  createdBy: 1,
  country: 1,
});

const PackageSchedule: Model<IPackageSchedule> = model<IPackageSchedule>(
  "packageSchedule",
  packageScheduleSchema
);

export default PackageSchedule;
