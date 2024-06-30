import { Schema, Model, model, SchemaTypes } from "mongoose";
import { ISettlements } from "./interfaces";

const settlementsSchema = new Schema<ISettlements>(
  {
    amount: {
      type: Number,
      required: true,
    },

    driverId: {
      type: SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },

    processor: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "created", "failed"],
      default: "created",
    },

    rides: [{ type: SchemaTypes.ObjectId }],

    data: Object,

    isPaymentInit: {
      type: Boolean,
      required: true
    },
    refunded : {
      type : Boolean,  
      required : true,  
      default : false,
    }
    
    workerCreated : { 
      type : Boolean , 
      required : true, 
      index : true, 
      default : false 
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

settlementsSchema.index({
  processor: 1,
  driverId: 1,
  status: 1,
  workerCreated : 1
});

const Settlement: Model<ISettlements> = model<ISettlements>(
  "Settlement",
  settlementsSchema
);

export default Settlement;
