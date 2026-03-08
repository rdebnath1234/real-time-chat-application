import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: String,
    username: String,
    text: String,
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
