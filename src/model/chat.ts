import { Schema, Model, model, Document, SchemaTypes } from "mongoose";
import { IChat } from "./interfaces";

export interface ChatModel extends IChat, Document {}

const ChatSchema = new Schema<ChatModel>(
  {
    latestMessage: {
      type: SchemaTypes.ObjectId,
      ref: "Message",
    },

    status: {
      type: String,
      enum: ["completed", "ongoing"],
      required: true,
    },

    tripId: {
      type: SchemaTypes.ObjectId,
      ref: "Trip",
    },

    rideId: {
      type: SchemaTypes.ObjectId,
      ref: "Ride",
    },

    users: [
      {
        type: SchemaTypes.ObjectId,
        required: true,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ChatSchema.index({
  tripId: 1,
  rideId: 1,
  status: 1,
});

const Chat: Model<ChatModel> = model<ChatModel>("Chat", ChatSchema);

export default Chat;
