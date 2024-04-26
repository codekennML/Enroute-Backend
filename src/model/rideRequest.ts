import { Schema, Model, model, Document, SchemaTypes } from "mongoose";
import { IRideRequest } from "./interfaces/index.js";

export default interface RideRequestModel extends IRideRequest, Document {}

const rideRequestSchema = new Schema<RideRequestModel>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Trip",
      index: true,
    },

    riderId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },

    driverId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },

    driverEmail: String,
    riderEmail: String,

    driverDecision: {
      type: String,
      required: true,
      enum: ["accepted", "pending", "rejected", "negotiated"],
    },

    riderBudget: {
      type: Number,
      default: 0,
      required: true,
    },

    driverBudget: {
      type: Number,
      default: 0,
      required: true,
    },

    destination: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "BusStation",
    },

    pickupPoint: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "BusStation",
    },

    hasLoad: Boolean,

    numberOfSeats: Number,

    type: {
      type: String,
      required: true,
      enum: ["package", "selfride", "thirdParty"],
      default: "package",
    },

    riderDecision: {
      type: String,

      required: false,
      enum: ["accepted", "pending", "rejected"], //the driver renegotiated the price and the rider has to make a decison
    },

    status: {
      type: String,
      required: true,
      enum: ["created", "cancelled", "closed"],
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

rideRequestSchema.index({
  status: 1,
  riderId: 1,
  driverId: 1,
  riderDecision: 1,
  driverDecision: 1,
  "destination.placeId": 1,
  type: 1,
});

export const RideRequest: Model<RideRequestModel> = model<RideRequestModel>(
  "RideRequest",
  rideRequestSchema
);
