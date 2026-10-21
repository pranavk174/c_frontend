import { useEffect, useEffectEvent } from "react";
import { useSocket } from "@/layouts/updated/SocketWrapper";
import { CHAT_JOINED, CHAT_LEAVED } from "../events";
import { logger } from "../utils";
import { socketResponse } from "./dummy";
import { socketcallBack } from "./socket";

interface useChatRoomProps {
  chatId: number;
  userId: number | null;
  onReconnect: () => void;
}

export const useChatRoom = ({
  chatId,
  userId,
  onReconnect,
}: useChatRoomProps) => {
  const { chatSocket: socket } = useSocket();

  // useEffectEvent: hamesha latest onReconnect use karega, effect dobara nahi chalega
  const handleReconnect = useEffectEvent(() => onReconnect());

  useEffect(() => {
    if (!userId) return;

    const join = () =>
      socket.emit(
        CHAT_JOINED,
        { chat_id: chatId, user_id: userId },
        socketcallBack,
      );
    const reconnectHandler = () => handleReconnect();

    if (socket.connected) join();
    socket.on("connect", join); // har connect (reconnect bhi) pe room dobara join
    socket.io.on("reconnect", reconnectHandler);

    return () => {
      socket.off("connect", join);
      socket.io.off("reconnect", reconnectHandler);
      socket.emit(CHAT_LEAVED, {
        chat_id: chatId,
        user_id: userId,
        socketId: socket.id,
      },socketcallBack);
    };
  }, [chatId, userId, socket]);
};
