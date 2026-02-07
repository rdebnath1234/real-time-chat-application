import "dotenv/config";
import http from "http";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { initSockets } from "./sockets/index.js";
import { Room } from "./models/Room.js";

const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URI = process.env.MONGO_URI;


const CLIENT_ORIGIN =
  NODE_ENV === "production" ? null : (process.env.CLIENT_ORIGIN || "http://localhost:5173");

async function bootstrap() {
  await connectDB(MONGO_URI);
  // ✅ seed default rooms once
  await Room.updateOne({ name: "general" }, { $setOnInsert: { name: "general" } }, { upsert: true });
  await Room.updateOne({ name: "tech" }, { $setOnInsert: { name: "tech" } }, { upsert: true });
  await Room.updateOne({ name: "random" }, { $setOnInsert: { name: "random" } }, { upsert: true });
  const app = createApp({
    clientOrigin: CLIENT_ORIGIN,
    serveFrontend: NODE_ENV === "production"
  });

  const server = http.createServer(app);

  initSockets(server, { clientOrigin: CLIENT_ORIGIN });

  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT} (${NODE_ENV})`);
    console.log("NODE_ENV =", process.env.NODE_ENV);
    console.log("serveFrontend =", NODE_ENV === "production");
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
