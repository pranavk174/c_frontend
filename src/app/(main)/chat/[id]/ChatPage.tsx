"use client";

import { useState, useRef, useEffect, use, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSelector, UseSelector } from "react-redux";
import { UserApi } from "../../../../redux/Apis/User";
import { RootState } from "@/redux/store";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
import { motion, useMotionValue, animate } from "framer-motion";
import {
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  ArrowLeft,
  Video,
  Phone,
  CornerUpLeft,
  CornerUpRight,
  Trash,
  Info,
} from "lucide-react";
import { Chat, Message } from "@/lib/dummy";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Modal from "@/components/HOComponents/Modal";
import {
  useGetAllChatsQuery,
  useGetEmojisQuery,
  useGetSingleChatQuery,
  useReactMessageMutation,
  useSendMessageMutation,
  useReplyToMessageMutation,
  useDeleteMessagesMutation,
} from "@/redux/Apis/User";
import Messages from "@/components/Chat/Messages";
import { useSocket } from "@/layouts/SocketWrapper";
import { REFETCH_CHATS, REPLY_MESSAGE, SEND_MESSAGE } from "@/lib/events";
// import Chatlist from "@/components/Chat/Chatlist";
import Chatlist from "@/components/Chat/Chatlist";
import Inputbox from "@/components/Chat/Inputbox";
import DeleteMessage from "@/components/ModalChilds/DeleteMessage";
import Chathead from "@/components/Chat/Chathead";

type emoji = {
  react_id: number;
  emoji: string;
};

const ChatPage = ({ id }: { id: number }) => {
  // const resolvedParams = use(params);

  const { data: chatDetails } = useGetAllChatsQuery(
    {},
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {

        console.log(typeof id, "type of ...", id)
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

  const [show, setShow] = useState<number | string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);

  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const { data, isLoading, isFetching, isSuccess, nextCursor, hasMore } = useGetSingleChatQuery(
    { chat_ids: [id], cursor, limit: 20 },
    {
      selectFromResult: ({ data, isLoading, isSuccess, isFetching }) => {
        return {
          data: data?.data?.getChatById?.data?.items,
          nextCursor: data?.data?.getChatById?.data?.nextCursor,
          hasMore: data?.data?.getChatById?.data?.hasMore,
          isLoading,
          isSuccess,
          isFetching
        };
      },
    },
  );

  const { emojis, emjojiLoading, emojiCallSuccess } = useGetEmojisQuery(
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


  console.log(cursor, "cursorrrrr....")

  // console.log(emojis, "emojissssssss", chatDetails);

  //   console.log(data, "chat data is message");

  // const chatId = resolvedParams.id;
  const chat = data;
  const socket = useSocket();


  const [active, setActive] = useState<number | string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number[] | []>([]);
  const [menu, setMenu] = useState(false);
  // console.log(messages, "messagessss");
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef.current]);




  const bottomRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        console.log(entries, "entriesssssssss")
        setCursor(() => nextCursor)
      }
    }, {
      rootMargin: "500px",
      threshold: 0,
    })


    if (bottomRef.current) observer.observe(bottomRef.current)

    //  console.log("= data =================")
    return () => observer.disconnect()
  }, [data, nextCursor, hasMore]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [data, nextCursor]);

  // useSocketEvents(socket, handler);
  const [showModal, setShowModal] = useState<boolean>(false);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Chat not found
      </div>
    );
  }




  // console.log(chat, "chat detaillssss.");

  return (
    <div className="flex relative flex-col h-full w-full chat-bg relative">
      {/* Header */}

      <Chathead
        menu={menu}
        setShowModal={setShowModal}
        chatDetails={chatDetails}
      />



      <Chatlist

        setSelectedMessages={setSelectedMessages}
        setCursor={setCursor}
        setSelected={setSelected}
        isFetching={isFetching}
        data={data}
        nextCursor={nextCursor}
        hasMore={hasMore}
        setMenu={setMenu}
        selectedMessages={selectedMessages}

        timerRef={timerRef}
        setActive={setActive}
        emojis={emojis}
        chat_id={id}
        user_id={user_id}
        setShow={setShow}
        active={active}
        setReplyMessage={setReplyMessage}

        show={show} menu={menu} chatDetails={chatDetails} />

      {/* Input */}



      <Inputbox
        chatDetails={chatDetails}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}

        scrollToBottom={scrollToBottom}
        chat_id={id}
      />


      <Modal open={showModal} setOpen={setShowModal}>
        <DeleteMessage
          setShowModal={setShowModal}
          setSelected={setSelected}
          setSelectedMessages={setSelectedMessages}
          selectedMessages={selectedMessages}
          chat_id={id}
        />

      </Modal>
    </div>
  );
};

export default ChatPage;
