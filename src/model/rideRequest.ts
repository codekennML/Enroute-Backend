import { Schema, Model, model, Document, SchemaTypes } from "mongoose";
import { IRideRequest } from "./interfaces/index.js";

export default interface RideRequestModel extends IRideRequest, Document {}

const rideRequestSchema = new Schema<RideRequestModel>(
  {
 
    riderId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },

    riderBudget: {
      type: Number,
      default: 0,
      required: true,
    },

    destination: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "BusStation",
    },

    pickupPoint: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "BusStation",
    },

    hasLoad: Boolean,

    numberOfSeats: Number,

    type : { 
      type: String,
      required: true,
      enum: ["share", "solo"],
      default: "share",
    },
    
    status: {
      type: String,
      required: true,
      enum: ["created", "cancelled", "closed"],
    },
    driverBudget : Number,
  
    friendData : [ 
      { 
        firstname : String, 
        lastName : String, 
        countryCode : String , 
        mobile : Number
      }
    ]
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

rideRequestSchema.index({
  status: 1,
  riderId: 1,
  type : 1,
  destination : 1 , 
  pickupPoint : 1
  
});

export const RideRequest: Model<RideRequestModel> = model<RideRequestModel>(
  "RideRequest",
  rideRequestSchema
);
