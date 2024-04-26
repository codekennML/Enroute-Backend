import { Schema, Model, model, Document } from "mongoose";
import { ICountry } from "./interfaces";

export interface CountryModel extends ICountry, Document {}

const CountrySchema = new Schema<CountryModel>(
  {
    name: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    boundary: {
      type: [Number],
      required: true,
      default: [0.0, 0.0, 0.0, 0.0],
    },
    requiredDocs: {
      type: [String],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CountrySchema.index({
  code: 1,
  name: 1,
});

const Country: Model<CountryModel> = model<CountryModel>(
  "Country",
  CountrySchema
);

export default Country;
