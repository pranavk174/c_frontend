"use client";

import {
  useState,
  useRef,
  useEffect,
  Suspense,
  useMemo,
  useCallback,
} from "react";

import dynamic from "next/dynamic";

import { useSelector } from "react-redux";
// import { chatApi } from "../../../../redux/Apis/User";
import {
  chatApi,
  useGetMembersQuery,
  useSendMessageMutation,
} from "@/redux/Apis/Chat";
import { RootState } from "@/redux/store";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";

import {
  Chat,
  ChatItem,
  memberProps,
  Message,
  message_reactions,
  MessageItem,
  seen_user,
  socketResponse,
  valueProps,
} from "@/lib/dummy";

import Modal from "@/components/HOComponents/Modal";
import {
  useGetAllChatsQuery,
  useGetEmojisQuery,
  useGetSingleChatQuery,
} from "@/redux/Apis/Chat";
import { current } from "@reduxjs/toolkit";
import { useSocket } from "@/layouts/SocketWrapper";
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  EDIT_MESSAGE,
  MESSAGE_REACTION,
  MESSAGE_SEEN,
  REFETCH_CHATS,
  REPLY_MESSAGE,
  SEND_MESSAGE,
  START_TYPING,
  STOP_TYPING,
} from "@/lib/events";

// import VirtualChatlist from "@/components/Chat/VirtualChatList";

import Inputbox from "@/components/Chat/Inputbox";
import DeleteMessage from "@/components/ModalChilds/DeleteMessage";
import Chathead from "@/components/Chat/Chathead";
import { useToast } from "@/components/Utility/Toast";
import { usePathname, useSearchParams } from "next/navigation";
import SpinLoader from "@/components/Utility/SpinLoader";
import {
  addMessage,
  editMessage,
  reactMessage,
  refetchChat,
  seenMessage,
  updateAllChatcache,
  updateMessage,
} from "@/lib/cacaheupdateutils";
import Loader from "@/components/Utility/Loader";
import VirtualChatlistGrouped from "@/components/Chat/VirtualChatListgrouped";

import { logger } from "@/lib/utils";
import { useUpload } from "@/lib/useUploadHook";
import { useSendMessage } from "@/lib/useSendMessage";
import { setTyping } from "@/redux/slices/ChatSlice";
import { ChatProvider, useChat } from "@/Context/ChatContext";

interface mediaProps {
  file_name: string;
  url: string;
  file_type: string;
  file_size: string;
}

const ChatPage = ({ id }: { id: number }) => {
  const [show, setShow] = useState<number | string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // const [file, setFile] = useState<File | null>(null);
  // const [progress, setProgress] = useState(0);
  // const [uploadId, setUploadId] = useState<string>("");
  // const [currentChunk, setCurrentChunk] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const pathname = useSearchParams();
  const chat_type = pathname.get("chat_type");
  const [sendMessage] = useSendMessageMutation();
  const CHUNK_SIZE = 1024 * 1024;
  // const pausedRef = useRef(false);

  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);

  const [replyMessage, setReplyMessage] = useState<MessageItem | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<valueProps>({
    open: false,
    type: null,
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const { chatSocket: socket, notificationSocket } = useSocket();

  // const messagesEndRef = useRef<HTMLDivElement>(null);
  // const [typing, setTyping] = useState<boolean>(false);
  const [menu, setMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const { typing } = useSelector((state: RootState) => state.ChatSlice);

  const { data: chatDetails } = useGetAllChatsQuery(
    {},
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {
        // logger.log(typeof id, "type of ...", id)
        return {
          data: data?.data?.getAllChats?.data?.items?.filter(
            (item: Chat) => item.chat_id === id,
          )[0],
          isLoading,
          isSuccess,
        };
      },
    },
  );

  const {
    data: messages,
    groupedMessages,
    isLoading,
    isFetching,
    nextCursor,
    hasMore,
  } = useGetSingleChatQuery(
    { chat_ids: [id], cursor, limit: 20 },
    {
      selectFromResult: ({ data, isLoading, isSuccess, isFetching }) => {
        // const res = new Map();

        const result: Record<string, Message[]> =
          data?.data?.getChatById?.data?.items.reduce(
            (acc: Record<string, Message[]>, idx: Message) => {
              const date = new Date(Number(idx.created_at));

              const today = new Date();
              const yesterday = new Date();
              yesterday.setDate(today.getDate() - 1);

              let key = "";

              if (date.toDateString() === today.toDateString()) {
                key = "Today";
              } else if (date.toDateString() === yesterday.toDateString()) {
                key = "Yesterday";
              } else {
                key = date.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
              }

              if (!acc[key]) {
                acc[key] = [];
              }

              acc[key].push(idx);

              return acc;
            },
            {} as Record<string, Message[]>,
          ) ?? [];

        // logger.log("result daataaa.", result);
        const flatData: ChatItem[] = Object.entries(result).flatMap(
          ([date, messages]) => [
            {
              kind: "header",
              id: crypto.randomUUID(),
              date,
            },
            ...messages.map((msg) => ({
              ...msg,
              kind: "message" as const,
            })),
          ],
        );

        // logger.log(flatData, "result daataaa.", result);

        const mappedMessages = new Map(
          data?.data?.getChatById?.data?.items.map((m: Message) => [m.id, m]),
        );

        return {
          data: data?.data?.getChatById?.data?.items,
          groupedMessages: flatData,
          mappedMessages,
          nextCursor: data?.data?.getChatById?.data?.nextCursor,
          hasMore: data?.data?.getChatById?.data?.hasMore,
          isLoading,
          isSuccess,
          isFetching,
        };
      },
      refetchOnMountOrArgChange: true,
    },
  );

  // const [messages, setMessages] = useState<Message[]>(data || []);

  const { emojis } = useGetEmojisQuery(
    {},
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {
        return {
          emojis: data?.data?.getEmojis?.data?.items,
          emjojiLoading: isLoading,
          emojiCallSuccess: isSuccess,
        };
      },
    },
  );

  const { members, memberIds } = useGetMembersQuery(
    { chat_id: id },
    {
      selectFromResult: ({ data, isLoading, error }) => {
        return {
          members: data?.data?.getMembers?.data?.items,
          memberIds: data?.data?.getMembers?.data?.items.map(
            (d: memberProps) => d.member_id,
          ),
          isLoading,
          error,
        };
      },
      skip: chat_type !== "group",
    },
  );

  const bottomRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          // logger.log(entries, "entriesssssssss");
          setCursor(() => nextCursor);
        }
      },
      {
        rootMargin: "500px",
        threshold: 0,
      },
    );

    if (bottomRef.current) observer.observe(bottomRef.current);

    logger.log("= data =================", messages);
    return () => observer.disconnect();
  }, [messages, nextCursor, hasMore, isFetching]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, nextCursor]);

  const handler = useMemo(
    () => ({
      [START_TYPING]: (data: boolean) => {
        setTyping(true);
      },
      [STOP_TYPING]: (data: boolean) => {
        setTyping(false);
      },
      [REFETCH_CHATS]: (data: Message[]) => {
        // logger.log(data, "chats dataaaa.... new wala...");
        if (!data) {
          return;
        }
        if (!user_id) return;
        refetchChat(dispatch, data, id, user_id, chatDetails, socket, cursor);
      },

      [MESSAGE_REACTION]: (data: message_reactions) => {
        if (!data || !user_id) {
          return;
        }
        reactMessage(dispatch, data, id);
      },
      [MESSAGE_SEEN]: (data: seen_user[]) => {
        if (!data) {
          return;
        }
        seenMessage(dispatch, id, data);
      },

      [EDIT_MESSAGE]: (data: Message) => {
        logger.log(data, "data from edit message ");
        editMessage(dispatch, id, data);
      },
    }),
    [dispatch, id, socket, user_id, chatDetails, cursor],
  );

  useSocketEvents(socket, handler);

  const selecteds = useMemo(() => {
    return {
      message: messages?.find((msg: Message) => msg.id === selectedMessages[0])
        ?.content,
      sender_id: messages?.find(
        (msg: Message) => msg.id === selectedMessages[0],
      )?.sender_id,
      id: messages?.find((msg: Message) => msg.id === selectedMessages[0])?.id,
    };
  }, [messages, selectedMessages]);

  useEffect(() => {
    if (user_id) {
      socket.emit(
        CHAT_JOINED,
        {
          chat_id: id,
          user_id,
        },
        (response: socketResponse) => {
          logger.log(response, "chat join response....");
        },
      );
    }

    return () => {
      if (user_id) {
        socket.emit(
          CHAT_LEAVED,
          { chat_id: id, user_id, socketId: socket.id },
          (response: socketResponse) => {
            logger.log(response, "chat leave response....");
          },
        );
      }
    };
  }, [user_id, socket, id]);

  const pendingSeenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!user_id || !messages?.length) return;

    // Queue me saare unseen messages add karo
    messages.forEach((msg: Message) => {
      if (msg.sender_id !== user_id && !msg.seen_users.includes(user_id)) {
        pendingSeenRef.current.add(msg.id);
      }
    });

    // Har naye message pe timer reset hoga
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const message_ids = [...pendingSeenRef.current];

      pendingSeenRef.current.clear();
      timerRef.current = null;

      if (!message_ids.length) return;

      logger.log("Sending Seen Batch:", message_ids);

      socket.emit(
        MESSAGE_SEEN,
        {
          chat_id: id,
          message_ids,
          reciever_id: chatDetails?.user_id,
        },
        (response: socketResponse) => {
          if (!response.success) return;

          dispatch(
            chatApi.util.updateQueryData(
              "getSingleChat",
              { chat_ids: [id], cursor, limit: 20 },
              (draft) => {
                draft?.data?.getChatById?.data?.items?.forEach(
                  (chat: Message) => {
                    if (
                      message_ids.includes(chat.id) &&
                      chat.sender_id !== user_id &&
                      !chat.seen_users.includes(user_id)
                    ) {
                      chat.seen_users.push(user_id);
                    }
                  },
                );
              },
            ),
          );

          dispatch(
            chatApi.util.updateQueryData("getAllChats", {}, (draft) => {
              const item = draft.data.getAllChats.data.items.find(
                (c: Chat) => c.chat_id === id,
              );

              if (item) {
                item.unread_count = Math.max(
                  0,
                  item.unread_count - message_ids.length,
                );
              }
            }),
          );
        },
      );
    }, 300); // 300ms tak koi naya message nahi aaya to batch bhej do

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [messages, user_id, id, socket, chatDetails, cursor, dispatch]);
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col justify-center items-center">
        <SpinLoader height={"100px"} width={"100px"} />
        Chats Loading...
      </div>
    );
  }

  if (!messages) {
    return (
      <div className="flex-1 h-screen flex items-center font-bold text-xl uppercase justify-center text-gray-500">
        Chat not found
      </div>
    );
  }

  return (
    <div className="flex flex-col  w-full chat-bg relative">
      {/* Header */}

      <Chathead
        menu={menu}
        members={members}
        memberIds={memberIds}
        setShowModal={setShowModal}
        selected={selecteds}
        selectedMessages={selectedMessages}
        chatDetails={chatDetails}
      />
      <ChatProvider chatDetails={chatDetails}>
        <>
          {" "}
          <Suspense
            fallback={
              <div className="h-screen w-full flex  justify-center items-center">
                <SpinLoader height={"50px"} width={"50px"} />
              </div>
            }
          >
            <VirtualChatlistGrouped
              setSelectedMessages={setSelectedMessages}
              setCursor={setCursor}
              isFetching={isFetching}
              data={groupedMessages}
              nextCursor={nextCursor}
              hasMore={hasMore}
              setMenu={setMenu}
              selectedMessages={selectedMessages}
              // pausedRef={pausedRef}
              // progress={progress}
              // uploadChunks={uploadChunks}
              // cancelUpload={cancelUpload}
              // startUpload={startUpload}
              timerRef={timerRef}
              emojis={emojis}
              chat_id={id}
              user_id={user_id}
              // setShow={setShow}
              setReplyMessage={setReplyMessage}
              // uploadId={uploadId}
              messages={messages}
              // setFile={setFile}
              // show={show}
              menu={menu}
              chatDetails={chatDetails}
            />
          </Suspense>
          {typing && (
            <div className="flex  items-center gap-1.5 px-6 py-2">
              <div
                className="flex items-center gap-1 px-3 py-2 rounded-2xl"
                style={
                  {
                    // background: "rgba(255,255,255,0.07)",
                    // border: "1px solid rgba(255,255,255,0.08)",
                  }
                }
              >
                <span className="text-xs text-slate-400  mr-1">Typing</span>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="typing-dot w-1.5 h-1.5  rounded-full bg-violet-400 inline-block"
                  />
                ))}
              </div>
            </div>
          )}
          <Inputbox
            messages={messages}
            reciever_ids={
              chat_type === "group" ? memberIds : [chatDetails?.user_id]
            }
          />
        </>
      </ChatProvider>

      <Modal values={showModal} setModal={setShowModal}>
        {showModal.type === "delete" && (
          <DeleteMessage
            setShowModal={setShowModal}
            // setSelected={setSelected}
            setSelectedMessages={setSelectedMessages}
            selectedMessages={selectedMessages}
            chat_id={id}
          />
        )}
      </Modal>
    </div>
  );
};

export default ChatPage;
