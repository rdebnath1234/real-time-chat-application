import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, index: true },
    username: { type: String, required: true },
    text: { type: String, required: true, maxlength: 1000 },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
