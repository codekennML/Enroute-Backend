import { Schema, Model, model, Document, SchemaTypes } from "mongoose";
import { IMessage } from "./interfaces";

export interface MessageModel extends IMessage, Document {}

const MessageSchema = new Schema<MessageModel>(
  {
    chatId: {
      type: SchemaTypes.ObjectId,
      ref: "Chat",
    },

    sentBy: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "User",
    },

    deliveredAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Message: Model<MessageModel> = model<MessageModel>(
  "Message",
  MessageSchema
);

export default Message;
