import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: String,
    sender: String,
    text: String,
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
