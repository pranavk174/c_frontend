import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/dummy";
import { motion, useMotionValue, animate } from "framer-motion";
import { Reply, CheckCheck, Check, Smile } from "lucide-react";

type emoji = {
  react_id: number;
  emoji: string;
};

interface messageProps {
  emojis: emoji[];
  msg: Message;
  user_id: number | null;
  data: Message[];
  setReplyMessage: React.Dispatch<React.SetStateAction<Message | null>>;
}

const Messages = ({
  data,
  msg,
  emojis,
  user_id,
  setReplyMessage,
}: messageProps) => {
  const x = useMotionValue(0);
  const triggered = useRef(false);

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

  const repliedMessage =
    msg.reply_to_message !== null
      ? data.find((d) => parseInt(d.id) === msg.reply_to_message)
      : null;

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
              "relative rounded-2xl px-3 py-2 shadow-sm text-sm break-words transition-all",
              msg.sender_id === user_id
                ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-br-md text-[#111b21] dark:text-[#e9edef]"
                : "bg-white dark:bg-[#202c33] rounded-bl-md text-[#111b21] dark:text-[#e9edef]",
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

                <p className="text-xs opacity-80 truncate max-w-[220px]">
                  {repliedMessage.content}
                </p>
              </div>
            )}

            {/* Main Message */}
            <div className="whitespace-pre-wrap break-words pr-12">
              {msg.content}
            </div>

            {/* Time + Tick */}
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {msg.created_at}
              </span>

              {msg.sender_id === user_id && (
                <>
                  {msg.seen_at ? (
                    <CheckCheck size={14} className="text-blue-500" />
                  ) : (
                    <Check size={14} className="text-gray-400" />
                  )}
                </>
              )}
            </div>

            {/* Reactions */}
            {msg.reactions.length > 0 && (
              <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-white dark:bg-[#202c33] border dark:border-[#2f3b43] rounded-full px-2 py-[2px] shadow-md">
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
