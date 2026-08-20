import { memo } from "react";
import Messages from "./Messages";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { emoji, MessageboxProps } from "@/lib/dummy";
import { logger } from "@/lib/utils";

const MessageBox = memo(
  ({
    startPressTimer,
    cancelPressTimer,
    msg,
    setActive,
    show,
    selectionMode,
    toggleSelection,
    isSelected,
    user_id,
    active,
    setShow,
    handleLike,
    pausedRef,
    progress,
    uploadId,
    // mappedMessages,
    uploadChunks,
    chatDetails,
    cancelUpload,
    repliedMessage,
    // data,
    icons,
    setReplyMessage,
    emojis,
  }: MessageboxProps) => {
    // logger.log("message box triggereddddd");



    // if (msg.kind === 'header') return

    return (
      <motion.div
        onMouseDown={() => startPressTimer(msg?.id)}
        onMouseUp={cancelPressTimer}
        onMouseLeave={cancelPressTimer}
        onTouchStart={() => startPressTimer(msg?.id)}
        onTouchEnd={cancelPressTimer}
        // onMouseEnter={() => setActive(msg?.id)}
        onClick={() => {
          if (selectionMode) {
            toggleSelection(msg?.id);
          }
        }}
        className={cn(
          "group relative flex items-center  px-2 py-0.5  justify-end  transition-all duration-200",
          // msg.type === "header" ? "justify-end" : "justify-center",

          msg?.sender_id == user_id ? "" : "flex-row-reverse",

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
            {isSelected && <span className="text-white text-[10px]">✓</span>}
          </div>
        )}

        {/* Message Actions */}
        <div
          className={cn(
            "flex items-center gap-2 mx-2 transition-opacity duration-200",
            "opacity-0 group-hover:opacity-100",
          )}
        >
          <button
            className="text-gray-500 hover:text-white transition p-1 rounded-full hover:bg-[#ffffff14]"
            onClick={(e) => {
              e.stopPropagation();
              setShow(msg?.id);
            }}
          >
            <svg
              className="size-3"
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

              show === msg?.id
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none",
            )}
          >
            {emojis?.map((em: emoji) => (
              <li
                key={em.react_id}
                onClick={(e) => {
                  e.stopPropagation();

                  logger.log(msg?.id, "messgae id ", em.react_id);
                  handleLike(msg?.id, em.react_id);
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
          {msg && (
            <Messages
              msg={msg}
              // mappedMessages={mappedMessages}
              pausedRef={pausedRef}
              progress={progress}
              uploadId={uploadId}
              uploadChunks={uploadChunks}
              chatDetails={chatDetails}
              cancelUpload={cancelUpload}
              user_id={user_id}
              repliedMessage={repliedMessage ?? undefined}
              emojis={icons}
              setReplyMessage={setReplyMessage}
            />
          )}
        </div>
      </motion.div >
    );
  },
);

MessageBox.displayName = "mesageBox";

export default MessageBox;
