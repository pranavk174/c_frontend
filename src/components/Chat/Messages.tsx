import React, { Dispatch, SetStateAction, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Chat, ChatItem, Message, MessageItem } from "@/lib/dummy";
import {
  motion,
  useMotionValue,
  animate,
  useReducedMotion,
} from "framer-motion";
import { Reply, CheckCheck, Check, Smile } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/utils";


type emoji = {
  react_id: number;
  emoji: string;
};

interface messageProps {
  emojis: emoji[];
  msg: MessageItem;
  user_id: number | null;
  // data: Message[];
  // mappedMessages: Map<number, Message>;
  setReplyMessage: React.Dispatch<React.SetStateAction<MessageItem | null>>;
  repliedMessage?: Message | null | undefined;
  cancelUpload: () => Promise<"success" | undefined>;
  uploadChunks: (id: string) => Promise<void>;

  pausedRef: React.RefObject<boolean>;

  progress: number;
  uploadId: string;
  chatDetails: Chat;
}

const Messages = ({
  // data,
  msg,

  emojis,
  user_id,

  setReplyMessage,

  uploadChunks,
  chatDetails,
  pausedRef,
  progress,
  uploadId,
  repliedMessage,
  cancelUpload,
}: messageProps) => {
  const x = useMotionValue(0);
  const triggered = useRef(false);

  // logger.log("messages  triggereddddddddd");

  const router = useRouter();

  //

  const handleDragEnd = () => {
    if (x.get() > 90 && !triggered.current) {
      triggered.current = true;

      setReplyMessage(msg);

      setTimeout(() => {
        triggered.current = false;
      }, 400);
    }

    animate(x, 0, {
      type: "spring",
      stiffness: 300,
      damping: 20,
    });
  };

  // logger.log("replied message", repliedMessage);

  const repliedStory = msg.story_id ? msg.story_item : null;

  // logger.log(repliedMessage, "replite message/...")

  return (
    <div
      className={cn(
        "    flex mb-2 px-2 justify-end",
        msg.sender_id === user_id ? "justify-end" : "justify-start",
      )}
    >
      <div className="relative flex items-center ">
        {/* Reply Icon While Dragging */}
        <motion.div
          style={{
            opacity: x.get() > 20 ? 1 : 0,
            scale: x.get() > 20 ? 1 : 0.5,
          }}
          className="absolute -left-10 bg-green-500 text-white p-2 rounded-full shadow-lg"
        >
          <Reply size={16} />
        </motion.div>

        {/* Message Bubble */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 120 }}
          style={{ x }}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing"
        >
          <div
            className={cn(
              "relative rounded-2xl px-3 py-2 shadow-sm text-sm wrap-break-word transition-all",
              msg.sender_id == user_id
                ? "bg-wa-msg-sent dark:bg-wa-msg-sent-dark rounded-br-md text-wa-bg-dark dark:text-wa-divider"
                : "bg-white dark:bg-[#202c33] rounded-bl-md text-wa-bg-dark dark:text-wa-divider",
            )}
          >
            {/* Reply Preview */}
            {repliedMessage && (
              <div
                className={cn(
                  "mb-2 px-3 py-2 rounded-lg border-l-4",
                  msg.sender_id === user_id
                    ? "bg-[#ffffff70] border-green-600"
                    : "bg-[#00000010] border-blue-500",
                )}
              >
                <p className="text-[11px] font-semibold text-green-700 dark:text-green-300">
                  Reply
                </p>

                <p className="text-xs opacity-80 truncate max-w-55">
                  {repliedMessage.content}
                </p>
              </div>
            )}

            {repliedStory && (
              <div
                className={cn(
                  "mb-2 px-2 py-2 rounded-lg border-l-4",
                  msg.sender_id === user_id
                    ? "bg-[#ffffff70] border-green-600"
                    : "bg-[#00000010] border-blue-500",
                )}
              >
                <p className="text-[11px] font-semibold text-green-700 dark:text-green-300">
                  Story
                </p>

                <div className="text-xs opacity-80 truncate max-w-55">
                  <div className="h-10 w-23 rounded-md">
                    <Image
                      height={100}
                      width={60}
                      alt="replystory"
                      src={repliedStory}
                      className="rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Main Message */}
            <div className="whitespace-pre-wrap wrap-break-word ">
              {msg.preview && (
                <div
                  onClick={() =>
                    router.push(`/photo/${encodeURIComponent(msg.preview!)}`)
                  }
                  className="relative w-75  max-h-80 rounded-2xl overflow-hidden bg-black/10"
                >
                  {/* image */}
                  {msg.preview && (
                    <Image
                      priority
                      src={msg.preview}
                      alt="upload"
                      height={300}
                      width={300}
                      style={{ height: "auto", width: "auto" }}
                      className={` w-full h-full object-cover ${msg.isLocal ? "blur-[3px]" : ""}   scale-105`}
                    />
                  )}

                  {/* dark overlay */}
                  {msg.isLocal && (
                    <div className="absolute inset-0 bg-black/40" />
                  )}

                  {/* progress center */}
                  {msg.isLocal && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      {/* circular progress */}
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="5"
                            fill="none"
                          />

                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="white"
                            strokeWidth="5"
                            fill="none"
                            strokeDasharray={214}
                            strokeDashoffset={
                              214 - (214 * (progress || 0)) / 100
                            }
                            strokeLinecap="round"
                          />
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                          {progress || 0}%
                        </div>
                      </div>

                      {/* controls */}
                      <div className="flex items-center gap-3">
                        {/* pause/play */}
                        <button
                          // onClick={() => ()}
                          onClick={() => {
                            pausedRef.current = true;
                          }}
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
                        >
                          {"❚❚"}
                        </button>
                        <button
                          // onClick={() => ()}
                          onClick={() => {
                            pausedRef.current = false;
                            uploadChunks(uploadId);
                          }}
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
                        >
                          {"▶"}
                        </button>

                        {/* cancel */}
                        <button
                          onClick={cancelUpload}
                          className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition"
                        >
                          ✕
                        </button>
                      </div>

                      {/* status */}
                      <p className="text-white text-sm font-medium">
                        {/* {msg.paused ? "Upload Paused" : "Uploading..."} */}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {msg.content}
            </div>

            {/* Time + Tick */}
            <div className="flex items-center justify-between gap-1 mt-1">
              {msg.is_edited && (
                <span className="text-[10px] font-medium text-gray-500">
                  edited
                </span>
              )}
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {msg.created_at}
              </span>

              {msg.sender_id === user_id && (
                <>
                  {msg.seen_users?.includes(chatDetails?.user_id) ? (
                    <CheckCheck size={14} className="text-blue-500" />
                  ) : (
                    <Check size={14} className="text-gray-400" />
                  )}
                </>
              )}
            </div>

            {/* Reactions */}
            {msg.reactions?.length > 0 && (
              <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-white dark:bg-[#202c33] border dark:border-[#2f3b43] rounded-full px-2 py-0.5 shadow-md">
                <Smile size={10} className="text-yellow-500" />

                {emojis?.map((em) => (
                  <span key={em.react_id} className="text-[11px]">
                    {em.emoji}
                  </span>
                ))}

                <span className="text-[10px] text-gray-500">
                  {msg.reactions.length}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Messages;
