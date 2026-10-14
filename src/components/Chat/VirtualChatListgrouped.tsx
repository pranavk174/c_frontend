"use client";
import {
  ChatItem,
  chatListProps,
  emoji,
  Message,
  MessageItem,
  reaction,
  socketResponse,
} from "@/lib/dummy";
import { MESSAGE_REACTION, START_TYPING, STOP_TYPING } from "@/lib/events";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";
// import { useReactMessageMutation } from "@/redux/Apis/User";
import { chatApi, useGetWallpaperQuery } from "@/redux/Apis/Chat";
import { useVirtualizer } from "@tanstack/react-virtual";

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

const VirtualChatlistGrouped = memo(
  ({
    setMenu,
    // chat_id,
    setSelectedMessages,
    setCursor,
    isFetching,
    data,
    nextCursor,
    hasMore,
    chatDetails,
    selectedMessages,
    messages,
    timerRef,

    emojis,
    // user_id,
    // setShow,

    setReplyMessage,
    // show,
  }: chatListProps) => {
    const { chatSocket: socket, notificationSocket } = useSocket();
    const parentRef = React.useRef<HTMLDivElement | null>(null);
    const [typing, setTyping] = useState<boolean>(false);
    const topSentinelRef = useRef<HTMLDivElement | null>(null);
    const [active, setActive] = useState<number | string | null>(null);
    const rowVirtualizer = useVirtualizer({
      count: data.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 20,
      overscan: 10,
      measureElement: (el) => el.getBoundingClientRect().height,
    });

    const initialScrollDone = useRef(false);

    const {
      chatDetails: { chat_id },
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
        logger.log(user_id);

        const pathResult = dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [chat_id] },
            (draft) => {
              const message = draft.data.getChatById.data.items.find(
                (item: Message) => item.id === msg_id,
              );

              if (!message) return;

              const reaction = message.reactions.find(
                (d: reaction) => d.user_id === user_id,
              );

              if (reaction) {
                reaction.react_id = react_id;
              } else {
                message.reactions.push({
                  user_id,
                  react_id,
                });
              }
            },
          ),
        );

        logger.log(chat_id, "chat_iddddddddd");
        try {
          socket.emit(
            MESSAGE_REACTION,
            {
              chat_ids: [chat_id],
              message_ids: [msg_id],
              react_id,
              reciever_ids: [chatDetails.user_id],
            },
            (response: socketResponse) => {
              // agar backend fail
              if (!response.success) {
                // rollback
                pathResult.undo();

                logger.log(response, "callback response");
              }
              logger.log(response, "callback response outside");
            },
          );

          // await reactMessage({
          //     chat_ids: [chat_id],
          //     message_ids: [msg_id],
          //     react_id,
          // });
        } catch {
          pathResult.undo();
        }
      },
      [chatDetails, user_id, chat_id, dispatch, socket],
    );

    const toggleSelection = useCallback(
      (ids: number) => {
        // debugger;
        setSelectedMessages((prev) => {
          logger.log(
            typeof prev[0],
            "type of fddddd",
            prev,
            prev.includes(ids),
            ids,
          );
          if (prev.includes(ids)) {
            const filtered = prev.filter((item) => item !== ids);

            // if (filtered.length < 1) {
            //   setSelectionMode(false);
            // }

            //   logger.log(filtered, "filteredddddd");
            return filtered;
          }

          return [...prev, ids];
        });
      },
      [setSelectedMessages],
    );

    const handleLongPress = useCallback(() => {
      // logger.log("Long Press Triggered");
      //   setSelected((p) => [...p, id]);
      setMenu(true);
      setSelectionMode(true);
      // toggleSelection(id);
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

    const messageMap = useMemo(() => {
      return new Map(data.map((m: ChatItem) => [m.id, m]));
    }, [data]);

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
          overflow: "auto",
        }}
      >
        <div
          style={{
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

            if (msg.kind === "header") {
              return (
                <div
                  key={virtualItem.index}
                  style={{
                    position: "absolute",
                    top: 80,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  data-index={virtualItem.index}
                  ref={(el) => {
                    if (el) rowVirtualizer.measureElement(el);
                  }}
                >
                  <div className="flex justify-center">
                    <p className="text-xs p-1 bg-wa-header  dark:bg-wa-header-dark rounded-md">
                      {msg.date}
                    </p>
                  </div>
                </div>
              );
            }

            // if (msg.type === "header") {
            //   return (
            //     <div key={msg.id}>
            //       <p>{msg.date}</p>
            //     </div>
            //   );
            // }

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
              // logger.log(msg, "msggggggg");

              const isSelected = selectedMessages.includes(msg?.id);

              return (
                <div
                  key={virtualItem.index}
                  style={{
                    position: "absolute",
                    top: 80,
                    left: 0,
                    width: "100%",
                    // height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  data-index={virtualItem.index}
                  ref={(el) => {
                    if (el) rowVirtualizer.measureElement(el);
                  }}
                >
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
