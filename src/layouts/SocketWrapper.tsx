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
// import {
//   createContext,
//   useMemo,
//   useContext,
//   ReactNode,
//   useEffect,
//   useState,
// } from "react";
// import { io, Socket } from "socket.io-client";
// import { useAppDispatch } from "@/lib/hooks";
// import { addOnlineUsers } from "@/redux/slices/onLineUsers";
// // Context ka type define karo
// type SocketContextType = Socket | null;

// const SocketContext = createContext<SocketContextType>(null);

// // custom hook (recommended naming: useSocket)
// const useSocket = (): Socket => {
//   const socket = useContext(SocketContext);

//   if (!socket) {
//     throw new Error("useSocket must be used within a SocketProvider");
//   }

//   return socket;
// };

// type SocketProviderProps = {
//   children: ReactNode;
// };

// const SocketProvider = ({ children }: SocketProviderProps) => {
//   const [refreshToken] = useRefreshTokenMutation();
//   const socket = useMemo<Socket>(() => {
//     return io(`${process.env.NEXT_PUBLIC_BASE_URL}`, {
//       withCredentials: true,
//       // reconnection: true,
//       // reconnectionAttempts: 5,
//       // reconnectionDelay: 1000,
//     });
//   }, []);

//   const { data } = useGetNotificationsQuery(null)
//   const [socketId, setSocketId] = useState(null)

//   // const socket = io(`${process.env.NEXT_PUBLIC_BASE_URL}`, {
//   //   withCredentials: true,
//   //   // reconnection: true,
//   //   // reconnectionAttempts: 5,
//   //   // reconnectionDelay: 1000,
//   // });

//   const { showToast } = useToast();
//   const dispatch = useAppDispatch();
//   const handler = useMemo(
//     () => ({
//       [ERROR]: (data: string) => {
//         showToast(data, "error");
//       },
//       [ONLINE_USERS]: (data: string[]) => {
//         console.log("online user dataaa budddyyyy...");
//         dispatch(addOnlineUsers(data));

//         // return callback({
//         //   message: "recved on line user...", data
//         // })
//       },
//       [NEW_NOTIFICATION]: (data: any) => {
//         console.log(data, "data recieved in notication")
//         dispatch(NotificationApi.util.updateQueryData(
//           'getNotifications', null, (draft) => {

//             draft.data.getNotification.data.items = [...draft.data.getNotification.data.items, data]
//           }
//         ))
//       }
//       , [SEEN_NOTIFICATION]: (data: any) => {
//         dispatch(NotificationApi.util.updateQueryData(
//           'getNotifications', null, (draft) => {

//             console.log(data, "notifcation responseeeeeeeee seen wala...")
//             draft.data.getNotification.data.items = draft.data.getNotification.data.items.filter((seen: Notification) => data.includes(seen.notification_id))
//           }
//         ))

//       }
//     }),
//     [showToast, dispatch],
//   );

//   console.log("socket wrapperrrrr")
//   useEffect(() => {
//     let isRefreshing = false;

//     socket.on(CONNECTION_ERROR, async (err) => {
//       if (err.message === "Unauthorized" && !isRefreshing) {
//         isRefreshing = true;

//         try {
//           // await refreshTokenApi();
//           await refreshToken(null).unwrap();

//           socket.connect();
//         } catch (e) {
//           // logout user
//         }
//         isRefreshing = false;

//       }
//     });

//     return () => {
//       socket.off("connect_error");
//     };
//   }, [socket, refreshToken]);

//   useSocketEvents(socket, handler);

//   // console.log(socket, "socket data//////");

//   return (
//     <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
//   );
// };

// export { SocketProvider, useSocket };

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
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
  const chatSocket = useMemo(() => {
    return io(`/chat`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
    })
  }, []);

  const notificationSocket = useMemo(() => {
    return io(`/notification`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
    })
  }, []);

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
        showToast(data, "error");
      },

      [NEW_NOTIFICATION]: (data: Notification) => {
        console.log(data, "data recieved in notication");
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
              console.log(data, "notifcation responseeeeeeeee seen wala...");
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
        console.log("online user dataaa budddyyyy...");
        dispatch(addOnlineUsers(data));

        // return callback({
        //   message: "recved on line user...", data
        // })
      },
    }),
    [showToast, dispatch],
  );
  console.log("triggered wrappper...");

  useEffect(() => {
    chatSocket.onAnyOutgoing((event, ...args) => {
      console.log("ANY outgoing Event in Backend EVENT:", event, args);
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
};
