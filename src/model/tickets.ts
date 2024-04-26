import { Schema, Model, model, SchemaTypes } from "mongoose";
import { ITickets } from "./interfaces";

const TicketsSchema = new Schema<ITickets>(
  {
    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    userId: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "User",
    },

    email: {
      type: String,
      required: true,
    },
    documentsUrl: [
      {
        url: String,
        type: String,
        format: String,
        name: String,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

TicketsSchema.index({
  parentCategory: 1,
  subCategory: 1,
  title: 1,
});

const Tickets: Model<ITickets> = model<ITickets>("Tickets", TicketsSchema);

export default Tickets;
