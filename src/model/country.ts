import { Schema, Model, model} from "mongoose";
import { ICountry } from "./interfaces";



const CountrySchema = new Schema<ICountry>(
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
    requiredDriverDocs:  [
        {
          name : String, 
          options : [ String ]
        }
      ],
    requiredRiderDocs: [
      {
        name: String,
        options: [String]
      }
    ],


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

const Country: Model<ICountry> = model<ICountry>(
  "Country",
  CountrySchema
);

export default Country;
