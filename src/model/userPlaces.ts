import { Schema, Model, model, Document } from "mongoose";
import { IPlaces } from "./interfaces/index";

export default interface IPlacesModel extends IPlaces, Document {}

const placesSchema = new Schema<IPlacesModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User Id is required for places entry"],
    },

    placeId: {
      type: String,
      required: false,
    },

    coordinates: [Number],

    name: {
      type: String,
      required: [true, "Place Name is required"],
    },

    label: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Places: Model<IPlacesModel> = model<IPlacesModel>("Place", placesSchema);
