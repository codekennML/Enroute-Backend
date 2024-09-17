import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IState } from "./interfaces";
import { DocsSchema, serviceRequiredSchema } from "./country";

const StateSchema = new Schema<IState>(
  {
    name: {
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
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: [Number],
    },

    country: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Country",
    },
    requiredDriverDocs: [DocsSchema],
    requiredRiderDocs: [DocsSchema],
    serviceRequiredDocs: serviceRequiredSchema,
    vehicleRequiredDocs: serviceRequiredSchema

  },

  {
    timestamps: true,
    versionKey: false,
  }
);

StateSchema.index({
  "location.coordinates": "2dsphere",
});

StateSchema.index({
  country: 1,

});

const State: Model<IState> = model<IState>("State", StateSchema);

export default State;
