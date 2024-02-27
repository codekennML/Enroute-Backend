import { Schema, Model, model, Document } from "mongoose";
import { IRoute } from "./interfaces/index.js";

export default interface IRouteModel extends IRoute, Document {}

const routeSchema = new Schema<IRouteModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    userType: {
      type: String,
      required: true,
      enum: ["driver", "rider"],
      default: "driver",
    },

    tripId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Trip",
      index : true
    },

    availableSeats: Number,

    rideId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Ride",
      index : true
    },

    carId: {},

    coordinates: [Number],

    createdAt: Date.now(),
  },

  {
    versionKey: false,
  }
);

export const Route: Model<IRouteModel> = model<IRouteModel>(
  "Route",
  routeSchema
);
