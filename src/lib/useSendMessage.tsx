import { FormEvent, RefObject, useCallback, useRef } from "react";
import { Chat, MessageItem, socketResponse } from "./dummy";
import { useUpload } from "./useUploadHook";
import { useToast } from "@/components/Utility/Toast";
import { chatApi } from "@/redux/Apis/Chat";
import { useAppDispatch } from "./hooks";
import {
  addMessage,
  updateAllChatcache,
  updateMessage,
} from "./cacaheupdateutils";
import { logger } from "./utils";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { REPLY_MESSAGE, SEND_MESSAGE } from "./events";
import { setReplyMessage } from "@/redux/slices/ChatSlice";
import { Socket } from "socket.io-client";
import { useSocket } from "@/layouts/SocketWrapper";

interface mediaProps {
  file_name: string;
  url: string;
  file_type: string;
  file_size: string;
}
interface uploadHookProps {
  //   inputRef: RefObject<HTMLInputElement | null>;
  //   user_id: number | null;
  //   //   replyMessage: MessageItem | null;
  //   id: number;
  chatDetails: Chat;
  //   handleSendMessage: (e: mediaProps | FormEvent<Element>) => Promise<void>;
}

export interface sendMessageProps {
  //   inputRef: RefObject<HTMLInputElement | null>;
  id: number;
  //   chat_type: string | null;
  //   memberIds: number[];
  chatDetails: Chat;
  //   scrollToBottom: () => void;
}

export const useSendMessage = ({
  //   inputRef,
  id,

  chatDetails,
  //   scrollToBottom,
}: sendMessageProps) => {
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const { replyMessage } = useSelector((state: RootState) => state.ChatSlice);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { chatSocket: socket } = useSocket();

  const dispatch = useAppDispatch();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  const handleSendMessage = async (e: React.FormEvent | mediaProps) => {
    const input = inputRef.current;

    if (!socket || !input) {
      logger.debug(
        socket,
        input,
        "logger in handkesend message",
        inputRef.current,
      );
      return;
    }

    // const content = input.value.trim();

    // if (!content && "preventDefault" in e) return;

    if ("preventDefault" in e) {
      logger.log("gotr issueeee");
      e.preventDefault();
    } else if (!e.url || !socket) {
      return;
    }

    // logger.log(chatDetails, "input text rfwaaaal");
    const newMessage = {
      chat_ids: [id],
      content: input.value,
      media: "preventDefault" in e ? [] : [e],
      reciever_ids: [chatDetails.user_id],
      message_ids: [replyMessage?.id],
      chat_type: chatDetails.chat_type,
    };

    let patchResult = null;
    let chatPatchResult = null;
    if ("preventDefault" in e) {
      patchResult = dispatch(
        chatApi.util.updateQueryData(
          "getSingleChat",
          { chat_ids: [id] },
          addMessage(input.value, user_id ?? 2, replyMessage),
        ),
      );
      chatPatchResult = dispatch(
        chatApi.util.updateQueryData(
          "getAllChats",
          {},
          updateAllChatcache(id, input.value),
        ),
      );
    }

    try {
      if (replyMessage !== null) {
        socket.emit(REPLY_MESSAGE, newMessage, (response: socketResponse) => {
          // agar backend fail
          if (!response.success) {
            // rollback
            patchResult?.undo();
            chatPatchResult?.undo();
            logger.log(response, "callback response");
          }

          if (response.data) {
            dispatch(
              chatApi.util.updateQueryData(
                "getSingleChat",
                { chat_ids: [id] },
                updateMessage(response?.data?.message?.id),
              ),
            );
          } else {
            logger.log(
              response,
              "callback response outside",
              "data" in response,
            );
          }
          logger.log(response?.data?.message?.id, "mesage id ...");
        });
        logger.log("messege repliy sent...");

        // await replyToMessage(newMessage).unwrap();
        dispatch(setReplyMessage(null));
      } else {
        socket.emit(SEND_MESSAGE, newMessage, (response: socketResponse) => {
          // agar backend fail
          if (!response.success) {
            // rollback
            patchResult?.undo();
            chatPatchResult?.undo();
            logger.log(response, "callback response");
          }
          if (response.data) {
            dispatch(
              chatApi.util.updateQueryData(
                "getSingleChat",
                { chat_ids: [id] },
                updateMessage(response?.data?.message?.id),
              ),
            );
          }
          logger.log(response, "callback response outside");
        });
        logger.log("messege sent...");
        // await sendMessage(newMessage).unwrap();
      }

      scrollToBottom();
    } catch (error) {
      // showToast("error some thin went wrong", "error")

      logger.log(error, "error in sending message");
    }

    // setMessages([...messages, newMessage]);
    //   setInputText("");
    // inputRef.current = null
    if (input) input.value = "";
    // inputRef.current = null
    // }
  };

  return { handleSendMessage, inputRef, scrollToBottom };
};

export const useSendMediaMessage = ({ chatDetails }: uploadHookProps) => {
  const { replyMessage } = useSelector((state: RootState) => state.ChatSlice);
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const {
    file,
    setFile,
    uploadChunks,
    startUpload,
    cancelUpload,
    pausedRef,
    currentChunk,
    uploadId,
    progress,
  } = useUpload({
    user_id: chatDetails?.user_id,
    replyMessage,
    id: chatDetails?.chat_id,
  });
  const dispatch = useAppDispatch();

  const { handleSendMessage, scrollToBottom, inputRef } = useSendMessage({
    id: chatDetails?.chat_id,
    chatDetails,
  });

  const { showToast } = useToast();

  const sendMedia = async () => {
    let pathResult;
    try {
      if (!file || !chatDetails?.user_id || currentChunk > 0) {
        logger.debug("data is bklank", file, currentChunk, chatDetails);
        showToast("data file is blank", "warning");
        return;
      }

      const url = URL.createObjectURL(file);
      if (inputRef.current) {
        pathResult = dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [chatDetails?.chat_id] },
            addMessage(inputRef.current.value, user_id ?? 0, replyMessage, url),
          ),
        );
      }

      const media = await startUpload();
      logger.debug(media, "media dataaaa");
      if (media) {
        await handleSendMessage(media);
        return true;
      } else {
        return false;
      }
      //   return media;
    } catch (error) {
      pathResult?.undo();
      logger.debug(error);
      showToast("Failed to send Send Media File", "error");
      return false;
    }
  };

  const continueUpload = async (id: string) => {
    try {
      const media = await uploadChunks(id);
      if (media) await handleSendMessage(media);
    } catch (error) {}
  };

  return {
    file,
    setFile,
    // uploadChunks,
    // startUpload,
    chatDetails,
    uploadId,
    cancelUpload,
    continueUpload,
    sendMedia,
    pausedRef,
    handleSendMessage,
    progress,
    scrollToBottom,
    inputRef,
  };
};
