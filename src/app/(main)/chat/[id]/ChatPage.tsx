"use client";

import { useState, useRef, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useSelector, UseSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useSocketEvents } from "@/lib/hooks";
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
import { Chat, Message, MOCK_CHATS, MOCK_MESSAGES } from "@/lib/dummy";
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

type emoji = {
  react_id: number;
  emoji: string;
};
const ChatPage = ({ id }: { id: number }) => {
  // const resolvedParams = use(params);
  const [reactMessage, {}] = useReactMessageMutation({});
  const [sendMessage] = useSendMessageMutation();
  const { data: chatDetails } = useGetAllChatsQuery(
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
  const [show, setShow] = useState<number | string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);

  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [replyToMessage] = useReplyToMessageMutation();
  const [deleteMessages] = useDeleteMessagesMutation();
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const { data, isLoading, isSuccess } = useGetSingleChatQuery(
    { chat_ids: [parseInt(id)] },
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {
        return {
          data: data?.data?.getChatById?.data?.items,
          isLoading,
          isSuccess,
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

  // console.log(emojis, "emojissssssss", chatDetails);

  //   console.log(data, "chat data is message");
  const chatId = id;
  // const chatId = resolvedParams.id;
  const chat = data;
  const socket = useSocket();

  const [messages, setMessages] = useState(data || []);
  const [inputText, setInputText] = useState("");
  const [active, setActive] = useState<number | string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number[] | []>([]);
  const [menu, setMenu] = useState(false);
  // console.log(messages, "messagessss");
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handler = useMemo(
    () => ({
      [REFETCH_CHATS]: (data: Message) => {
        console.log(data, "chats dataaaa.... new wala...");
        if (!data) {
          return;
        }
        setMessages((prev: [Message]) => {
          return [...prev, data];
        });
      },
    }),
    [],
  );

  useSocketEvents(socket, handler);
  const [showModal, setShowModal] = useState<boolean>(false);
  console.log(selectionMode, "selection mode");

  const toggleSelection = (ids: number) => {
    // debugger;
    setSelectedMessages((prev) => {
      console.log(
        typeof prev[0],
        "type of fddddd",
        prev,
        prev.includes(ids),
        ids,
      );
      if (prev.includes(ids)) {
        const filtered = prev.filter((item) => item !== ids);

        if (filtered.length === 0) {
          setSelectionMode(false);
        }

        console.log(filtered, "filteredddddd");
        return filtered;
      }

      return [...prev, ids];
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Chat not found
      </div>
    );
  }

  const handleLike = async (msg_id: number, react_id: number) => {
    try {
      await reactMessage({
        chat_ids: [id],
        message_ids: [msg_id],
        react_id,
      });
    } catch (error) {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    console.log(chatDetails.user_id, "chat detaillssssss", chatDetails);
    const newMessage = {
      chat_ids: [id],
      content: inputText,
      reciever_ids: [chatDetails.user_id],
      message_ids: [replyMessage?.id],
    };

    try {
      if (replyMessage !== null) {
        socket.emit(REPLY_MESSAGE, newMessage);
        // await replyToMessage(newMessage).unwrap();
        setReplyMessage(null);
      } else {
        socket.emit(SEND_MESSAGE, newMessage);
        // await sendMessage(newMessage);
      }
      scrollToBottom();
    } catch (error) {}

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  const handleLongPress = (id: number) => {
    // console.log("Long Press Triggered");
    setSelected((p) => [...p, id]);
    setMenu(true);
    setSelectionMode(true);
    // toggleSelection(id);
  };

  const startPressTimer = (id: number) => {
    timerRef.current = setTimeout(() => {
      handleLongPress(id);

      //
    }, 500); // 500ms
  };

  const cancelPressTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const deleteMessage = async (delete_type: string) => {
    try {
      await deleteMessages({
        chat_ids: [Number(id)],
        message_ids: selectedMessages,
        delete_type,
      }).unwrap();
      setShowModal(false);
      setSelected([]);
      setSelectedMessages([]);
    } catch (error) {}
  };

  // console.log(chat, "chat detaillssss.");

  return (
    <div className="flex relative flex-col h-full w-full chat-bg relative">
      {/* Header */}

      {menu ? (
        <header className="h-[60px] bg-wa-header dark:bg-wa-header-dark flex items-center justify-between px-4 py-2 shrink-0 border-b border-wa-divider dark:border-wa-divider-dark z-10">
          <div className="flex items-center">
            <button className="mr-2 p-1  rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <ArrowLeft className="w-5 h-5 text-wa-icon text-black" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer mr-4 shrink-0">
              {/* <img
              src={chatDetails.profile_pic}
              alt={chatDetails.name}
              className="w-full h-full object-cover"
            /> */}
            </div>
            <div className="flex flex-col cursor-pointer">
              {/* <h2 className="text-base  font-normal text-gray-900 dark:text-gray-100">
              {chatDetails.name}
            </h2> */}
              {/* {chat.isOnline ? (
              <span className="text-xs text-wa-icon dark:text-wa-icon-dark">online</span>
            ) : (
              <span className="text-xs text-wa-icon dark:text-wa-icon-dark">click here for contact info</span>
            )} */}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-wa-icon dark:text-wa-icon-dark">
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition hidden sm:block">
              <CornerUpLeft className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <CornerUpRight className="w-5 h-5" />
            </button>
            <div className="w-[1px] h-6 bg-wa-divider dark:bg-wa-divider-dark mx-1"></div>
            <button
              // onClick={deleteMessage}
              onClick={() => setShowModal(true)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <Trash className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </header>
      ) : (
        <header className="h-[60px] bg-wa-header dark:bg-wa-header-dark flex items-center justify-between px-4 py-2 shrink-0 border-b border-wa-divider dark:border-wa-divider-dark z-10">
          <div className="flex items-center">
            <Link
              href="/"
              className="md:hidden mr-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <ArrowLeft className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark" />
            </Link>
            <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer mr-4 shrink-0">
              <img
                src={chatDetails?.profile_pic}
                alt={chatDetails?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col cursor-pointer">
              <h2 className="text-base  font-normal text-gray-900 dark:text-gray-100">
                {chatDetails?.name}
              </h2>
              {/* {chat.isOnline ? (
              <span className="text-xs text-wa-icon dark:text-wa-icon-dark">online</span>
            ) : (
              <span className="text-xs text-wa-icon dark:text-wa-icon-dark">click here for contact info</span>
            )} */}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-wa-icon dark:text-wa-icon-dark">
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition hidden sm:block">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <Phone className="w-5 h-5" />
            </button>
            <div className="w-[1px] h-6 bg-wa-divider dark:bg-wa-divider-dark mx-1"></div>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 z-10">
        <div className="flex flex-col space-y-2  overflow-y-auto mx-auto max-h-[79.5vh] hide-scrollbar h-full">
          {/* Encrypted Notice */}
          <div className="flex justify-center mb-4">
            <div className="bg-[#ffeecd] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-xs px-4 py-2 rounded-lg text-center shadow-sm max-w-[60%]">
              <span className="inline-block mr-1">🔒</span>
              Messages and calls are end-to-end encrypted. No one outside of
              this chat, not even WhatsApp, can read or listen to them.
            </div>
          </div>

          {data.map((msg: Message) => {
            const icons = emojis?.filter((emoji: emoji) =>
              msg.reactions.some((em) => em.react_id === emoji.react_id),
            );

            const isSelected = selectedMessages.includes(parseInt(msg.id));

            return (
              <motion.div
                key={msg.id}
                onMouseDown={() => startPressTimer(parseInt(msg.id))}
                onMouseUp={cancelPressTimer}
                onMouseLeave={cancelPressTimer}
                onTouchStart={() => startPressTimer(parseInt(msg.id))}
                onTouchEnd={cancelPressTimer}
                onMouseEnter={() => setActive(msg.id)}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelection(parseInt(msg.id));
                  }
                }}
                className={cn(
                  "group relative flex items-center px-2 py-[2px] justify-end transition-all duration-200",

                  msg.sender_id == user_id ? "" : "flex-row-reverse",

                  isSelected && "bg-[#ffffff0f] dark:bg-[#ffffff08]",
                )}
              >
                {/* Selection Checkbox */}
                {selectionMode && (
                  <div
                    className={cn(
                      "absolute left-2 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",

                      isSelected
                        ? "bg-green-500 border-green-500 scale-100"
                        : "border-gray-400 scale-90",
                    )}
                  >
                    {isSelected && (
                      <span className="text-white text-[10px]">✓</span>
                    )}
                  </div>
                )}

                {/* Message Actions */}
                <div
                  className={cn(
                    "flex items-center gap-2 mx-2 transition-opacity duration-200",

                    active === msg.id ? "opacity-100" : "opacity-0",
                  )}
                >
                  <button
                    className="text-gray-500 hover:text-white transition p-1 rounded-full hover:bg-[#ffffff14]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShow(msg.id);
                    }}
                  >
                    <svg
                      className="w-3 h-3"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 14 8"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 5.326 5.7a.909.909 0 0 0 1.348 0L13 1"
                      />
                    </svg>
                  </button>

                  {/* Emoji Picker */}
                  <ol
                    className={cn(
                      "absolute top-0 z-50 flex gap-1 bg-white dark:bg-[#202c33] shadow-xl rounded-full px-2 py-1 border dark:border-[#2f3b43] transition-all",

                      show === msg.id
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 pointer-events-none",
                    )}
                  >
                    {emojis?.map((em: emoji) => (
                      <li
                        key={em.react_id}
                        onClick={(e) => {
                          e.stopPropagation();

                          handleLike(parseInt(msg.id), em.react_id);
                        }}
                        className="cursor-pointer hover:scale-125 transition-transform"
                      >
                        {em.emoji}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Message */}
                <div
                  className={cn(
                    "transition-all duration-200  max-w-[70%]  ",

                    selectionMode && "ml-8",
                  )}
                >
                  <Messages
                    msg={msg}
                    user_id={user_id}
                    data={data}
                    emojis={icons}
                    setReplyMessage={setReplyMessage}
                  />
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <footer className="h-[62px] bg-wa-header dark:bg-wa-header-dark flex items-center px-4 py-2 shrink-0 z-10">
        <div className="flex items-center space-x-2 text-wa-icon dark:text-wa-icon-dark mr-2 shrink-0">
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
            <Smile className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={handleSendMessage}
          className="flex-1 flex flex-col relative bg-white dark:bg-[#202c33] rounded-xl"
        >
          {/* Reply Preview */}
          {replyMessage !== null && (
            <div className="flex items-start absolute -top-[50px] w-full justify-between bg-gray-100 dark:bg-[#2a3942] border-l-4 border-green-500 px-3 py-2 rounded-t-xl">
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Replying to
                </span>

                <p className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[250px]">
                  {replyMessage?.content}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReplyMessage(null)}
                className="ml-3 text-gray-500 hover:text-red-500 transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center px-2 py-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message"
              className="w-full bg-wa-panel dark:bg-wa-search-input-dark border-none rounded-lg px-4 py-2 text-sm focus:outline-none dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />

            <button
              type="submit"
              className="ml-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
            >
              Send
            </button>
          </div>
        </form>
        <div className="ml-2 shrink-0">
          {inputText.trim() ? (
            <button
              onClick={handleSendMessage}
              className="p-2 text-wa-icon dark:text-wa-icon-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button className="p-2 text-wa-icon dark:text-wa-icon-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>
      <Modal open={showModal} setOpen={setShowModal}>
        <div className="w-[320px] rounded-2xl bg-white dark:bg-[#202c33] shadow-2xl overflow-hidden border border-gray-200 dark:border-[#2f3b43]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2f3b43]">
            <h2 className="text-lg font-semibold text-[#111b21] dark:text-white">
              Delete Message
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Choose how you want to delete this message.
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col p-2">
            {/* Delete for me */}
            <button
              onClick={() => deleteMessage("onlyme")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all"
            >
              <p className="text-sm font-medium text-[#111b21] dark:text-white">
                Delete for me
              </p>

              <span className="text-xs text-gray-500">
                This message will only be removed from your chat.
              </span>
            </button>

            {/* Delete for everyone */}
            <button
              onClick={() => deleteMessage("everyone")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all mt-1"
            >
              <p className="text-sm font-medium text-red-500">
                Delete for everyone
              </p>

              <span className="text-xs text-gray-500">
                This message will be removed for everyone.
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#2f3b43] flex justify-end">
            <button className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage;
