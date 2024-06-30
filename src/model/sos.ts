import { Schema, Model, model, SchemaTypes } from "mongoose";
import { ISOS } from "./interfaces";

const sosSchema = new Schema<ISOS>(
  {
    tripId: {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "Trip",
      index: true,
    },

    initiator: {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },

    rideId: {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "Trip",
      index: true,
    },

    lastLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required : true
      },
      coordinates: [Number]
    },
    
    town : { 
      type : String, 
      index : true
    }, 
    state : { 
       
    type: String,
    index: true
  }, 
    
    country: {
      type: String,
      index: true
    }

  },

  {
    timestamps: true,
    versionKey: false,
  }
);

sosSchema.index({
  "lastLocation.coordinates": "2dsphere",
  driverId: 1,
  tripId: 1,
  rideId: 1,
});

const SOS: Model<ISOS> = model<ISOS>("SOS", sosSchema);

export default SOS;
