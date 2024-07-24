import { Schema, Model, model, SchemaTypes } from "mongoose";
import { ITripSchedule } from "./interfaces";

const tripSchema = new Schema<ITripSchedule>({

    driverId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
        index: true,
    },

    seatAllocationsForTrip: {
        type: Number,
        required: true,
        default: 0,
    },

    origin: {
        name: String,
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true
            },

            coordinates: [Number, Number],
        },
        town : String,
        State : String,
        country : String, 
        
    },


    destination: {
        name: String,
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true
            },

            coordinates: [Number, Number],
        },
        town : String,
        State : String,
        country : String, 
    },

  
    status: {
        type: String,
        enum: ["created", "cancelled"],
    },

    // vehicleId: {
    //     type: SchemaTypes.ObjectId,
    //     required: true,
    // },
});

tripSchema.index({
    driverId: 1,
    status: 1,
    originTown : 1 ,
    originState :1 ,
    originCountry : 1
});

const TripSchedule: Model<ITripSchedule> = model<ITripSchedule>("TripSchedule", tripSchema);

export default TripSchedule;
