"use client";
import { useSocket } from "@/layouts/SocketWrapper";
import { Chat, Message } from "@/lib/dummy";
import { REFETCH_CHATS, REPLY_MESSAGE, SEND_MESSAGE } from "@/lib/events";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
import { UserApi, useReplyToMessageMutation } from "@/redux/Apis/User";
import { Mic, Paperclip, Send, Smile } from "lucide-react";
import React, {
  Dispatch,
  FormEvent,
  memo,
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import MediaOptions from "./MediaOptions";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

interface inputBoxProps {
  chatDetails: Chat;
  replyMessage: Message | null;
  setReplyMessage: Dispatch<SetStateAction<Message | null>>;
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
  file: File | null;
  inputText: string;
  setInputText: Dispatch<SetStateAction<string>>;
  handleSendMessage: (e: FormEvent<Element>) => Promise<void>;
}

const Inputbox = memo(
  ({
    startUpload,
    handleSendMessage,
    cancelUpload,
    file,
    inputText,
    setInputText,
    progress,
    uploadId,
    uploadChunks,
    pausedRef,
    setFile,
    chatDetails,
    replyMessage,
    messages,
    setReplyMessage,
    scrollToBottom,
    chat_id,
  }: inputBoxProps) => {
    // const [inputText, setInputText] = useState("");
    const [open, setOpen] = useState(false);


    return (
      <footer className="h-[62px] bg-wa-header dark:bg-wa-header-dark flex items-center px-4 py-2 shrink-0 z-10">
        <div className="flex relative items-center space-x-2 text-wa-icon dark:text-wa-icon-dark mr-2 shrink-0">
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition">
            <Smile className="w-6 h-6" />
          </button>

          <div>
            <MediaOptions
              setInputText={setInputText}
              inputText={inputText}
              file={file}
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
          </div>
        </form>

      </footer>
    );
  },
);

Inputbox.displayName = "Inputbox";

export default Inputbox;
