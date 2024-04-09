import mongoose from "mongoose";

const subscritionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //me
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // cac
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = new mongoose.model(
  "Subscription",
  subscritionSchema
);
