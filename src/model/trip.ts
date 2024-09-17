import { Schema, Model, model } from "mongoose";
import { ITrip } from "./interfaces";

const tripSchema = new Schema<ITrip>({
  driverId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
    index: true,
  },

  seatAllocationsForTrip: {
    type: Number,
    required: true,
    default: 0,
  },

  origin: {
    name: String,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },

      coordinates: [Number],
    },
    town: String,
    state: String,
    country: String,

  },

  initialStatus: {
    type: String,
    enum: ["none", "scheduled"],
    required: true,
    default: "none"
  },

  distance: {
    type: Number,
    default: 0
  },

  destination: {
    name: String,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },

      coordinates: [Number],
    },
    town: String,
    state: {
      type: String,
      index: true
    },
    country: {
      type: String,
      index: true
    }
  },



  status: {
    type: String,
    enum: ["scheduled", "cancelled", "ongoing", "completed", "crashed"],
  },


}, {
  timestamps: true,
  versionKey: false
});

tripSchema.index({
  driverId: 1,
  status: 1,

});

const Trips: Model<ITrip> = model<ITrip>("Trip", tripSchema);

export default Trips;
