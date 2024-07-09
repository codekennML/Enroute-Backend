import { Schema, Model, model, Document, SchemaTypes } from "mongoose";
import { IDocuments } from "./interfaces";

export interface IDocumentsModel extends IDocuments, Document {}

const documentsSchema = new Schema<IDocumentsModel>(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    
    country : {
      type: SchemaTypes.ObjectId,
      ref: "Country",
      required: true,
    },

    name: {
      type: String,
      required : true

    },

    imageUrl: [String],
    //Picture of uploaded imaage

    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    }, //true or false

    //These fields are specifically for addresses
    verificationResponse: Object, //Result from verification api
    issued: Date,
    expiry: Date,
    status: {
      type: String,
      enum: ["pending", "assessed"],
      default: "pending",
    },

    fieldData: Object,

    isRejected: Boolean,

    rejectionFeedback: String,

    approvedBy: {
      type: SchemaTypes.ObjectId,
      ref: "User",
    },
    archived: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

documentsSchema.index({
  userId: 1,
  vehicleId: 1,
  name: 1,
});

const Documents: Model<IDocumentsModel> = model<IDocumentsModel>(
  "Documents",
  documentsSchema
);

export default Documents;
