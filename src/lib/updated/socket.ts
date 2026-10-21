import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import { logger } from "../utils";

// Vercel pe WebSocket upgrade nahi hota → env se polling-only on karo.
// Custom server (Render/VPS) pe websocket allow karo.
const pollingOnly = process.env.NEXT_PUBLIC_SOCKET_POLLING_ONLY === "true";

const options: Partial<ManagerOptions & SocketOptions> = {
  withCredentials: true,
  autoConnect: false, // connect hum khud karenge (auth ke baad)
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000, // exponential backoff 1s → 10s
  transports: pollingOnly ? ["polling"] : ["polling", "websocket"],
};

let chatSocket: Socket | null = null;
let notificationSocket: Socket | null = null;

// Pure app mein ek hi instance — re-render / StrictMode se naya socket nahi banega
export const getSockets = () => {
  if (!chatSocket) chatSocket = io("/chat", options);
  if (!notificationSocket) notificationSocket = io("/notification", options);
  return { chatSocket, notificationSocket };
};

export const disconnectSockets = () => {
  chatSocket?.disconnect();
  notificationSocket?.disconnect();
  chatSocket = null;
  notificationSocket = null;
};


export const socketcallBack =(response:socketResponse)=>{
  logger.debug(response)
}