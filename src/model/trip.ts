import { Schema, Model, model, SchemaTypes } from "mongoose";
import { ITrip } from "./interfaces";

const tripSchema = new Schema<ITrip>({
  driverId: {
    type: Schema.Types.ObjectId,
    required: [true, "Trip Driver Id required"],
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
        default: "Point",
      },

      coordinates: [Number, Number],
    },
  },

  initialStatus: {
    type: String,
    enum: ["none", "scheduled"],
    required: true,
    default: "none"
  },

  originTown: {
    type: SchemaTypes.ObjectId,
    ref: "Town",
  },

  originState: {
    type: SchemaTypes.ObjectId,
    ref: "State",
  },

  originCountry: {
    type: SchemaTypes.ObjectId,
    ref: "Country",
  },

  distance : { 
    type : Number, 
    default : 0
  } ,

  destination: {
    name: String,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: [Number, Number],
    },
  },

  destinationTown: {
    type: SchemaTypes.ObjectId,
    ref: "Town",
  },

  destinationState: {
    type: SchemaTypes.ObjectId,
    ref: "State",
  },

  status: {
    type: String,
    enum: ["scheduled", "cancelled", "ongoing", "completed", "crashed"],
  },

  vehicleId: {
    type: SchemaTypes.ObjectId,
    required: true,
  },
});

tripSchema.index({
  driverId: 1,
  status: 1,
});

const Trips: Model<ITrip> = model<ITrip>("Trip", tripSchema);

export default Trips;
