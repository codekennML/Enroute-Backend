import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IRating } from "./interfaces";

const ratingSchema = new Schema<IRating>(
    {
        userId : {
            type: SchemaTypes.ObjectId,
            required: true,
            ref : "User"
        },
        raterId: {
            type: SchemaTypes.ObjectId,
            required: true,
            ref: "User"
        },
        rideId: {
    type: SchemaTypes.ObjectId,
    required: true,
    ref: "Ride"
},
rating : { 
    type  : Number, 
    default : 5, 
    max : 5, 
    min : 1 ,
    required : true
}
   
    },
    {
        timestamps: true,
        versionKey: false,
    }
);


ratingSchema.index({
    userd: 1,
    raterId : 1 , 
    rideId : 1 
});

const Rating: Model<IRating> = model<IRating>(
    "Rating",
    ratingSchema
);

export default Rating;
