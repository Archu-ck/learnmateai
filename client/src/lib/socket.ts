import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      (typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? window.location.origin
        : "http://localhost:5000");

    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      // Socket connected
    });

    socket.on("connect_error", (err) => {
      // Socket connect error - fallback to HTTP polling
    });
  }

  return socket;
}
