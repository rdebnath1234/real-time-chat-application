import { Server } from "socket.io";
import { registerRoomSocket } from "./room.socket.js";

export function initSockets(httpServer, { clientOrigin }) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true
    }
  });

  // Register all socket namespaces/features here
  registerRoomSocket(io);

  return io;
}
