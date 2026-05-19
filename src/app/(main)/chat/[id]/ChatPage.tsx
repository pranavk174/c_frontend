"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Chat, Message, MOCK_CHATS, MOCK_MESSAGES } from "@/lib/dummy";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  useGetEmojisQuery,
  useGetSingleChatQuery,
  useReactMessageMutation,
} from "@/redux/Apis/User";
import Messages from "@/components/Chat/Messages";

type emoji = {
  react_id: number;
  emoji: string;
};
const ChatPage = ({ id }: { id: number }) => {
  // const resolvedParams = use(params);
  const [reactMessage, {}] = useReactMessageMutation({});
  const [show, setShow] = useState<number | string | null>(null);

  const { data, isLoading, isSuccess } = useGetSingleChatQuery(
    { chat_id: id },
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

  console.log(emojis, "emojissssssss");

  //   console.log(data, "chat data is message");
  const chatId = id;
  // const chatId = resolvedParams.id;
  const chat = data;

  const [messages, setMessages] = useState(data || []);
  const [inputText, setInputText] = useState("");
  const [active, setActive] = useState<number | string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log(messages, "messagessss");
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        chat_id: id,
        message_id: msg_id,
        react_id,
      });
    } catch (error) {}
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: "me",
      text: inputText,
      timestamp: format(new Date(), "h:mm a"),
      isSentByMe: true,
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full w-full chat-bg relative">
      {/* Header */}
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
              src={chat.profile_pic}
              alt={chat.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col cursor-pointer">
            <h2 className="text-base font-normal text-gray-900 dark:text-gray-100">
              {chat.name}
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

          {data.map((msg: Message) => (
            <div
              key={msg.id}
              onMouseEnter={() => setActive(msg.id)}
              className={cn(
                "flex justify-end",
                msg.sender_id === 1 ? " " : " flex-row-reverse",
              )}
            >
              <div className={`${active === msg.id ? "block" : "hidden"}`}>
                <button
                  className="text-gray-500"
                  onClick={() => setShow(msg.id)}
                >
                  %%
                </button>
                <ol
                  className={`flex ${show === msg.id ? "block" : "hidden"}  `}
                >
                  {emojis?.map((em: emoji) => (
                    <li
                      onClick={() => handleLike(parseInt(msg.id), em.react_id)}
                      key={em.react_id}
                    >
                      {em.emoji}
                    </li>
                  ))}
                </ol>
              </div>

              <Messages msg={msg} emojis={emojis} />
            </div>
          ))}
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
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message"
            className="w-full bg-wa-panel dark:bg-wa-search-input-dark border-none rounded-lg px-4 py-2 text-sm focus:outline-none dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
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
    </div>
  );
};

export default ChatPage;
