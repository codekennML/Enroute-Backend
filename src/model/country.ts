import { Schema, Model, model } from "mongoose";
import { DocsInfo, ICountry } from "./interfaces";

// interface DocsInfo {
//   name: string,
//   displayName: string
//   options: {
//     type: "text" | "radio" | "textarea" | "image"
//     options: string[] //for select values eg ["NIN", "PASSPORT"], 
//     schemaType: string
//   }
//   value: string
// }

export const DocsSchema = new Schema<DocsInfo>({
  name: String,
  displayName: String,
  options: {
    type: {
      type: String,
      enum: ["text", "radio", "textarea", "image"]
    },
    options: [String],
    schemaType: String,
    required: {
      type: Boolean,
      default: true
    }
  },
  value: String //This is the actual field value, the ret are schemas
})

// Main schema with dynamic fields in serviceRequiredDocs
export const serviceRequiredSchema = new Schema({
  serviceRequiredDocs: {
    type: Map,
    of: [DocsSchema],  // Each key in the map will hold an array of requiredDocsSchema
  },
})

const CountrySchema = new Schema<ICountry>(
  {
    name: {
      type: String,
      required: true,
      index: 1
    },

    isoCode: {
      type: String,
      required: true,
      index: 1

    },

    code: { //Calling code
      type: String,
      required: true,
      index: 1
    },

    boundary: {
      type: [
        {
          lat: Number,
          lng: Number

        }
      ],
      default: [{ lat: 0, lng: 0 }]
    },


    currency: {
      type: String,
      required: true
    },

    paymentProcessorbillingPercentage: {
      type: Number,
      default: 0,
    },
    paymentProcessorbillingExtraAmount: {
      type: Number,
      default: 0,
    },

    driverPercentage: {
      type: Number,
      required: true,
      default: 0
    },

    riderCommission: {
      type: Number,
      required: true,
      default: 0
    },


    requiredDriverDocs: [
      DocsSchema
    ],

    requiredRiderDocs: [DocsSchema],

    serviceRequiredDocs: serviceRequiredSchema,

    vehicleRequiredDocs: serviceRequiredSchema

  },

  {
    timestamps: true,
    versionKey: false,
  }
);

CountrySchema.index({
  code: 1,
  currency: 1
});

const Country: Model<ICountry> = model<ICountry>(
  "Country",
  CountrySchema
);

export default Country;
