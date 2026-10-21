"use client";
import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useSocket } from "@/layouts/updated/SocketWrapper";
const TYPING_EXPIRE_MS = 5000;
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
import { RootState } from "@/redux/store";
import {
  EDIT_MESSAGE,
  MESSAGE_REACTION,
  MESSAGE_SEEN,
  REFETCH_CHATS,
  START_TYPING,
  STOP_TYPING,
} from "@/lib/events";
import { setTyping } from "@/redux/slices/updated/ChatSlice";
import {
  refetchChat,
  reactMessage,
  seenMessage,
  editMessage,
} from "@/lib/cacaheupdateutils";
import { Message, message_reactions, seen_user } from "@/lib/updated/dummy";
type TypingPayload = { chat_id?: number } | undefined;

export const useChatSocketSync = (chatId: number) => {
  const { chatSocket: socket } = useSocket();
  const dispatch = useAppDispatch();
  const userId = useSelector((state: RootState) => state.userSlice.id);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlers = useMemo(() => {
    const clearTypingTimer = () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    return {
      [START_TYPING]: (data: TypingPayload) => {
        const id = data?.chat_id ?? chatId;
        dispatch(setTyping({ chatId: id, typing: true }));
        // STOP_TYPING miss ho jaye (network drop) to bhi 5s mein hata do
        clearTypingTimer();
        typingTimeoutRef.current = setTimeout(
          () => dispatch(setTyping({ chatId: id, typing: false })),
          TYPING_EXPIRE_MS,
        );
      },
      [STOP_TYPING]: (data: TypingPayload) => {
        clearTypingTimer();
        dispatch(setTyping({ chatId: data?.chat_id ?? chatId, typing: false }));
      },
      [REFETCH_CHATS]: (data: Message[]) => {
        if (data?.length) refetchChat(dispatch, data, chatId);
      },
      [MESSAGE_REACTION]: (data: message_reactions) => {
        if (data && userId) reactMessage(dispatch, data, chatId);
      },
      [MESSAGE_SEEN]: (data: seen_user[]) => {
        if (data) seenMessage(dispatch, chatId, data);
      },
      [EDIT_MESSAGE]: (data: Message) => {
        editMessage(dispatch, chatId, data);
      },
    };
  }, [dispatch, chatId, userId]);

  useSocketEvents(socket, handlers);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);
};
