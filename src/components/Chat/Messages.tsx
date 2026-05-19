import React from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/dummy";

type emoji = {
  react_id: number;
  emoji: string;
};

interface messageProps {
  emojis: [emoji];
  msg: Message;
}

const Messages = ({
  msg,
  emojis,
}: {
  msg: Message;
  emojis: { react_id: number; emoji: string };
}) => {
  return (
    <div className={cn("relative max-w-[80%] md:max-w-[65%] ")}>
      <div
        className={cn(
          "rounded-lg px-3 py-1.5 shadow-sm text-sm break-words",
          msg.sender_id === 1
            ? "bg-wa-msg-sent dark:bg-wa-msg-sent-dark rounded-tr-none text-[#111b21] dark:text-[#e9edef]"
            : "bg-wa-msg-received dark:bg-wa-msg-received-dark rounded-tl-none text-[#111b21] dark:text-[#e9edef]",
        )}
      >
        <span className="mr-14">{msg.content}</span>
        <span className="float-right -mb-1 mt-1 ml-2 flex items-center text-[10px] text-gray-500 dark:text-gray-400">
          {msg.created_at}
          {msg.sender_id === 1 && (
            <span
              className={cn(
                "ml-1",
                msg.seen_at ? "text-blue-500" : "text-gray-400",
              )}
            >
              {msg.seen_at ? "✓✓" : "✓"}
            </span>
          )}
        </span>
      </div>

      <div
        className={` flex justify-end ${msg.reactions.length > 0 ? "block" : "invisible"}`}
      >
        <span className="p-1 text-red-400 text-[8px] bg-black">
          {msg.reactions.length}
        </span>
      </div>
    </div>
  );
};

export default Messages;
