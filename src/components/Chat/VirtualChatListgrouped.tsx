"use client";
import {
  Chat,
  chatListProps,
  emoji,
  Message,
  message_reactions,
  seen_user,
  socketResponse,
} from "@/lib/dummy";
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
import { useSocket } from "@/layouts/SocketWrapper";
import SpinLoader from "../Utility/SpinLoader";
import MessageBox from "./MessageBox";
import { logger } from "@/lib/utils";
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

const VirtualChatlistGrouped = memo(
  ({
    setMenu,
    setCursor,
    isFetching,
    data,
    nextCursor,
    hasMore,
    messages,
    timerRef,

    cursor,
  }: chatListProps) => {
    const { chatSocket: socket } = useSocket();
    const parentRef = React.useRef<HTMLDivElement | null>(null);
    const topSentinelRef = useRef<HTMLDivElement | null>(null);
    const [active, setActive] = useState<number | string | null>(null);
    const { selectedMessages } = useSelector(
      (state: RootState) => state.ChatSlice,
    );
    const chatContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, [messages, nextCursor]);

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

    const rowVirtualizer = useVirtualizer({
      count: data.length,

      // Ye function actual scrollable element return karta hai.
      // Virtualizer is element ki scroll position ke basis par calculate karta hai ki kaun-se items render hone chahiye.
      getScrollElement: () => parentRef.current,

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

    const {
      chatDetails,
      chatDetails: { chat_id, user_id: chat_user_id },
    } = useChat();
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

    useLayoutEffect(() => {
      if (!initialScrollDone.current && data.length > 0) {
        requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(data.length - 1, {
            align: "end",
          });

          initialScrollDone.current = true;
        });
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
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMore &&
            !isFetching &&
            initialScrollDone.current
          ) {
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

    const startPressTimer = useCallback(
      (id: number) => {
        timerRef.current = setTimeout(() => {
          handleLongPress();

          //
        }, 500); // 500ms
      },
      [handleLongPress, timerRef],
    );

    const cancelPressTimer = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }, [timerRef]);

    const pendingSeenRef = useRef<Set<number>>(new Set());

    useEffect(() => {
      if (!user_id || !messages?.length) return;
      // Queue me saare unseen messages add karo
      messages.forEach((msg: Message) => {
        if (msg.sender_id !== user_id && !msg.seen_users.includes(user_id)) {
          pendingSeenRef.current.add(msg.id);
        }
      });
      // Har naye message pe timer reset hoga
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        const message_ids = [...pendingSeenRef.current];
        pendingSeenRef.current.clear();
        timerRef.current = null;
        if (!message_ids.length) return;
        logger.log("Sending Seen Batch:", message_ids);
        updateSeenMessage({
          chatDetails,
          cursor,
          message_ids,
          user_id,
          dispatch,
          socket,
        });
      }, 300); // 300ms tak koi naya message nahi aaya to batch bhej do

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [
      messages,
      user_id,
      chatDetails?.chat_id,
      socket,
      chatDetails,
      timerRef,
      cursor,
      dispatch,
    ]);
    const handler = useMemo(
      () => ({
        [START_TYPING]: () => {
          dispatch(setTyping(true));
        },
        [STOP_TYPING]: () => {
          dispatch(setTyping(false));
        },
        [REFETCH_CHATS]: (data: Message[]) => {
          // logger.log(data, "chats dataaaa.... new wala...");
          if (!data) {
            return;
          }
          refetchChat(dispatch, data, chatDetails?.chat_id);
        },

        [MESSAGE_REACTION]: (data: message_reactions) => {
          if (!data || !user_id) {
            return;
          }
          reactMessage(dispatch, data, chatDetails?.chat_id);
        },
        [MESSAGE_SEEN]: (data: seen_user[]) => {
          if (!data) {
            return;
          }
          seenMessage(dispatch, chatDetails?.chat_id, data);
        },

        [EDIT_MESSAGE]: (data: Message) => {
          logger.log(data, "data from edit message ");
          editMessage(dispatch, chatDetails?.chat_id, data);
        },
      }),
      [dispatch, user_id, chatDetails],
    );

    useSocketEvents(socket, handler);

    return (
      <div
        ref={parentRef}
        className=" relative  p-1 z-10  object-contain bg-no-repeat  hide-scrollbar"
        style={{
          backgroundImage: `url(${url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "83vh",
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
          className={`  relative  mx-auto   `}
        >
          {/* Top Sentinel for Load More */}
          <div
            ref={topSentinelRef}
            style={{
              position: "absolute",
              top: 0,
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
                <div key={virtualItem.index} {...properties}>
                  <div className="flex justify-center">
                    <p className="text-xs p-1 bg-wa-header  dark:bg-wa-header-dark rounded-md">
                      {msg.date}
                    </p>
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
                  ? (messages?.find(
                      (md) => md.id === msg.reply_to_message_id,
                    ) ?? null)
                  : null;

              const isSelected = selectedMessages.includes(msg?.id);

              return (
                <div key={virtualItem.index} {...properties}>
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
