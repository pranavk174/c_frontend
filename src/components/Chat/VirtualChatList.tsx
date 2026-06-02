"use client";
import { Chat, Message, reaction, socketResponse } from "@/lib/dummy";
import { MESSAGE_REACTION, REFETCH_CHATS } from "@/lib/events";
import { useAppDispatch } from "@/lib/hooks";
import { cn } from "@/lib/utils";
// import { useReactMessageMutation } from "@/redux/Apis/User";
import { chatApi, useGetWallpaperQuery, useReactMessageMutation } from "@/redux/Apis/Chat";
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, useReducedMotion } from "framer-motion";

import React, {
    Dispatch,
    memo,
    RefObject,
    SetStateAction,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import Messages from "./Messages";
import { useSocket } from "@/layouts/SocketWrapper";
import SpinLoader from "../Utility/SpinLoader";
type emoji = {
    react_id: number;
    emoji: string;
};

interface chatListProps {
    menu: boolean;
    setMenu: Dispatch<SetStateAction<boolean>>;
    chat_id: number;
    chatDetails: Chat;
    setSelectedMessages: Dispatch<SetStateAction<number[]>>;
    setCursor: Dispatch<SetStateAction<number | null>>;
    setSelected: Dispatch<SetStateAction<number[]>>;
    hasMore: boolean;
    setShow: Dispatch<SetStateAction<string | number | null>>;
    setActive: Dispatch<SetStateAction<string | number | null>>;
    emojis: emoji[];
    show: string | number | null;
    nextCursor: number;
    timerRef: RefObject<NodeJS.Timeout | null>;
    setReplyMessage: Dispatch<SetStateAction<Message | null>>;
    data: Message[];
    active: string | number | null;
    isFetching: boolean;
    selectedMessages: number[];
    user_id: number | null;

    startUpload: () => Promise<void>;
    cancelUpload: () => Promise<"success" | undefined>;
    uploadChunks: (id: string) => Promise<void>;
    // setMessages?: Dispatch<SetStateAction<Message[]>>;
    messages: Message[];
    pausedRef: React.RefObject<boolean>;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    progress: number;
    uploadId: string;
}
const VirtualChatlist = memo(
    ({
        startUpload,
        cancelUpload,
        // setMessages,
        setFile,
        uploadChunks,
        pausedRef,
        progress,
        uploadId,
        setMenu,
        chat_id,
        setSelectedMessages,
        setCursor,
        setSelected,
        isFetching,
        data,
        nextCursor,
        hasMore,
        chatDetails,
        selectedMessages,
        timerRef,
        setActive,
        emojis,
        user_id,
        setShow,
        active,
        setReplyMessage,
        show,
    }: chatListProps) => {
        const socket = useSocket();
        const parentRef = React.useRef<HTMLDivElement | null>(null)
        const topSentinelRef = useRef<HTMLDivElement | null>(null);


        const rowVirtualizer = useVirtualizer({
            count: data.length,
            getScrollElement: () => parentRef.current,
            estimateSize: () => 35,
            overscan: 10,
            measureElement: (el) => el.getBoundingClientRect().height,

        })

        const initialScrollDone = useRef(false);

        const hasMountedRef = useRef(false);

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
        // const messagesEndRef = useRef<HTMLDivElement>(null);
        // const scrollToBottom = () => {
        //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        // };


        const { url } = useGetWallpaperQuery(null, {
            selectFromResult: ({ data, isLoading }) => {
                return {
                    url: data?.data?.getWallPaper?.data?.url,
                    isLoading
                }
            }
        })

        const dispatch = useAppDispatch();

        useEffect(() => {
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !isFetching && initialScrollDone.current) {
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



        const handleLike = async (msg_id: number, react_id: number) => {
            console.log(user_id);

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

            console.log(chat_id, "chat_iddddddddd");
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

                            console.log(response, "callback response");
                        }
                        console.log(response, "callback response outside");
                    },
                );

                // await reactMessage({
                //     chat_ids: [chat_id],
                //     message_ids: [msg_id],
                //     react_id,
                // });
            } catch (error) {
                pathResult.undo();
            }
        };
        const toggleSelection = (ids: number) => {
            // debugger;
            setSelectedMessages((prev) => {
                console.log(
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

                    console.log(filtered, "filteredddddd");
                    return filtered;
                }

                return [...prev, ids];
            });
        };

        const handleLongPress = (id: number) => {
            // console.log("Long Press Triggered");
            setSelected((p) => [...p, id]);
            setMenu(true);
            setSelectionMode(true);
            // toggleSelection(id);
        };

        const startPressTimer = (id: number) => {
            timerRef.current = setTimeout(() => {
                handleLongPress(id);

                //
            }, 500); // 500ms
        };

        const cancelPressTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };






        return (
            <div

                ref={parentRef}


                className=" relative  p-1 z-10  object-contain bg-no-repeat  hide-scrollbar" style={{
                    backgroundImage: `url(${url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    height: "83vh",
                    overflow: "auto",
                }}>
                <div


                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                    className={`  relative  mx-auto   `}
                >
                    {/* Top Sentinel for Load More */}
                    <div ref={topSentinelRef} style={{ position: 'absolute', top: 0, height: '1px', width: '100%' }} />

                    {/* Encrypted Notice */}


                    <div className="flex relative justify-center mb-4" >

                        <div className="bg-[#ffeecd] dark:bg-[#182229] text-wa-icon dark:text-[#8696a0] text-xs px-4 py-2 rounded-lg text-center shadow-sm max-w-[60%]">
                            <span className="inline-block mr-1">🔒</span>
                            Messages and calls are end-to-end encrypted. No one outside of
                            this chat, not even WhatsApp, can read or listen to them.
                        </div>
                    </div>

                    {isFetching && <div className="h-50 w-full flex justify-center ">
                        <SpinLoader height={"40px"} width={"40px"} />
                    </div>
                    }


                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {

                        const msg = data[virtualItem.index];


                        const icons = emojis?.filter((emoji: emoji) =>
                            msg?.reactions?.some((em) => em.react_id === emoji.react_id),
                        );

                        const isSelected = selectedMessages.includes(msg?.id);

                        return (

                            <motion.div
                                // key={msg?.id}
                                key={virtualItem.index}
                                style={{
                                    position: 'absolute',
                                    top: 80,
                                    left: 0,
                                    width: '100%',
                                    // height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                                data-index={virtualItem.index}
                                ref={(el) => {
                                    if (el) rowVirtualizer.measureElement(el);
                                }}

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
                                    "group relative flex items-center  px-2 py-0.5 justify-end transition-all duration-200",

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
                                        {isSelected && (
                                            <span className="text-white text-[10px]">✓</span>
                                        )}
                                    </div>
                                )}

                                {/* Message Actions */}
                                <div
                                    className={cn(
                                        "flex items-center gap-2 mx-2 transition-opacity duration-200",
                                        active === msg?.id ? "opacity-100" : "opacity-0",
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

                                                    console.log(msg?.id, "messgae id ", em.react_id);
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
                                    {
                                        msg && <Messages
                                            msg={msg}
                                            pausedRef={pausedRef}

                                            progress={progress}
                                            uploadId={uploadId}
                                            uploadChunks={uploadChunks}
                                            chatDetails={chatDetails}
                                            cancelUpload={cancelUpload}

                                            user_id={user_id}
                                            data={data}
                                            emojis={icons}
                                            setReplyMessage={setReplyMessage}
                                        />
                                    }

                                </div>
                            </motion.div>
                        );
                    })}


                </div>
            </div>
        );
    },
);

VirtualChatlist.displayName = "Virtualchatlist";
export default VirtualChatlist;
