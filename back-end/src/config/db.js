import mongoose from "mongoose";

export async function connectDB(mongoUri) {
  if (!mongoUri) throw new Error("MONGO_URI is missing");

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    autoIndex: true
  });

  console.log("✅ MongoDB connected");
}
