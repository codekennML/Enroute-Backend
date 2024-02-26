import { Schema, model, Model, Document, Types } from "mongoose";
import { IAccess } from "./interfaces";

export default interface IUserAccessModel extends IAccess, Document {}

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

  // active :  {
  //     type : Boolean,
  //     default : true,
  //     required : true
  // },

  // blacklisted : {
  //     type : Boolean,
  //     required : true ,
  //     default : false
  // }
});

export const UserAccessLogs: Model<IUserAccessModel> = model<IUserAccessModel>(
  "UserAccessLog",
  accessTokenSchema
);
