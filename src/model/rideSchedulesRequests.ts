import { Schema, Model, model } from "mongoose";
import { IRideSchedule } from "./interfaces/index.js";

const rideRequestSchema = new Schema<IRideSchedule>(
    {
        rideRequest: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: "RideRequest",
            index: true,
        },

        tripId : { 
            type: Schema.Types.ObjectId,
            required: false,
            ref: "Trip",
            index: true,
        },

        driverId: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: "User",
            index: true,
        },

        riderId: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: "User",
            index: true,
        },

        driverEmail: String,

        riderEmail: String,

       
        driverBudget: {
            type: Number,
            default: 0,
            required: true,
        }, 

        driverPushId : String, 

        riderPushId : String,

    
        riderAccepted: {
            type : Boolean, 
            default : false, 
            required : true
        },

        status: {
            type: String,
            required: true,
            enum: ["created", "cancelled", "closed"],
        },
    },

    {
        timestamps: true,
        versionKey: false,
    }
);

rideRequestSchema.index({
    status: 1,
    riderId: 1,
    driverId: 1,
    riderDecision: 1,
    driverDecision: 1,
    "destination.placeId": 1,
    type: 1,
});

export const RideRequest: Model<RideRequestModel> = model<RideRequestModel>(
    "RideRequest",
    rideRequestSchema
);
