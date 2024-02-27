import { Schema, Model, model, Document } from "mongoose";
import { ITrip } from "./interfaces";

export default interface ITripModel extends ITrip, Document {}

const tripSchema = new Schema<ITripModel>({
  driverId: {
    type: Schema.Types.ObjectId,
    required: [true, "Trip Driver Id required"],
    ref: "User",
    index: true,
  },

  tripLocations: {
    start: {
      coordinates: {
        type: [Number],
        required: ["true", "start Coordinates are required"],
      },
      name: {
        type: String,
      },

      placeId: String,
    },
    end: {
      coordinates: {
        type: [Number],
        required: ["true", "End coordinates are required"],
      },
      name: {
        type: String,
      },
      placeId: String,
    },
    polylines: [String],
  },

  ongoing: {
    type: Boolean,
    required: [true, "Trip status required"],
  },

  // rides: [
  //   {
  //     type: Schema.Types.ObjectId,
  //     required: true,
  //     ref: "Ride",
  //   },
  // ],
});

tripSchema.index({
  driverId: 1,
  ongoing: 1,
});

export const Trips: Model<ITripModel> = model<ITripModel>("Trip", tripSchema);
