import { Schema, model, Model, Document, Types } from "mongoose";
import { IUserAccess } from "./interfaces";

export default interface IUserAccessModel extends IUserAccess, Document {}

const accessTokenSchema = new Schema({
  user: {
    type: Types.ObjectId,
    index: true,
    ref: "User",
  },

  devices: {
    type: Map,
    of: {
      blacklisted: Boolean,
      lastLoginAt: Date,
      susAttempts: Number,
    },
  },

  ipAddresses: {
    type: Map,
    of: {
      blacklisted: Boolean,
      lastLoginAt: Date,
      susAttempts: Number,
    },
  },

});

export const UserAccessLogs: Model<IUserAccessModel> = model<IUserAccessModel>(
  "UserAccessLog",
  accessTokenSchema
);
