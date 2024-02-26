import { Schema, model, Model, Document } from "mongoose";
import { IRide } from "./interfaces";

export default interface IRideModel extends IRide, Document {
  //Specify the methods her
  hashPassword(password: string): string;
}

const rideSchema = new Schema<IRideModel>(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      required: [true, "riderId is required to create new ride"],
      ref: "User",
    },

    pickupTime: {
      type: Date,
      required: false,
    },

    droppedOffLocation: {
      type: String,
      required: true,
      default: false,
    },

    alighted: {
      type: Boolean,
      required: true,
      default: false,
    },

    dropOffTime: {
      type: Date,

      required: false,
    },

    cancelled: {
      status: {
        type: Boolean,
        required: true,
        default: false,
      },
      initiatedBy: {
        type: Schema.Types.ObjectId,
        required: [
          true,
          "Cancellation  initiator is required to create new ride",
        ],
        ref: "User",
      },
      time: Date,
    },

    rideData: {
      destination: {
        placeId: String,
        coordinates: {
          type: [Number],
          required: true,
        },
      },
      start_location: {
        placeId: String,
        coordinates: {
          type: [Number],
          required: true,
        },
      },
      polyline: {
        type: String,
        required: true,
      },
      lineString: {
        type: String,
        required: true,
      },
      rideTotalDistance: {
        type: Number,
        default: 0,
      },
    },

    ride_fare_estimate: [Number],

    accepted_fare: {
      type: Number,
      default: 0,
      required: false,
    },
    ongoing: {
      type: Boolean,
      required: [true, "Trip status is required"],
      default: false,
    },
    completed: {
      type: Boolean,
      default: false,
    },

    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tripId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Ride: Model<IRideModel> = model<IRideModel>("Ride", rideSchema);
