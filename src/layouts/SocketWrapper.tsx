"use client";

import { createContext, useMemo, useContext, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

// Context ka type define karo
type SocketContextType = Socket | null;

const SocketContext = createContext<SocketContextType>(null);

// custom hook (recommended naming: useSocket)
const useSocket = (): Socket => {
  const socket = useContext(SocketContext);

  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return socket;
};

type SocketProviderProps = {
  children: ReactNode;
};

const SocketProvider = ({ children }: SocketProviderProps) => {
  const socket = useMemo<Socket>(() => {
    return io(`http://localhost:${process.env.NEXT_PUBLIC_PORT}`, {
      withCredentials: true,
    });
  }, []);

  // console.log(socket, "socket data//////");

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
