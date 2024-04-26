import { Schema, Model, model } from "mongoose";
import { IUserPlaces } from "./interfaces/index";

const placesSchema = new Schema<IUserPlaces>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User Id is required for places entry"],
    },

    busStation: {
      type: Schema.Types.ObjectId,
      ref: "BusStation",
      required: [true, "Station Id is required for places entry"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UserPlaces: Model<IUserPlaces> = model<IUserPlaces>(
  "UserPlaces",
  placesSchema
);

export default UserPlaces;
