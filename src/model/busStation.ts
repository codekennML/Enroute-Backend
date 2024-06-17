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
      required: true,
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
    },
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
  name: 1,
});

const BusStation: Model<IBusStation> = model<IBusStation>(
  "BusStation",
  busStationSchema
);

export default BusStation;
