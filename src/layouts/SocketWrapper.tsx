"use client";

import { useToast } from "@/components/Utility/Toast";
import { Notification } from "@/lib/dummy";
import {
  CONNECTION_ERROR,
  ERROR,
  NEW_NOTIFICATION,
  ONLINE_USERS,
  SEEN_NOTIFICATION,
} from "@/lib/events";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";

// import { useRefreshTokenMutation } from "@/redux/Apis/Users";
// import { useSocketEvents } from "@/lib/hooks";
import {
  NotificationApi,
  useGetNotificationsQuery,
} from "@/redux/Apis/Notification";
import { addOnlineUsers } from "@/redux/slices/onLineUsers";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { logger } from "@/lib/utils";


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
  const isVercel =
    typeof window !== "undefined" && window.location.hostname !== "localhost";

  const chatSocket = useMemo(() => {
    return io(`/chat`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      // Vercel does not support WebSocket upgrades via rewrites, use polling only
      transports: !isVercel ? ["polling"] : ["polling", "websocket"],
    });
  }, [isVercel]);

  const notificationSocket = useMemo(() => {
    return io(`/notification`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      // Vercel does not support WebSocket upgrades via rewrites, use polling only
      transports: !isVercel ? ["polling"] : ["polling", "websocket"],
    });
  }, [isVercel]);

  // useEffect(() => {
  //   return () => {
  //     chatSocket.disconnect();

  //   };
  // }, [chatSocket]);

  // useEffect(() => {
  //   return () => {

  //     notificationSocket.disconnect();
  //   };
  // }, [notificationSocket]);

  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const handlerNotification = useMemo(
    () => ({
      [ERROR]: (data: string) => {


        logger.log(data, "errorrrrrrrr notfication socket wraperrrr");

        showToast(data, "error");
      },
      [NEW_NOTIFICATION]: (data: Notification) => {
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
      [SEEN_NOTIFICATION]: (data: any) => {
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
        logger.log(data, "errorrrrrrrr chat socket wraperrrr");
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


  logger.count("ye cntext spocket socktext rener hua")
  const socketContextValue = useMemo(
    () => ({
      chatSocket,
      notificationSocket,
    }),
    [chatSocket, notificationSocket],
  );
  return (
    <SocketContext.Provider
      value={socketContextValue}
    >
      {children}
    </SocketContext.Provider>
  );
};
