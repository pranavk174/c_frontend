"use client";

import { useToast } from "@/components/Utility/Toast";
import {
  CONNECTION_ERROR,
  ERROR,
  ONLINE_USERS,
  REFETCH_CHATS,
} from "@/lib/events";
import { useRefreshTokenMutation } from "@/redux/Apis/Users";
import { useSocketEvents } from "@/lib/hooks";

import {
  createContext,
  useMemo,
  useContext,
  ReactNode,
  useEffect,
  useState,
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
  const [refreshToken] = useRefreshTokenMutation();
  const socket = useMemo<Socket>(() => {
    return io(`${process.env.NEXT_PUBLIC_BASE_URL}`, {
      withCredentials: true,
      // reconnection: true,
      // reconnectionAttempts: 5,
      // reconnectionDelay: 1000,
    });
  }, []);

  const [socketId, setSocketId] = useState(null)

  // const socket = io(`${process.env.NEXT_PUBLIC_BASE_URL}`, {
  //   withCredentials: true,
  //   // reconnection: true,
  //   // reconnectionAttempts: 5,
  //   // reconnectionDelay: 1000,
  // });

  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const handler = useMemo(
    () => ({
      [ERROR]: (data: string) => {
        showToast(data, "error");
      },
      [ONLINE_USERS]: (data: string[]) => {
        console.log("online user dataaa budddyyyy...");
        dispatch(addOnlineUsers(data));
      },
    }),
    [showToast, dispatch],
  );

  useEffect(() => {
    let isRefreshing = false;

    socket.on(CONNECTION_ERROR, async (err) => {
      if (err.message === "Unauthorized" && !isRefreshing) {
        isRefreshing = true;

        try {
          // await refreshTokenApi();
          await refreshToken(null).unwrap();

          socket.connect();
        } catch (e) {
          // logout user
        }
        isRefreshing = false;

      }
    });

    return () => {
      socket.off("connect_error");
    };
  }, [socket, refreshToken]);

  // useEffect(() => {

  //   socket.on("connect", () => {
  //     console.log("FRONTEND:", socket.id);
  //   });

  //   console.log(socket.id, "use effect")

  //   return () => { socket.disconnect() }

  // }, [socket]);

  useSocketEvents(socket, handler);

  // console.log(socket, "socket data//////");

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
