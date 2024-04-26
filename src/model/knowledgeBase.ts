import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IKnowledgeBase } from "./interfaces";

const knowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    parentCategory: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "knowledgeBaseCategory",
    },

    subCategory: {
      type: SchemaTypes.ObjectId,
      required: false,
      ref: "knowledgeBaseCategory",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

knowledgeBaseSchema.index({
  parentCategory: 1,
  subCategory: 1,
  title: 1,
});

const KnowledgeBase: Model<IKnowledgeBase> = model<IKnowledgeBase>(
  "knowledgeBase",
  knowledgeBaseSchema
);

export default KnowledgeBase;
