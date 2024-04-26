import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IState } from "./interfaces";

const StateSchema = new Schema<IState>(
  {
    name: {
      type: String,
      required: true,
    },

    boundary: {
      type: [Number],
      required: true,
      default: [0.0, 0.0, 0.0, 0.0],
    },

    country: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Country",
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

StateSchema.index({
  country: 1,
  name: 1,
});

const State: Model<IState> = model<IState>("State", StateSchema);

export default State;
