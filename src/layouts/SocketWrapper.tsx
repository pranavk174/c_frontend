"use client";

import { useToast } from "@/components/Utility/Toast";
import { ERROR, ONLINE_USERS, REFETCH_CHATS } from "@/lib/events";
import { useSocketEvents } from "@/lib/hooks";
import {
  createContext,
  useMemo,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppDispatch } from "@/lib/hooks";
import { addOnlineUsers } from "@/redux/slices/onLineUsers";
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
  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const handler = useMemo(
    () => ({
      [ERROR]: (data: string) => {
        showToast(data, "error");
      },
      [ONLINE_USERS]: (data: string[]) => {
        console.log("online user dataaa budddyyyy...")
        dispatch(addOnlineUsers(data));
      },
    }),
    [showToast, dispatch],
  );

  // useEffect(() => {
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, [socket]);

  useSocketEvents(socket, handler);

  // console.log(socket, "socket data//////");

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
