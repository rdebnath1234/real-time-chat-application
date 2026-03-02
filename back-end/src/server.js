import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { initSockets } from "./sockets/index.js";
import { Room } from "./models/Room.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || (NODE_ENV === "production" ? null : "http://localhost:5173");
const SERVE_FRONTEND = process.env.SERVE_FRONTEND === "true";

async function bootstrap() {
  await connectDB(MONGO_URI);
  // ✅ seed default rooms once
  await Room.updateOne({ name: "general" }, { $setOnInsert: { name: "general" } }, { upsert: true });
  await Room.updateOne({ name: "tech" }, { $setOnInsert: { name: "tech" } }, { upsert: true });
  await Room.updateOne({ name: "random" }, { $setOnInsert: { name: "random" } }, { upsert: true });
  const app = createApp({
    clientOrigin: CLIENT_ORIGIN,
    serveFrontend: SERVE_FRONTEND
  });

  const server = http.createServer(app);

  initSockets(server, { clientOrigin: CLIENT_ORIGIN });

  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT} (${NODE_ENV})`);
    console.log("NODE_ENV =", process.env.NODE_ENV);
    console.log("serveFrontend =", SERVE_FRONTEND);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
