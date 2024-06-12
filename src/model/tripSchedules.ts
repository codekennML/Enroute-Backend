import { Schema, Model, model, SchemaTypes } from "mongoose";
import { ITripSchedule } from "./interfaces";

const tripSchema = new Schema<ITripSchedule>({

    driverId: {
        type: Schema.Types.ObjectId,
        required: [true, "Trip Driver Id required"],
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
                default: "Point",
            },

            coordinates: [Number, Number],
        },
    },

    originTown: {
        type: SchemaTypes.ObjectId,
        ref: "Town",
    },

    originState: {
        type: SchemaTypes.ObjectId,
        ref: "State",
    },

    originCountry: {
        type: SchemaTypes.ObjectId,
        ref: "Country",
    },

    destination: {
        name: String,
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },

            coordinates: [Number, Number],
        },
    },

    destinationTown: {
        type: SchemaTypes.ObjectId,
        ref: "Town",
    },

    destinationState: {
        type: SchemaTypes.ObjectId,
        ref: "State",
    },

    status: {
        type: String,
        enum: ["created", "cancelled"],
    },

    vehicleId: {
        type: SchemaTypes.ObjectId,
        required: true,
    },
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
