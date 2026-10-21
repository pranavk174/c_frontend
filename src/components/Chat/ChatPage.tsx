"use client";
import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetMembersQuery } from "@/redux/Apis/Chat";
import { RootState } from "@/redux/store";
import { ChatMetaProvider } from "@/Context/ChatMetaContext";
import { ChatActionProvider } from "@/Context/ChatActionContext";

import {
  Chat,
  ChatItem,
  memberProps,
  Message,
  socketResponse,
  valueProps,
} from "@/lib/dummy";
import Modal from "@/components/HOComponents/Modal";
import { useGetAllChatsQuery, useGetSingleChatQuery } from "@/redux/Apis/Chat";
import { useSocket } from "@/layouts/SocketWrapper";
import { CHAT_JOINED, CHAT_LEAVED } from "@/lib/events";
import Inputbox from "@/components/Chat/Inputbox";
import DeleteMessage from "@/components/ModalChilds/DeleteMessage";
import Chathead from "@/components/Chat/Chathead";
import SpinLoader from "@/components/Utility/SpinLoader";
import VirtualChatlistGrouped from "@/components/Chat/VirtualChatListgrouped";
import { logger } from "@/lib/utils";

import { ChatProvider } from "@/Context/ChatContext";
import { useSearchParams } from "next/navigation";
import { useChatRoom } from "@/lib/updated/useChatRoom";
import { resetChatUi } from "@/redux/slices/updated/ChatSlice";
import { useAppDispatch } from "@/lib/hooks";

const ChatPage = ({ id }: { id: number }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = useSearchParams();
  const chat_type = pathname.get("chat_type");

  const [cursor, setCursor] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<valueProps>({
    open: false,
    type: null,
  });

  const { chatSocket: socket } = useSocket();
  const [menu, setMenu] = useState(false);
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const { typing, selectedMessages } = useSelector(
    (state: RootState) => state.ChatSlice,
  );

  const { data: chatDetails, isLoading: isChatLoading } = useGetAllChatsQuery(
    {},
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {
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
    refetch,
  } = useGetSingleChatQuery(
    { chat_ids: [id], cursor, limit: 20 },
    {
      selectFromResult: ({ data, isLoading, isSuccess, isFetching }) => {
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

  const recieverIds = useMemo(
    () =>
      chat_type === "group"
        ? memberIds
        : chatDetails
          ? [chatDetails.user_id]
          : [],
    [chat_type, memberIds, chatDetails],
  );
  useChatRoom({
    chatId: id,
    userId: user_id,
    onReconnect: () => {
      // cursor null = latest page. Agar user ne purane messages load kiye the,
      // to cursor null karne se forceRefetch + merge latest page se replace kar dega
      if (cursor === null) refetch();
      else setCursor(null);
    },
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    return () => {
      dispatch(resetChatUi());
    };
  }, [id, dispatch]);

  if (isLoading || isChatLoading) {
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
      <ChatMetaProvider chatDetails={chatDetails} recieverIds={recieverIds}>
        <ChatActionProvider>
          <Chathead
            menu={menu}
            members={members}
            memberIds={memberIds}
            setShowModal={setShowModal}
            selected={selecteds}
            chatDetails={chatDetails}
          />{" "}
          {/* <Suspense
            fallback={
              <div className="h-screen w-full flex  justify-center items-center">
                <SpinLoader height={"50px"} width={"50px"} />
              </div>
            }
          > */}
          <VirtualChatlistGrouped
            setCursor={setCursor}
            isFetching={isFetching}
            data={groupedMessages}
            nextCursor={nextCursor}
            hasMore={hasMore}
            setMenu={setMenu}
            timerRef={timerRef}
            messages={messages}
            menu={menu}
            cursor={cursor}
          />
          {/* </Suspense> */}
          <Inputbox
            messages={messages}
            reciever_ids={
              chat_type === "group" ? memberIds : [chatDetails?.user_id]
            }
          />
        </ChatActionProvider>
      </ChatMetaProvider>
      <Modal values={showModal} setModal={setShowModal}>
        {showModal.type === "delete" && (
          <DeleteMessage setShowModal={setShowModal} chat_id={id} />
        )}
      </Modal>
    </div>
  );
};

export default ChatPage;
