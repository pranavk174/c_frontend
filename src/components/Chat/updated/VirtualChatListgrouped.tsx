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

// List ke upar encrypted notice ke liye reserved height (px)
const NOTICE_SPACE = 80;

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

      // List ke upar encrypted notice ke liye jagah — ye totalSize mein count hota hai
      paddingStart: NOTICE_SPACE,
      scrollPaddingStart: NOTICE_SPACE,

      // Ye har item ki estimated height pixels mein batata hai.
      // Real height ke kareeb rakho, warna measure hone par content shift hota hai.
      estimateSize: (index) => (data[index]?.kind === "header" ? 32 : 72),

      //Viewport ke upar aur neeche additional items render karne deta hai.
      overscan: 10,

      // measureElement ka default (ResizeObserver) use ho raha hai —
      // content ki height badalne par (image load, reaction) row khud re-measure hoti hai.
    });

    // virtualizer ka current last index (rAF callbacks mein bhi fresh rahe)
    const lastIndex = useCallback(
      () => rowVirtualizer.options.count - 1,
      [rowVirtualizer],
    );

    const [initialScrollDone, setInitialScrollDone] = useState(false);
    // user abhi bottom ke paas hai ya nahi — onScroll mein update hota hai
    const atBottomRef = useRef(true);
    // purane messages load karte waqt jo item screen par tha, uski position
    const prependAnchorRef = useRef<{
      key: string | number;
      offset: number;
      sawFetching: boolean;
    } | null>(null);
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

    const { id: user_id } = useSelector((state: RootState) => state.userSlice);

    // Pehli baar bottom par le jao. Pehla scroll estimated sizes par hota hai,
    // items measure hone ke baad height badalti hai — isliye agle frame mein dobara.
    useLayoutEffect(() => {
      if (initialScrollDone || data.length === 0) return;
      rowVirtualizer.scrollToIndex(lastIndex(), { align: "end" });
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(lastIndex(), { align: "end" });
        raf2 = requestAnimationFrame(() => setInitialScrollDone(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }, [data.length, initialScrollDone, rowVirtualizer, lastIndex]);

    // Purane messages upar add hone ke baad wahi item wapas usi jagah dikhao.
    // Sirf tab chalta hai jab humne load-more trigger kiya ho (anchor set ho)
    // aur woh fetch complete ho gaya ho — naya message / typing isko trigger nahi karta.
    useLayoutEffect(() => {
      const anchor = prependAnchorRef.current;
      if (!anchor) return;
      if (isFetching) {
        anchor.sawFetching = true;
        return;
      }
      if (!anchor.sawFetching) return;
      prependAnchorRef.current = null;

      const idx = data.findIndex((item) => item.id === anchor.key);
      const item = idx >= 0 ? rowVirtualizer.measurementsCache[idx] : undefined;
      if (item) rowVirtualizer.scrollToOffset(item.start - anchor.offset);
    }, [data, isFetching, rowVirtualizer]);

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

    // Load more: jab pehla item (index 0) render range mein aa jaye.
    // overscan ki wajah se ye top se ~10 items pehle hi trigger ho jata hai.
    const firstRenderedIndex = rowVirtualizer.getVirtualItems()[0]?.index;

    useEffect(() => {
      if (
        firstRenderedIndex !== 0 ||
        !initialScrollDone ||
        !hasMore ||
        isFetching ||
        prependAnchorRef.current ||
        nextCursor == null ||
        nextCursor === cursor
      )
        return;

      // jo item abhi viewport ke top par dikh raha hai use anchor bana lo
      const el = parentRef.current;
      const scrollTop = el?.scrollTop ?? 0;
      const visible = rowVirtualizer
        .getVirtualItems()
        .find((item) => item.end > scrollTop);
      if (visible) {
        prependAnchorRef.current = {
          key: visible.key as string | number,
          offset: visible.start - scrollTop,
          sawFetching: false,
        };
      }
      setCursor(nextCursor);
    }, [
      firstRenderedIndex,
      initialScrollDone,
      hasMore,
      isFetching,
      nextCursor,
      cursor,
      setCursor,
      rowVirtualizer,
    ]);

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

    const handleScroll = useCallback(() => {
      const el = parentRef.current;
      if (!el) return;
      atBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    }, []);

    const scrollToBottom = useEffectEvent(() => {
      rowVirtualizer.scrollToIndex(lastIndex(), { align: "end" });
      // naye item ki real height measure hone ke baad dobara end tak
      requestAnimationFrame(() =>
        rowVirtualizer.scrollToIndex(lastIndex(), { align: "end" }),
      );
    });

    // Naya message: apna ho ya user pehle se bottom par tha, tabhi neeche le jao.
    // atBottomRef naye message render hone se PEHLE ki position batata hai.
    const scrollToEndIfNeeded = useEffectEvent(() => {
      const last = messages?.at(-1);
      if (!last || !initialScrollDone) return;
      scrollToBottom();
    });

    useEffect(() => {
      scrollToEndIfNeeded();
    }, [lastMessageId]);

    logger.debug(lastMessageId, "last message id...");

    // Typing indicator aaye to bottom par hone par dikhao, warna wo neeche chhupa rehta hai
    const scrollForTyping = useEffectEvent(() => {
      if (initialScrollDone && atBottomRef.current) scrollToBottom();
    });

    useEffect(() => {
      if (typing) scrollForTyping();
    }, [typing]);

    // pagination wala fetch (cursor set hai) — reconnect refetch par spinner nahi
    const loadingOlder = isFetching && cursor !== null;

    return (
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className=" relative  h-full p-1 z-10  object-contain bg-no-repeat  hide-scrollbar"
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
        >
          {/* Encrypted Notice — paddingStart (NOTICE_SPACE) wali jagah mein */}
          <div className="absolute top-0 inset-x-0 flex justify-center">
            <div className="bg-[#ffeecd] dark:bg-[#182229] text-wa-icon dark:text-[#8696a0] text-xs px-4 py-2 rounded-lg text-center shadow-sm max-w-[60%]">
              <span className="inline-block mr-1">🔒</span>
              Messages and calls are end-to-end encrypted. No one outside of
              this chat, not even WhatsApp, can read or listen to them.
            </div>
          </div>

          {/* absolute — layout shift nahi karta */}
          {loadingOlder && (
            <div className="absolute top-2 inset-x-0 z-20 flex justify-center pointer-events-none">
              <SpinLoader height={"40px"} width={"40px"} />
            </div>
          )}

          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const msg = data[virtualItem.index];

            const properties = {
              style: {
                position: "absolute" as const,
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              },
              "data-index": virtualItem.index,
              // stable ref — har render par naya callback nahi
              ref: rowVirtualizer.measureElement,
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
