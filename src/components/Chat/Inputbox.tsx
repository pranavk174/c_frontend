"use client";

import { Chat, Message, MessageItem } from "@/lib/dummy";

import { Mic, Paperclip, Send, Smile } from "lucide-react";
import React, {
  Dispatch,
  FormEvent,
  memo,
  RefObject,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";
import MediaOptions from "./MediaOptions";
import { STOP_TYPING, START_TYPING } from "@/lib/events";
import { useSocket } from "@/layouts/SocketWrapper";
import { logger } from "@/lib/utils";


interface inputBoxProps {
  chatDetails: Chat;
  replyMessage: Message | null;
  setReplyMessage: Dispatch<SetStateAction<MessageItem | null>>;
  // setMessages: Dispatch<SetStateAction<Message[]>>
  scrollToBottom: () => void;
  messages?: Message[];
  chat_id: number;
  startUpload: () => Promise<void>;
  cancelUpload: () => Promise<"success" | undefined>;
  uploadChunks: (id: string) => Promise<void>;
  pausedRef: React.RefObject<boolean>;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  progress: number;
  uploadId: string;
  reciever_ids: number[];
  file: File | null;
  // inputText: string;
  setInputText: Dispatch<SetStateAction<string>>;
  inputRef: RefObject<HTMLInputElement | null>;
  handleSendMessage: (e: FormEvent<Element>) => Promise<void>;
}

const Inputbox = memo(
  ({
    startUpload,
    reciever_ids,
    handleSendMessage,
    cancelUpload,
    file,
    // inputText,
    inputRef,
    setInputText,
    progress,
    uploadId,
    uploadChunks,
    pausedRef,
    setFile,

    replyMessage,
    messages,
    setReplyMessage,

    chat_id,
  }: inputBoxProps) => {
    // const [inputText, setInputText] = useState("");
    const [open, setOpen] = useState(false);
    const { chatSocket: socket, notificationSocket } = useSocket();

    const typingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTyping = () => {
      // Pehli baar typing start
      if (!typingRef.current) {
        typingRef.current = true;
        socket.emit(START_TYPING, { chat_id, reciever_ids });
      }

      // Har key press par timer reset
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        typingRef.current = false;
        socket.emit(STOP_TYPING, { chat_id, reciever_ids });
      }, 1500);
    };


    return (
      <footer className=" py-1 h-fit relative  bg-wa-header dark:bg-wa-header-dark flex items-center px-4 shrink-0 z-10">
        <div className="flex relative items-center space-x-2 text-wa-icon dark:text-wa-icon-dark mr-2 shrink-0">
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
            <Smile className="w-6 h-6" />
          </button>

          <div>
            <MediaOptions
              setInputText={setInputText}
              // inputText={inputText}
              file={file}
              inputRef={inputRef}
              pausedRef={pausedRef}
              setFile={setFile}
              progress={progress}
              uploadId={uploadId}
              open={open}
              uploadChunks={uploadChunks}
              cancelUpload={cancelUpload}
              startUpload={startUpload}
              messages={messages ?? []}
              setOpen={setOpen}
            />
            <button
              onClick={() => setOpen((p) => !p)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();

            // logger.log(inputRef.current.value, "input ref dataaaa")
            if (!inputRef.current) return;
            handleSendMessage(e);
          }}
          className="flex-1 flex flex-col relative bg-white dark:bg-[#202c33] rounded-xl"
        >
          {/* Reply Preview */}
          {replyMessage !== null && (
            <div className="flex items-start absolute -top-12.5 w-full justify-between bg-gray-100 dark:bg-wa-search-input-dark border-l-4 border-green-500 px-3 py-2 rounded-t-xl">
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Replying to
                </span>

                <p className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-62.5">
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
            {/* <input
              type="text"
              ref={inputRef}
              // value={inputText}
              // onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message"
              className="w-full bg-wa-panel dark:bg-wa-search-input-dark border-none rounded-lg px-4 py-2 text-sm focus:outline-none dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            /> */}

            <input
              type="text"
              ref={inputRef}
              onInput={handleTyping}
              placeholder="Type a message"
              className="w-full bg-wa-panel dark:bg-wa-search-input-dark border-none rounded-lg px-4 py-2 text-sm focus:outline-none dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <div className="ml-2 shrink-0">
              {inputRef.current ? (
                <button
                  disabled={!inputRef.current}
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
          </div>
        </form>
      </footer>
    );
  },
);

Inputbox.displayName = "Inputbox";

export default Inputbox;
