import { Schema, Model, model, Document } from "mongoose";
import { IRoute } from "./interfaces/index.js";

export default interface RouteModel extends IRoute, Document {}

const routeSchema = new Schema<RouteModel>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Trip",
      index: true,
    },

    rideId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Ride",
      index: true,
    },

    vehicleId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Vehicle",
      index: true,
    },

    geojson: [
      {
        type: {
          type: String,
          enum: ["Point"],
         required : true
        },
        coordinates: [Number],
      },
    ],

    timestamps: [Date],

    lineString: String,
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

export const Route: Model<RouteModel> = model<RouteModel>("Route", routeSchema);
