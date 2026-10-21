"use client";
import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetMembersQuery } from "@/redux/Apis/Chat";
import { RootState } from "@/redux/store";
import { ChatMetaProvider } from "@/Context/ChatMetaContext";
import { ChatActionProvider } from "@/Context/ChatActionContext";
import { groupMessagesByDate } from "@/lib/updated/chatGrouping";

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
import VirtualChatlistGrouped from "@/components/Chat/updated/VirtualChatListgrouped";
import { logger } from "@/lib/utils";

import { ChatProvider } from "@/Context/ChatContext";
import { useSearchParams } from "next/navigation";
import { useChatRoom } from "@/lib/updated/useChatRoom";
import { resetChatUi } from "@/redux/slices/updated/ChatSlice";
import { useAppDispatch } from "@/lib/hooks";
import { useChatSocketSync } from "@/components/Chat/updated/UseChatSocketSync";

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
      selectFromResult: ({ data, isLoading }) => ({
        // find() cache ka hi object lautata hai → reference stable
        data: data?.data?.getAllChats?.data?.items?.find(
          (item: Chat) => item.chat_id === id,
        ) as Chat | undefined,
        isLoading,
      }),
    },
  );

  const { messages, nextCursor, hasMore, isLoading, isFetching, refetch } =
    useGetSingleChatQuery(
      { chat_ids: [id], cursor, limit: 20 },
      {
        // sirf cache ke references lautao — yahan naya array/object MAT banao
        selectFromResult: ({ data, isLoading, isFetching }) => ({
          messages: data?.data?.getChatById?.data?.items as
            | Message[]
            | undefined,
          nextCursor: data?.data?.getChatById?.data?.nextCursor,
          hasMore: data?.data?.getChatById?.data?.hasMore,
          isLoading,
          isFetching,
        }),
        refetchOnMountOrArgChange: true,
      },
    );

  const { members } = useGetMembersQuery(
    { chat_id: id },
    {
      selectFromResult: ({ data, isLoading, error }) => {
        return {
          members: data?.data?.getMembers?.data?.items as
            | memberProps[]
            | undefined,
          isLoading,
          error,
        };
      },
      skip: chat_type !== "group",
    },
  );
  const memberIds = useMemo(
    () => members?.map((m) => m.member_id) ?? [],
    [members],
  );

  const groupedMessages = useMemo(
    () => groupMessagesByDate(messages ?? []),
    [messages],
  );
  const messageMap = useMemo(
    () => new Map((messages ?? []).map((m) => [m.id, m])),
    [messages],
  );

  const selecteds = useMemo(() => {
    const selected = messageMap.get(selectedMessages[0]);
    return {
      message: selected?.content,
      sender_id: selected?.sender_id,
      id: selected?.id,
    };
  }, [messageMap, selectedMessages]);

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

  useChatSocketSync(id);

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

  if (!messages || !chatDetails) {
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
            key={id}
            setCursor={setCursor}
            isFetching={isFetching}
            data={groupedMessages}
            nextCursor={nextCursor}
            hasMore={hasMore}
            setMenu={setMenu}
            messages={messages}
            menu={menu}
            messageMap={messageMap}
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
