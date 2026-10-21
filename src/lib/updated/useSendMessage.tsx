import { useCallback, useMemo } from "react";
import { useSelector, useStore } from "react-redux";
import { Chat, Message, socketResponse } from "./dummy";
import { chatApi } from "@/redux/Apis/Chat";
import { useAppDispatch } from "../hooks";
import {
  addMessage,
  confirmMessage,
  createLocalIds,
  markMessageFailed,
  updateAllChatcache,
} from "./cacaheupdateutils";
import { logger } from "../utils";
import { RootState } from "@/redux/store";
import { REPLY_MESSAGE, SEND_MESSAGE } from "../events";
import { setReplyMessage } from "@/redux/slices/ChatSlice";
import { useSocket } from "@/layouts/updated/SocketWrapper";

export const ACK_TIMEOUT = 8000;

export interface mediaProps {
  file_name: string;
  url: string;
  file_type: string;
  file_size: string;
}

export interface LocalMessage {
  clientMsgId: string;
  content: string;
  replyMessage: Message | null;
}

interface useSendMessageProps {
  chatDetails: Chat;
  recieverIds: number[];
}

export const useSendMessage = ({
  chatDetails,
  recieverIds,
}: useSendMessageProps) => {
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const store = useStore<RootState>();
  const { chatSocket: socket } = useSocket();
  const dispatch = useAppDispatch();
  const chat_id = chatDetails.chat_id;

  // 1) UI mein turant dikhao (optimistic)
  const addLocalMessage = useCallback(
    (
      content: string,
      previewUrl: string | null = null,
    ): LocalMessage | null => {
      if (!user_id) return null;

      // replyMessage call ke time store se padho — selector se lete to har reply change
      // pe ye function badalta aur saare context consumers re-render hote
      const replyMessage = store.getState().ChatSlice.replyMessage;
      const { clientMsgId, tempId } = createLocalIds();

      dispatch(
        chatApi.util.updateQueryData(
          "getSingleChat",
          { chat_ids: [chat_id] },
          addMessage({
            tempId,
            clientMsgId,
            content,
            user_id,
            replyMessage,
            url: previewUrl,
          }),
        ),
      );
      dispatch(
        chatApi.util.updateQueryData(
          "getAllChats",
          {},
          updateAllChatcache(chat_id, content || "📷 Photo"),
        ),
      );

      if (replyMessage) dispatch(setReplyMessage(null));

      return { clientMsgId, content, replyMessage };
    },
    [user_id, store, dispatch, chat_id],
  );

  // 2) Server ko bhejo + ack ka wait (timeout ke saath)
  const emitMessage = useCallback(
    async (local: LocalMessage, media: mediaProps | null = null) => {
      const payload = {
        client_msg_id: local.clientMsgId,
        chat_ids: [chat_id],
        content: local.content,
        media: media ? [media] : [],
        reciever_ids: recieverIds, // group mein saare members
        message_ids: local.replyMessage ? [local.replyMessage.id] : [],
        chat_type: chatDetails.chat_type,
      };
      const event = local.replyMessage ? REPLY_MESSAGE : SEND_MESSAGE;

      try {
        // timeout ke andar ack nahi aaya to ye throw karega
        const response: socketResponse = await socket
          .timeout(ACK_TIMEOUT)
          .emitWithAck(event, payload);

        if (!response.success) throw new Error(response.message);

        dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [chat_id] },
            confirmMessage(local.clientMsgId, response.data?.message),
          ),
        );
        return true;
      } catch (error) {
        logger.error(error, "message send failed");
        dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [chat_id] },
            markMessageFailed(local.clientMsgId),
          ),
        );
        return false;
      }
    },
    [chat_id, recieverIds, chatDetails.chat_type, socket, dispatch],
  );

  const sendText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text) return false; // khaali message nahi jayega

      const local = addLocalMessage(text);
      if (!local) return false;

      return emitMessage(local);
    },
    [addLocalMessage, emitMessage],
  );

  // Failed message pe "retry" — backend idempotent hai to duplicate nahi banega
  const retryMessage = useCallback(
    (msg: Message) => {
      if (!msg.client_msg_id) return;
      return emitMessage({
        clientMsgId: msg.client_msg_id,
        content: msg.content ?? "",
        replyMessage: null,
      });
    },
    [emitMessage],
  );

  return useMemo(
    () => ({ sendText, retryMessage, addLocalMessage, emitMessage }),
    [sendText, retryMessage, addLocalMessage, emitMessage],
  );
};

import { useToast } from "@/components/Utility/Toast";
import { uploadManager } from "./uploadManager";
import { removeLocalMessage } from "./cacaheupdateutils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const useSendMediaMessage = ({
  chatDetails,
  recieverIds,
}: useSendMessageProps) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { sendText, retryMessage, addLocalMessage, emitMessage } =
    useSendMessage({
      chatDetails,
      recieverIds,
    });
  const chat_id = chatDetails.chat_id;

  // Upload background mein chalega — modal turant band kar sakte ho
  const sendMedia = useCallback(
    (file: File, caption: string) => {
      if (file.size > MAX_FILE_SIZE) {
        showToast("File Size Cant be Greater then 10MB", "error");
        return false;
      }

      const previewUrl = URL.createObjectURL(file);
      const local = addLocalMessage(caption.trim(), previewUrl);
      if (!local) {
        URL.revokeObjectURL(previewUrl);
        return false;
      }

      // ye callback component unmount hone ke baad bhi chalega (socket + dispatch global hain)
      uploadManager.start(
        local.clientMsgId,
        file,
        chat_id,
        dispatch,
        async (media) => {
          const sent = await emitMessage(local, media);
          // server ka cloudinary URL aa gaya → blob URL ki zarurat nahi, memory free karo
          if (sent) URL.revokeObjectURL(previewUrl);
          return sent;
        },
      );

      return true;
    },
    [addLocalMessage, emitMessage, chat_id, dispatch, showToast],
  );

  const pauseUpload = useCallback(
    (clientMsgId: string) => uploadManager.pause(clientMsgId, dispatch),
    [dispatch],
  );

  const resumeUpload = useCallback(
    (clientMsgId: string) => uploadManager.resume(clientMsgId, dispatch),
    [dispatch],
  );

  const cancelUpload = useCallback(
    async (clientMsgId: string) => {
      await uploadManager.cancel(clientMsgId, dispatch);
      dispatch(
        chatApi.util.updateQueryData(
          "getSingleChat",
          { chat_ids: [chat_id] },
          removeLocalMessage(clientMsgId),
        ),
      );
    },
    [chat_id, dispatch],
  );

  return useMemo(
    () => ({
      sendText,
      retryMessage,
      sendMedia,
      pauseUpload,
      resumeUpload,
      cancelUpload,
    }),
    [
      sendText,
      retryMessage,
      sendMedia,
      pauseUpload,
      resumeUpload,
      cancelUpload,
    ],
  );
};
