import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IKnowledgeBaseCategory } from "./interfaces";

const knowledgeBaseCategorySchema = new Schema<IKnowledgeBaseCategory>(
  {
    name: {
      type: String,
      required: true,
    },

    isParent: {
      type: Boolean,
      required: true,
      default: false,
    },

    parentId: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "knowledgeBaseCategory",
    },

    country : String
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

knowledgeBaseCategorySchema.index({
  name: 1,
  parentId: 1,

  country : 1

});

knowledgeBaseCategorySchema.virtual("parentData",{ 
  ref : "knowledgeBaseCategory",
  foreignField : "_id", 
  localField : "parentId",  
} )

const KnowledgeBaseCategory: Model<IKnowledgeBaseCategory> =
  model<IKnowledgeBaseCategory>(
    "knowledgeBaseCategory",
    knowledgeBaseCategorySchema
  );

export default KnowledgeBaseCategory;
