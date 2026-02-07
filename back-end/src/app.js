import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import healthRoutes from "./routes/health.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp({ clientOrigin, serveFrontend = false }) {
  const app = express();

  // In production single-server, you DON'T need CORS (same origin)
  // But keeping it conditional is best practice.
  if (clientOrigin) {
    app.use(
      cors({
        origin: clientOrigin,
        credentials: true
      })
    );
  }

  app.use(express.json());

  // API routes first
  app.use("/api", healthRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/rooms", roomsRoutes);

  if (serveFrontend) {
    const distPath = path.resolve(__dirname, "../../front-end/dist/");
    console.log("✅ Serving frontend from:", distPath);

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Dev fallback
    app.use((req, res) => res.status(404).json({ error: "Not found" }));
  }

  return app;
}
