"use client";
import { useToast } from "@/components/Utility/Toast";
import {
  ERROR,
  NEW_NOTIFICATION,
  SEEN_NOTIFICATION,
  ONLINE_USERS,
} from "@/lib/events";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
import { Notification } from "@/lib/updated/dummy";
import { getSockets } from "@/lib/updated/socket";
import { logger } from "@/lib/utils";
import { chatApi } from "@/redux/Apis/Chat";
import { NotificationApi } from "@/redux/Apis/Notification";
import { addOnlineUsers } from "@/redux/slices/onLineUsers";

import { useEffect, useMemo, useState } from "react";

import { createContext, useContext, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
  chatSocket: Socket;
  notificationSocket: Socket;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }

  return context;
};

type Props = {
  children: ReactNode;
};

export const SocketProvider = ({ children }: Props) => {
  // useState initializer sirf ek baar chalta hai — useMemo ki tarah "maybe" nahi
  const [{ chatSocket, notificationSocket }] = useState(getSockets);

  const dispatch = useAppDispatch();
  useEffect(() => {
    chatSocket.connect();
    notificationSocket.connect();

    // Reconnect pe chat list dobara lao — disconnect ke time ke messages miss hue honge
    const resync = () => {
      dispatch(
        chatApi.util.invalidateTags([{ type: "chats", id: "ALL_CHATS" }]),
      );
    };
    chatSocket.io.on("reconnect", resync);

    return () => {
      chatSocket.io.off("reconnect", resync);
      chatSocket.disconnect();
      notificationSocket.disconnect();
    };
  }, [chatSocket, notificationSocket, dispatch]);

  const { showToast } = useToast();

  const handlerNotification = useMemo(
    () => ({
      [ERROR]: (data: string) => {
        showToast(data, "error");
      },
      [NEW_NOTIFICATION]: (data: Notification) => {
        showToast(data.message, "success");
        logger.log(data, "data recieved in notication");
        dispatch(
          NotificationApi.util.updateQueryData(
            "getNotifications",
            null,
            (draft) => {
              draft.data.getNotification.data.items = [
                ...draft.data.getNotification.data.items,
                data,
              ];
            },
          ),
        );
      },
      [SEEN_NOTIFICATION]: (data: number[]) => {
        dispatch(
          NotificationApi.util.updateQueryData(
            "getNotifications",
            null,
            (draft) => {
              logger.log(data, "notifcation responseeeeeeeee seen wala...");
              draft.data.getNotification.data.items =
                draft.data.getNotification.data.items.filter(
                  (seen: Notification) => data.includes(seen.notification_id),
                );
            },
          ),
        );
      },
    }),
    [showToast, dispatch],
  );
  const handler = useMemo(
    () => ({
      [ERROR]: (data: string) => {
        showToast(data, "error");
      },
      [ONLINE_USERS]: (data: string[]) => {
        logger.log("online user dataaa budddyyyy...");
        dispatch(addOnlineUsers(data));

        // return callback({
        //   message: "recved on line user...", data
        // })
      },
    }),
    [showToast, dispatch],
  );
  logger.log("triggered wrappper...");

  useEffect(() => {
    chatSocket.onAnyOutgoing((event, ...args) => {
      logger.log("ANY outgoing Event in Backend EVENT:", event, args);
    });
  }, [chatSocket]);

  useSocketEvents(chatSocket, handler);
  useSocketEvents(notificationSocket, handlerNotification);

  return (
    <SocketContext.Provider
      value={{
        chatSocket,
        notificationSocket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
  // ...baaki handlers SAME
};
