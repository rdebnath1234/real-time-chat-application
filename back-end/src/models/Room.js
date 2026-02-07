import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,        // ✅ global uniqueness
      trim: true,
      lowercase: true,
      maxlength: 30
    }
  },
  { timestamps: true, versionKey: false }
);

export const Room = mongoose.model("Room", roomSchema);
