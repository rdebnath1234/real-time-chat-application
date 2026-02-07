import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useSocket(socketUrl) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(socketUrl, { transports: ["websocket"] });
    socketRef.current = socket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [socketUrl]);

  return { socketRef, isConnected };
}
