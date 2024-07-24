import { Schema, Model, model, SchemaTypes} from "mongoose";
import { IVehicle } from "./interfaces";



const vehicleSchema = new Schema<IVehicle>(
  {
    driverId: {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },

    vehicleMake: {
      type: String,
      required: true,
    },

    vehicleModel: {
      type: String,
      required: true,
    },

    images : [ 
      { 
        type : String, 
          
      }
    ],

    year: {
      type: Number,
      default: 2000,
      required: true,
    },

    licensePlate: {
      type: String,
      required: true
    },

    inspection: {
      provider: String,
      issueDate: Date,
     expiryDate: Date,
      image: {
        front: String,
        back: String
      }
    },
    insurance: {
      provider: String,
      issueDate: Date,
      expiryDate: Date,
      image: {
        front: String,
        back: String
      }
    },

    country  : {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "Country",
      index: true,
    } ,

    state : {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "State",
      index: true,
    },

    hasAC: {
      type: Boolean,
      default: false,
      required: true,
    },

    isArchived: {
      type: Boolean,
      required: true,
      default: false,
    },

    status: {
      type: String,
      enum: ["assessed", "pending"],
      required: true,
      default: "pending",
    },
   

    approvedBy: {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

vehicleSchema.index({
  isArchived: 1,
  licensePlate: 1,
  isVerified : 1, 
  driverId: 1,
  "insurance.expiryDate" : 1, 
  "inspection.expiryDate" : 1,
});

export const Vehicle: Model<IVehicle> = model<IVehicle>(
  "Vehicle",
  vehicleSchema
);

export default Vehicle;
