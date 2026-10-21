"use client";
import {
  Chat,
  ChatItem,
  chatListProps,
  emoji,
  Message,
  message_reactions,
  seen_user,
  socketResponse,
  typingItem,
} from "@/lib/updated/dummy";
import {
  EDIT_MESSAGE,
  MESSAGE_REACTION,
  MESSAGE_SEEN,
  REFETCH_CHATS,
  START_TYPING,
  STOP_TYPING,
} from "@/lib/events";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
// import { useReactMessageMutation } from "@/redux/Apis/User";
import {
  chatApi,
  useGetEmojisQuery,
  useGetWallpaperQuery,
} from "@/redux/Apis/Chat";
import { useEffectEvent } from "react";
import { useChatMeta } from "@/Context/ChatMetaContext";
import { useChatActions } from "@/Context/ChatActionContext";
import { useVirtualizer } from "@tanstack/react-virtual";
import { setSelectedMessages, setTyping } from "@/redux/slices/ChatSlice";
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSocket } from "@/layouts/updated/SocketWrapper";
import SpinLoader from "@/components/Utility/SpinLoader";

import { cn, logger } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useChat } from "@/Context/ChatContext";
import {
  refetchChat,
  reactMessage,
  seenMessage,
  editMessage,
  handleLikes,
  updateSeenMessage,
} from "@/lib/cacaheupdateutils";
import { useChatSocketSync } from "./UseChatSocketSync";
import MessageBox from "../MessageBox";

const VirtualChatlistGrouped = memo(
  ({
    setMenu,
    setCursor,

    isFetching,
    data: MessageData,
    nextCursor,
    hasMore,
    messages,

    messageMap,
    cursor,
  }: chatListProps) => {
    const { chatSocket: socket } = useSocket();
    const parentRef = React.useRef<HTMLDivElement | null>(null);
    const topSentinelRef = useRef<HTMLDivElement | null>(null);
    const [active, setActive] = useState<number | string | null>(null);
    const { selectedMessages } = useSelector(
      (state: RootState) => state.ChatSlice,
    );

    const { chatDetails } = useChatMeta();
    const { chat_id, user_id: chat_user_id } = chatDetails;

    const typing = useSelector((state: RootState) =>
      state.ChatSlice.typingChatIds.includes(chat_id),
    );

    const { emojis } = useGetEmojisQuery(
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
    // const { typing } = useSelector((state: RootState) => state.ChatSlice);

    const data: ChatItem[] = useMemo(
      () =>
        typing
          ? [
              ...MessageData,
              { kind: "typing", id: "typing", typing: true } as typingItem,
            ]
          : MessageData,
      [typing, MessageData],
    );

    const rowVirtualizer = useVirtualizer({
      count: data.length,

      // Ye function actual scrollable element return karta hai.
      // Virtualizer is element ki scroll position ke basis par calculate karta hai ki kaun-se items render hone chahiye.
      getScrollElement: () => parentRef.current,

      getItemKey: (index) => data[index].id,

      // Ye har item ki estimated height pixels mein batata hai.
      //Isse fast scrolling ke waqt items achanak appear hone ya blank space dikhne ka risk kam ho sakta hai.
      estimateSize: () => 10,

      //Viewport ke upar aur neeche additional items render karne deta hai.
      overscan: 10,

      // Ye actual rendered item ki height measure karta hai.
      // Virtualizer inki actual heights ke basis par item positions aur total size ko update kar sakta hai.
      measureElement: (el) => el.getBoundingClientRect().height,
    });
    const initialScrollDone = useRef(false);
    useEffect(() => {
      if (selectedMessages.length === 0) {
        setSelectionMode(false);
        setMenu(false);
      }
    }, [selectedMessages, setMenu]);

    // const {
    //   chatDetails,
    //   chatDetails: { chat_id, user_id: chat_user_id },
    // } = useChat();
    const hasMountedRef = useRef(false);
    const { id: user_id } = useSelector((state: RootState) => state.userSlice);

    useEffect(() => {
      if (!hasMountedRef.current && data.length > 0) {
        rowVirtualizer.scrollToIndex(data.length - 1, {
          align: "end",
        });
        hasMountedRef.current = true;
      }
    }, [data.length, rowVirtualizer]);

    const prevTotalSizeRef = useRef(0);

    useEffect(() => {
      if (isFetching) {
        prevTotalSizeRef.current = rowVirtualizer.getTotalSize();
      }
    }, [isFetching, rowVirtualizer]);

    useLayoutEffect(() => {
      if (!isFetching && parentRef.current) {
        const diff = rowVirtualizer.getTotalSize() - prevTotalSizeRef.current;
        if (diff > 0) {
          parentRef.current.scrollTop += diff;
        }
      }
    }, [data.length, isFetching, rowVirtualizer]);

    const [selectionMode, setSelectionMode] = useState(false);
    const { url } = useGetWallpaperQuery(null, {
      selectFromResult: ({ data, isLoading }) => {
        return {
          url: data?.data?.getWallPaper?.data?.url,
          isLoading,
        };
      },
    });
    const dispatch = useAppDispatch();

    const handleLike = useCallback(
      async (msg_id: number, react_id: number) => {
        handleLikes({
          msg_id,
          react_id,
          socket,
          user_id,
          chat_id,
          dispatch,
          chat_user_id,
        });
      },
      [user_id, chat_id, dispatch, socket, chat_user_id],
    );

    const toggleSelection = useCallback(
      (id: number) => {
        const updated = selectedMessages.includes(id)
          ? selectedMessages.filter((item) => item !== id)
          : [...selectedMessages, id];

        dispatch(setSelectedMessages(updated));
      },
      [dispatch, selectedMessages],
    );

    const handleLongPress = useCallback(() => {
      setMenu(true);
      setSelectionMode(true);
    }, [setMenu]);


     useEffect(() => {
          const observer = new IntersectionObserver(
            (entries) => {
              if (
                entries[0].isIntersecting &&
                hasMore &&
                !isFetching &&
                initialScrollDone.current
              ) {
                logger.debug("scrolleddd.")
                setCursor(nextCursor);
              }
            },
            {
              root: parentRef.current,
              rootMargin: "100px",
              threshold: 0,
            },
          );
          if (topSentinelRef.current) observer.observe(topSentinelRef.current);
          return () => observer.disconnect();
        }, [data, nextCursor, hasMore, isFetching, setCursor]);
     

    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const seenTimerRef = useRef<NodeJS.Timeout | null>(null);

    const startPressTimer = useCallback(() => {
      longPressTimerRef.current = setTimeout(handleLongPress, 500);
    }, [handleLongPress]);

    const cancelPressTimer = useCallback(() => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }, []);
    const pendingSeenRef = useRef<Set<number>>(new Set());

    const flushSeen = useEffectEvent(() => {
      // tab background mein hai to "seen" mat bhejo — user ne actually dekha nahi
      if (document.visibilityState !== "visible") return;
      const message_ids = [...pendingSeenRef.current];
      pendingSeenRef.current.clear();
      if (!message_ids.length || !user_id) return;
      updateSeenMessage({
        chatDetails,
        cursor,
        message_ids,
        user_id,
        dispatch,
        socket,
      });
    });

    useEffect(() => {
      if (!user_id || !messages?.length) return;
      messages.forEach((msg: Message) => {
        // msg.id > 0 → local (negative id) messages skip
        if (
          msg.id > 0 &&
          msg.sender_id !== user_id &&
          !msg.seen_users.includes(user_id)
        ) {
          pendingSeenRef.current.add(msg.id);
        }
      });
      if (seenTimerRef.current) clearTimeout(seenTimerRef.current);
      seenTimerRef.current = setTimeout(() => flushSeen(), 300);

      return () => {
        if (seenTimerRef.current) clearTimeout(seenTimerRef.current);
      };
    }, [messages, user_id]);

    useEffect(() => {
      const onVisibilityChange = () => flushSeen();
      document.addEventListener("visibilitychange", onVisibilityChange);
      return () =>
        document.removeEventListener("visibilitychange", onVisibilityChange);
    }, []);

    const lastMessageId = messages?.at(-1)?.id;

    const scrollToEndIfNeeded = useEffectEvent(() => {
      const el = parentRef.current;
      const last = messages?.at(-1);
      if (!el || !last) return;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      if (last.sender_id === user_id || nearBottom) {
        rowVirtualizer.scrollToIndex(data.length - 1, { align: "end" });
      }
    });

    useEffect(() => {
      scrollToEndIfNeeded();
    }, [lastMessageId]);

    return (
      <div
        ref={parentRef}
        className=" relative flex flex-col h-full p-1 z-10  object-contain bg-no-repeat  hide-scrollbar"
        style={{
          backgroundImage: `url(${url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",

          overflowY: "auto",
        }}
      >
        <div
          style={{
            // Yahan getTotalSize() virtual list ki total estimated/measured height deta hai.
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
          className={`  relative  mx-auto flex-1 min-h-0 overflow-y-auto  `}
        >
          {/* Top Sentinel for Load More */}
          <div
            ref={topSentinelRef}
            style={{
              backgroundColor:'red',
              position: "absolute",
              top: 0,
              zIndex:222,
              height: "1px",
              width: "100%",
            }}
          />

          {/* Encrypted Notice */}

          <div className="flex relative justify-center mb-4">
            <div className="bg-[#ffeecd] dark:bg-[#182229] text-wa-icon dark:text-[#8696a0] text-xs px-4 py-2 rounded-lg text-center shadow-sm max-w-[60%]">
              <span className="inline-block mr-1">🔒</span>
              Messages and calls are end-to-end encrypted. No one outside of
              this chat, not even WhatsApp, can read or listen to them.
            </div>
          </div>

          {isFetching && (
            <div className="h-50 w-full flex justify-center ">
              <SpinLoader height={"40px"} width={"40px"} />
            </div>
          )}

          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const msg = data[virtualItem.index];

            const properties = {
              style: {
                position: "absolute" as const,
                top: 80,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              },
              "data-index": virtualItem.index,
              ref: (el: HTMLDivElement | null) => {
                if (el) rowVirtualizer.measureElement(el);
              },
            };

            if (msg.kind === "header") {
              return (
                <div key={virtualItem.key} {...properties}>
                  <div className="flex justify-center">
                    <p className="text-xs p-1 bg-wa-header  dark:bg-wa-header-dark rounded-md">
                      {msg.date}
                    </p>
                  </div>
                </div>
              );
            }

            if (msg.kind === "typing" && msg.typing) {
              return (
                <div
                  className="px-2 py-1 pb-2"
                  key={virtualItem.key}
                  {...properties}
                >
                  <div
                    className={cn(
                      "relative rounded-2xl px-3 w-30 py-3 shadow-sm text-sm wrap-anywhere transition-all",
                      msg.sender_id == user_id
                        ? "bg-wa-msg-sent dark:bg-wa-msg-sent-dark rounded-br-md text-wa-bg-dark dark:text-wa-divider"
                        : "bg-white dark:bg-[#202c33] rounded-bl-md text-wa-bg-dark dark:text-wa-divider",
                    )}
                    // className="flex items-center gap-1 px-3 bg-none py-2 rounded-2xl"
                  >
                    <span className="text-xs text-slate-400   mr-1">
                      Typing
                    </span>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{ animationDelay: `${i * i * 50}ms` }}
                        className="typing-dot w-1.5 h-1.5 ml-1 animate-bounce rounded-full bg-violet-400 inline-block"
                      />
                    ))}
                  </div>
                </div>
              );
            }

            if (msg.kind === "message") {
              const icons = emojis?.filter((emoji: emoji) =>
                msg?.reactions?.some((em) => em.react_id === emoji.react_id),
              );

              const repliedMessage =
                msg.reply_to_message_id !== null
                  ? (messageMap.get(msg.reply_to_message_id) ?? null)
                  : null;

              const isSelected = selectedMessages.includes(msg?.id);

              return (
                <div key={virtualItem.key} {...properties}>
                  <MessageBox
                    startPressTimer={startPressTimer}
                    cancelPressTimer={cancelPressTimer}
                    msg={msg}
                    setActive={setActive}
                    selectionMode={selectionMode}
                    toggleSelection={toggleSelection}
                    isSelected={isSelected}
                    active={active}
                    repliedMessage={repliedMessage}
                    handleLike={handleLike}
                    icons={icons}
                    emojis={emojis}
                  />
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  },
);

VirtualChatlistGrouped.displayName = "VirtualChatlistGrouped";
export default VirtualChatlistGrouped;
