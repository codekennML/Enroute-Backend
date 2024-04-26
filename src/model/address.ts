import { Schema, Model, model, Document, SchemaTypes } from "mongoose";
import { IAddress } from "./interfaces";

export interface IAddressModel extends IAddress, Document {}

const addressSchema = new Schema<IAddressModel>(
  {
    name: {
      type: String,
      required: true,
    },
    town: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    documents: {
      type: SchemaTypes.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

const Address: Model<IAddressModel> = model<IAddressModel>(
  "Address",
  addressSchema
);

export default Address;
