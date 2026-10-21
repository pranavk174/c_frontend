import React, { Dispatch, SetStateAction, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Chat, ChatItem, Message, MessageItem } from "@/lib/updated/dummy";
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
import { useSendMediaMessage } from "@/lib/useSendMessage";
import { useAppDispatch } from "@/lib/hooks";
import { setReplyMessage } from "@/redux/slices/ChatSlice";
import { useChat } from "@/Context/ChatContext";
import { useChatMeta } from "@/Context/ChatMetaContext";
import { useChatActions } from "@/Context/ChatActionContext";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

type emoji = {
  react_id: number;
  emoji: string;
};

interface messageProps {
  emojis: emoji[];
  msg: MessageItem;
  user_id: number | null;
  repliedMessage?: Message | null | undefined;
}

const Messages = ({
  // data,
  msg,

  emojis,
  user_id,

  repliedMessage,
  // cancelUpload,
}: messageProps) => {
  const x = useMotionValue(0);
  const triggered = useRef(false);

  // logger.log("messages  triggereddddddddd");

  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleDragEnd = () => {
    if (x.get() > 90 && !triggered.current) {
      triggered.current = true;

      dispatch(setReplyMessage(msg));

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

  const { chatDetails } = useChatMeta();
  const { pauseUpload, resumeUpload, cancelUpload, retryMessage } =
    useChatActions();

  const upload = useSelector((state: RootState) =>
    msg.client_msg_id ? state.UploadSlice.jobs[msg.client_msg_id] : undefined,
  );
  const progress = upload?.progress ?? 0;
  const canResume = upload?.status === "paused" || upload?.status === "failed";

  const date = new Date(parseInt(msg.created_at));

  console.log(
    date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),

    date,
  );

  return (
    <div
      className={cn(
        "    flex mb-2 px-2 justify-end min-w-0 ",
        msg.sender_id === user_id ? "justify-end" : "justify-start",
      )}
    >
      <div className="relative flex items-center min-w-0 ">
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
          className="cursor-grab active:cursor-grabbing min-w-0"
        >
          <div
            className={cn(
              "relative rounded-2xl px-3 py-2 shadow-sm text-sm wrap-anywhere transition-all",
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
            <div className="whitespace-pre-wrap wrap-anywhere ">
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
                  {msg.isLocal && upload && msg.client_msg_id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      {/* circular progress SAME — bas `progress` variable ab upar wala hai */}

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            canResume
                              ? resumeUpload(msg.client_msg_id!)
                              : pauseUpload(msg.client_msg_id!)
                          }
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
                        >
                          {canResume ? "▶" : "❚❚"}
                        </button>
                        <button
                          onClick={() => cancelUpload(msg.client_msg_id!)}
                          className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="text-white text-sm font-medium">
                        {upload.status === "paused" && "Upload Paused"}
                        {upload.status === "failed" &&
                          "Upload Failed — tap ▶ to retry"}
                        {upload.status === "uploading" && "Uploading..."}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap wrap-anywhere ">
                {msg.content}
              </div>
            </div>

            {/* Time + Tick */}
            <div className="flex items-center justify-between gap-1 mt-1">
              {msg.is_edited && (
                <span className="text-[10px] font-medium text-gray-500">
                  edited
                </span>
              )}
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {/* {msg.created_at} */}
                {date.toLocaleTimeString()}
                {/* {date.toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })} */}
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

            {msg.send_status === "failed" && (
              <button
                onClick={() => retryMessage(msg)}
                className="text-xs text-red-500 mt-1"
              >
                ⚠ Not sent — tap to retry
              </button>
            )}

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
