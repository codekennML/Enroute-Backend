import { Schema, Model, model, Document, SchemaTypes } from "mongoose";
import { ITown } from "./interfaces";
import { DocsSchema } from "./country";

export interface TownModel extends ITown, Document { }

const TownSchema = new Schema<TownModel>(
  {
    name: {
      type: String,
      required: true,

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

    requiredDriverDocs: [DocsSchema],
    requiredRiderDocs: [DocsSchema]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

TownSchema.index({
  country: 1,
  name: 1,
  state: 1,
});

const Town: Model<TownModel> = model<TownModel>("Town", TownSchema);

export default Town;
