import { Schema, Model, model, Document, SchemaTypes } from "mongoose";
import { INotification } from "./interfaces";

export interface NotificationModel extends INotification, Document {}

const NotificationSchema = new Schema<NotificationModel>(
  {
    type: String,

    recipient: {
      type: SchemaTypes.ObjectId,
      required: false,
    },
    initiator: {
      type: SchemaTypes.ObjectId,
      required: false,
    },

    body: {
      type: String,
      required: true,
    },
    read: {
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

const Notification: Model<NotificationModel> = model<NotificationModel>(
  "Notification",
  NotificationSchema
);

export default Notification;
