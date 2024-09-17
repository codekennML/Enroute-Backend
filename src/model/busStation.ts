import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IBusStation } from "./interfaces";

const busStationSchema = new Schema<IBusStation>(
  {
    name: {
      type: String,
      required: true,
    },

    placeId: {
      type: String,
      required: false,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: [Number],
    },
    town: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Town",
    },
    state: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "State",
    },

    country: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Country",
      index: 1
    },

    status: {
      type: String,
      enum: ['active', 'suggested', 'rejected'],
      required: true,
      default: "active",
      index: 1,
    },

    suggestedBy: {
      type: SchemaTypes.ObjectId,
      ref: "User"
    },

    approvedBy: {
      type: SchemaTypes.ObjectId,
      ref: "User"
    },

    isPopular: {
      type: Boolean,
      index: 1
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

busStationSchema.index({
  "location.coordinates": "2dsphere",
});

busStationSchema.index({
  placeId: 1,
  town: 1,
  state: 1,
  country: 1,
  name: 1,
});

const BusStation: Model<IBusStation> = model<IBusStation>(
  "BusStation",
  busStationSchema
);

export default BusStation;
