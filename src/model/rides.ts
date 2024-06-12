import { Schema, model, Model, SchemaTypes } from "mongoose";
import { IRide } from "./interfaces";

const rideSchema = new Schema<IRide>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    tripId: {
      type: Schema.Types.ObjectId,
      required: false,
    },

    riderId: {
      type: Schema.Types.ObjectId,
      required: [
        function () {
          return !this.packageRequestId;
        },
        "riderId is required to create new ride",
      ],
      ref: "User",
    },

    packageRequestId: {
      type: Schema.Types.ObjectId,
      required: [
        function () {
          return !this.riderId;
        },
        "packagerequestId is required to create new ride",
      ],
      ref: "PackageRequest",
    },

    distance: {
      type: Number,
      required: true,
      default: 0
    },

    type: {
      type: String,
      enum: ["package", "solo", "share"],
      default: "solo",
      required: true,
    },

    pickupTime: {
      type: Date,
      required: false,
    },

    pickedUp: Boolean,


    packageCategory: {
      type: "String",
      enum: [ "STS",  "HTH"],
  
    },

    origin: {
      name: String,
      location: {
        type: {
          String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: [Number],
      },
    },

    pickupStation: {
      type: SchemaTypes.ObjectId,
      required: true,
    },

    dropOffLocation: {
      name: String,
      location: {
        type: {
          String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: [Number],
      },
      state: String,
      town: String,
      country: String,
      placeId: String,
    },

    destination: {
      type: SchemaTypes.ObjectId,
      required: true,
    },

    dropOffTime: {
      type: Date,
      required: false,
    },

    route: {
      type: SchemaTypes.ObjectId,
      required: false,
    },

    cancellationData: {
      status: {
        type: Boolean,
        required: true,
        default: false,
      },
      initiatedBy: {
        type: Schema.Types.ObjectId,
        required: [
          true,
          "Cancellation  initiator is required to create new ride",
        ],
        ref: "User",
      },
      time: Date,
      initiator: Schema.Types.ObjectId,
      cancellationReason: String,
      driverDistanceFromPickup: {
        type: Number,
        required: true,
        default: 0,
      },
      driverEstimatedETA: {
        type: Number,
        required: true,
        default: 0,
      },
    },

    driverCommission: {
      type: Number,
      default: 0,
      required: true,
    },

    riderCommission: {
      type: Number,
      default: 0,
      required: true,
    },

    totalCommission: {
      type: Number,
      default: 0,
      required: true,
    },

    commissionPaid: {
      type: Boolean,
      required: true,
      default: false,
    },

    acceptedFare: {
      type: Number,
      default: 0,
      required: true,
    },

    seatsOccupied: {
      type: Number,
      required: true,
      default: 1,
    },

    rideTotalDistance: {
      type: Number,
      default: 0,
      required: false,
    },

    settlement: {
      identifier: SchemaTypes.ObjectId,
      amount: {
        type: Number,
        required: false,
        default: 0,
      },
    },
    initialStatus: {
      type: String,
      required: true,
      enum: ["none", "scheduled"],
      default: "none",
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "cancelled",
        "ongoing",
        "completed",
        "crashed",
        "abandoned",
      ],
    },

    packageDetails: {
      recipient: {
        firstname: String,
        lastname: String,
        countryCode: String,
        mobile: String,
      },
      description: String,
      comments: String,
    },

     friendData : [ 
  {
         firstname: String,
         lastname: String,
         countryCode: String,
         mobile: String,
       },
     ]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rideSchema.index({
  status: 1,
  tripId: 1,
  riderId: 1,
  packageRequestId: 1,
  "settlement.identifier": 1,
  type: 1,
  category: 1,
  initialStatus: 1,
  pickupTown: 1,
  pickupState: 1,
  pickupCountry: 1,
  dropOffTown: 1,
  dropOffState: 1,
});

export const Ride: Model<IRide> = model<IRide>("Ride", rideSchema);
