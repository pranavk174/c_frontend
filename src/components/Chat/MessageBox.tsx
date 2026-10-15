import { memo } from "react";
import Messages from "./Messages";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { emoji, MessageboxProps } from "@/lib/dummy";
import { logger } from "@/lib/utils";
import { setShow } from "@/redux/slices/ChatSlice";
import { useAppDispatch } from "@/lib/hooks";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useChat } from "@/Context/ChatContext";

const MessageBox = memo(
  ({
    startPressTimer,
    cancelPressTimer,
    msg,
    setActive,
    selectionMode,
    toggleSelection,
    isSelected,
    active,
    handleLike,
    repliedMessage,
    icons,
    emojis,
  }: MessageboxProps) => {
    const dispatch = useAppDispatch();

    const { show } = useSelector((state: RootState) => state.ChatSlice);

    const { id: user_id } = useSelector((state: RootState) => state.userSlice);

    return (
      <motion.div
        onMouseDown={() => startPressTimer(msg?.id)}
        onMouseUp={cancelPressTimer}
        onMouseLeave={cancelPressTimer}
        onTouchStart={() => startPressTimer(msg?.id)}
        onTouchEnd={cancelPressTimer}
        onMouseEnter={() => setActive(msg?.id)}
        onClick={() => {
          if (selectionMode) {
            toggleSelection(msg?.id);
          }
        }}
        className={cn(
          "group relative  flex items-center my-class     mt-2 justify-end  transition-all duration-200",
          // msg.type === "header" ? "justify-end" : "justify-center",

          msg?.sender_id == user_id ? "" : "flex-row-reverse ",

          isSelected && "bg-[#ffffff0f] ",
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
          onMouseLeave={() => {
            dispatch(setShow(null));
          }}
          className={cn(
            "flex items-center group relative gap-2 mx-2 group-hover:text-white transition-opacity duration-200",
            active === msg?.id ? "opacity-100" : "opacity-0",
          )}
        >
          {show === msg.id && (
            <ol
              className={cn(
                " top-0 z-50 flex gap-1 bg-white dark:bg-[#202c33] shadow-xl rounded-full px-2 py-1 border dark:border-[#2f3b43] transition-all",

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
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(setShow(show === msg?.id ? null : msg?.id));
            }}
            className="text-gray-500  float-end size-3 group-hover:text-white transition p-1 rounded-full hover:bg-[#ffffff14] cursor-pointer"
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
        </div>

        {/* Message */}
        <div
          className={cn(
            "transition-all duration-200  min-w-0 max-w-2xl  whitespace-pre-wrap wrap-anywhere ",

            selectionMode && "ml-8",
          )}
        >
          {msg && (
            <Messages
              msg={msg}
              user_id={user_id}
              repliedMessage={repliedMessage ?? undefined}
              emojis={icons}
            />
          )}
        </div>
      </motion.div>
    );
  },
);

MessageBox.displayName = "mesageBox";

export default MessageBox;
