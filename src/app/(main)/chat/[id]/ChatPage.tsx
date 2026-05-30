"use client";

import { useState, useRef, useEffect, use, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSelector, UseSelector } from "react-redux";
// import { chatApi } from "../../../../redux/Apis/User";
import { chatApi, useSendMessageMutation } from "@/redux/Apis/Chat";
import { RootState } from "@/redux/store";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";

import {
  Chat,
  Message,
  message_reactions,
  reaction,
  seen_user,
  socketResponse,
} from "@/lib/dummy";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Modal from "@/components/HOComponents/Modal";
import {
  useGetAllChatsQuery,
  useGetEmojisQuery,
  useGetSingleChatQuery,
} from "@/redux/Apis/Chat";
import { current } from "@reduxjs/toolkit";
import { useSocket } from "@/layouts/SocketWrapper";
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  MESSAGE_REACTION,
  MESSAGE_SEEN,
  NEW_MESSAGE,
  ONLINE_USERS,
  REFETCH_CHATS,
  REPLY_MESSAGE,
  SEND_MESSAGE,
} from "@/lib/events";
// import Chatlist from "@/components/Chat/Chatlist";
import Chatlist from "@/components/Chat/Chatlist";
import Inputbox from "@/components/Chat/Inputbox";
import DeleteMessage from "@/components/ModalChilds/DeleteMessage";
import Chathead from "@/components/Chat/Chathead";
import { useToast } from "@/components/Utility/Toast";

interface mediaProps {
  file_name: string;
  url: string;
  file_type: string;
  file_size: string;
}

type emoji = {
  react_id: number;
  emoji: string;
};

const ChatPage = ({ id }: { id: number }) => {
  // const resolvedParams = use(params);
  const { showToast } = useToast();
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const { data: chatDetails } = useGetAllChatsQuery(
    {},
    {
      selectFromResult: ({ data, isLoading, isSuccess }) => {
        // console.log(typeof id, "type of ...", id)
        return {
          data: data?.data?.getAllChats?.data?.items?.filter(
            (item: Chat) => item.chat_id === id,
          )[0],
          isLoading,
          isSuccess,
        };
      },
    },
  );
  const [sendMessage] = useSendMessageMutation();
  const [show, setShow] = useState<number | string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);

  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  const {
    data: messages,
    isLoading,
    isFetching,
    nextCursor,
    hasMore,
  } = useGetSingleChatQuery(
    { chat_ids: [id], cursor, limit: 20 },
    {
      selectFromResult: ({ data, isLoading, isSuccess, isFetching }) => {
        return {
          data: data?.data?.getChatById?.data?.items,
          nextCursor: data?.data?.getChatById?.data?.nextCursor,
          hasMore: data?.data?.getChatById?.data?.hasMore,
          isLoading,
          isSuccess,
          isFetching,
        };
      },
      refetchOnMountOrArgChange: true,
    },
  );

  // const [messages, setMessages] = useState<Message[]>(data || []);

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

  useEffect(() => {
    if (messages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      // setMessages(data);
    }
  }, [messages]);

  // console.log(cursor, "cursorrrrr....")

  // console.log(emojis, "emojissssssss", chatDetails);

  //   console.log(data, "chat data is message");

  // const chatId = resolvedParams.id;
  const chat = messages;
  const socket = useSocket();

  const [active, setActive] = useState<number | string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number[] | []>([]);
  const [menu, setMenu] = useState(false);
  const [inputText, setInputText] = useState("");
  // console.log(messages, "messagessss");
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  const dispatch = useAppDispatch();

  const bottomRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          // console.log(entries, "entriesssssssss");
          setCursor(() => nextCursor);
        }
      },
      {
        rootMargin: "500px",
        threshold: 0,
      },
    );

    if (bottomRef.current) observer.observe(bottomRef.current);

    //  console.log("= data =================")
    return () => observer.disconnect();
  }, [messages, nextCursor, hasMore, isFetching]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, nextCursor]);

  // useSocketEvents(socket, handler);
  const [showModal, setShowModal] = useState<boolean>(false);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent | mediaProps) => {
      if ("preventDefault" in e) {
        console.log("gotr issueeee");
        e.preventDefault();
      } else if ((!e.url && !inputText.trim()) || !socket) {
        return;
      }

      // if (!inputText.trim() || !socket) return;

      // console.log(e, "medoiaaaaaaaaa");

      // console.log(chatDetails, "chat detaillssssss", chatDetails);
      const newMessage = {
        chat_ids: [id],
        content: inputText,
        media: "preventDefault" in e ? [] : [e],
        reciever_ids: [chatDetails.user_id],
        message_ids: [replyMessage?.id],
      };

      let patchResult = null;
      let chatPatchResult = null;
      if ("preventDefault" in e) {
        patchResult = dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [id] },
            (draft) => {
              const items = draft?.data?.getChatById?.data?.items;

              if (!items) return;

              items.push({
                id: (items[items.length - 1]?.id || 0) + 1,
                sender_id: user_id ?? 2,
                created_at: new Date().toISOString(),
                seen_at: null,
                story_id: null,
                seen_users: [],
                content: inputText,
                preview: null,
                reply_to_message_id: replyMessage?.id ?? null,
                is_forwarded: false,
                is_edited: false,
                is_deleted: false,
                reactions: [],
                isLocal: true,
              });
              // update existing
            },
          ),
        );
        chatPatchResult = dispatch(
          chatApi.util.updateQueryData("getAllChats", {}, (draft) => {
            const items = draft.data.getAllChats.data.items;
            draft.data.getAllChats.data.items.forEach((item: Chat) => {
              if (item.chat_id === id) {
                item.last_message = inputText;
                item.last_message_at = new Date().toISOString();
                item.last_message_id = (items[items.length - 1]?.id || 0) + 1;
              }
            });
          }),
        );
      }

      try {
        if (replyMessage !== null) {
          socket.emit(REPLY_MESSAGE, newMessage, (response: socketResponse) => {
            // agar backend fail
            if (!response.success) {
              // rollback
              patchResult?.undo();

              chatPatchResult?.undo();

              console.log(response, "callback response");
            }
            console.log(response, "callback response outside");
          });
          console.log("messege repliy sent...");

          // await replyToMessage(newMessage).unwrap();
          setReplyMessage(null);
        } else {
          socket.emit(SEND_MESSAGE, newMessage, (response: socketResponse) => {
            // agar backend fail
            if (!response.success) {
              // rollback
              patchResult?.undo();

              console.log(response, "callback response");
            }
            console.log(response, "callback response outside");
          });
          console.log("messege sent...");
          // await sendMessage(newMessage);
        }

        scrollToBottom();
      } catch (error) {
        // showToast("error some thin went wrong", "error")

        console.log(error, "error in sending message");
      }

      // setMessages([...messages, newMessage]);
      setInputText("");
    },
    [
      id,
      setInputText,
      dispatch,
      replyMessage,
      inputText,
      chatDetails,
      socket,
      scrollToBottom,
      user_id,
    ],
  );

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string>("");
  const [currentChunk, setCurrentChunk] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const CHUNK_SIZE = 1024 * 1024;
  const pausedRef = useRef(false);

  const uploadChunks = useCallback(
    async (id: string) => {
      try {
        if (!file) return;
        const totalChunk = Math.ceil(file.size / CHUNK_SIZE);

        for (let i = currentChunk; i < totalChunk; i++) {
          if (pausedRef.current === true) {
            return;
          }

          const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          //  console.log();
          const form = new FormData();
          form.append("uploadId", id);
          form.append("chunk", chunk);
          form.append("index", i.toString());

          await fetch(
            `${process.env.NEXT_PUBLIC_DOMAIN}/api/upload/upload`,
            {
              method: "POST",
              body: form,
              signal: controllerRef.current?.signal,
            },
          );
          setCurrentChunk(i + 1);
          setProgress(Math.round(((i + 1) / totalChunk) * 100));
        }

        const done = await fetch(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/upload/finish`,
          {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
              uploadId: id,
              extension: file.name.split(".").pop(),
            }),
          },
        );

        if (done.ok) {
          const result = await done.json();

          const media = {
            file_name: "imagefile",
            url: result.data.url,
            file_type: result.data.resource_type,
            file_size: result.data.bytes.toString(),
          };

          handleSendMessage(media);

          console.log(result);
          // alert("upload completed");
        } else {
          alert("error in uploading");
        }
      } catch (error) {
        // alert("error in uploading");
        console.log(error, "error in uploaddd.");
        showToast("error in uploading", "error");
        // setMessages((prev) =>
        //   prev.filter((p) => p.id !== prev[prev.length - 1].id),
        // );
        dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [id] },
            (draft) => {
              const items = draft?.data?.getChatById?.data?.items;

              if (!items) return;
              draft.data.getChatById.data.items = items.filter(
                (p: Message) => p.id !== items[items.length - 1].id,
              );
              // items.filter((p) => p.id !== items[items.length - 1].id);
              // update existing
            },
          ),
        );
      } finally {
        setProgress(0);
        setInputText("");
        setUploadId("");
        setCurrentChunk(0);
        setFile(null);
        // setMessages(prev => prev.filter(pf => pf.id !== prev[prev.length - 1].id))
      }
    },
    [file, CHUNK_SIZE, currentChunk, showToast, handleSendMessage, dispatch],
  );
  const startUpload = useCallback(async () => {
    if (!file || currentChunk > 0) return;

    // console.log(inputText, "input test/.....")

    // setMessages((prev) => [
    //   ...prev,
    //   {
    //     id: (prev[prev.length - 1]?.id || 0) + 1,
    //     sender_id: user_id ?? 2,
    //     created_at: new Date().toISOString(),
    //     seen_at: null,
    //     story_id: null,
    //     content: inputText,
    //     preview: URL.createObjectURL(file),
    //     reply_to_message_id: replyMessage?.id ?? null,
    //     is_forwarded: false,
    //     seen_users: [],
    //     is_edited: false,
    //     is_deleted: false,
    //     reactions: [],
    //     isLocal: true,
    //   },
    // ]);

    const pathResult = dispatch(
      chatApi.util.updateQueryData(
        "getSingleChat",
        { chat_ids: [id] },
        (draft) => {
          const items = draft?.data?.getChatById?.data?.items;

          if (!items) return;

          items.push({
            id: (items[items.length - 1]?.id || 0) + 1,
            sender_id: user_id ?? 2,
            created_at: new Date().toISOString(),
            seen_at: null,
            story_id: null,
            content: inputText,
            preview: URL.createObjectURL(file),
            reply_to_message_id: replyMessage?.id ?? null,
            is_forwarded: false,
            seen_users: [],
            is_edited: false,
            is_deleted: false,
            reactions: [],
            isLocal: true,
          });
          // update existing
        },
      ),
    );

    // console.log(messages, "messageeeeeeee", inputText)

    try {
      controllerRef.current = new AbortController();
      const upload = await fetch(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/upload/start`,
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
        },
      );

      const data = await upload.json();
      console.log(data, "data....");
      const uid = data.uploadId;
      setUploadId(uid);

      uploadChunks(uid);
    } catch (error) {
      pathResult.undo();
    }
  }, [
    currentChunk,
    dispatch,
    file,
    // setMessages,
    id,
    user_id,
    uploadChunks,
    inputText,
    replyMessage?.id,
  ]);

  useEffect(() => {
    socket.onAny((event, ...args) => {
      console.log("ANY EVENT:", event, args);
    });
  }, [socket]);

  const cancelUpload = useCallback(async () => {
    controllerRef.current?.abort();

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/upload/cancel`,
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            uploadId: uploadId,
          }),
        },
      );

      setProgress(0);
      setCurrentChunk(0);
      setUploadId("");
      if (res.ok) {
        return "success";
      }
    } catch (error) {
      //  console.log(error, "errorrrrr");
    }
  }, [uploadId]);

  const handler = useMemo(
    () => ({
      [REFETCH_CHATS]: (data: Message[]) => {
        console.log(data, "chats dataaaa.... new wala...");
        if (!data) {
          return;
        }
        const patchResult = dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [id] },
            (draft) => {
              const items = draft?.data?.getChatById?.data?.items;

              if (!items) return;

              const exists = items.find((m: Message) => m?.id === data[0].id);

              // update existing
              if (exists) {
                console.log("triggered here and exitsssss");
                draft.data.getChatById.data.items = items.map((m: Message) => {
                  if (m?.id === data[0].id) {
                    return { ...m, ...data[0], isLocal: false };
                  }

                  return m;
                });

                return;
              }

              // add new
              draft.data.getChatById.data.items.push(...data);

              const unseenNewMessages = draft.data.getChatById.data.items
                .filter(
                  (m: Message) =>
                    m.sender_id !== user_id &&
                    (!m.seen_users || m.seen_users.length === 0),
                )
                .map((m: Message) => m.id);

              // console.log(
              //   unseenNewMessages,
              //   " <<<<====in reftech message unseen new messagessssssss===>>>>",
              // );

              if (unseenNewMessages.length > 0) {
                // console.log("eejhkdsahf kdfdthis unseeed message");
                socket.emit(
                  MESSAGE_SEEN,
                  {
                    chat_id: id,
                    message_ids: unseenNewMessages,
                    reciever_id: chatDetails?.user_id,
                  },
                  (response: socketResponse) => {
                    // agar backend fail
                    if (!response.success) {
                      // rollback
                      patchResult?.undo();

                      console.log(response, "callback response");
                    }
                    console.log(response, "callback response outside");
                  },
                );
              }
            },
          ),
        );
        const chatPatchResult = dispatch(
          chatApi.util.updateQueryData("getAllChats", {}, (draft) => {
            const items = draft.data.getAllChats.data.items;
            draft.data.getAllChats.data.items.forEach((item: Chat) => {
              if (item.chat_id === id) {
                item.last_message = data[0]?.content
                  ? data[0]?.content
                  : "image";
                item.last_message_at = data[0].created_at;
                item.last_message_id = data[0].id;
              }
            });
          }),
        );
      },

      // [NEW_MESSAGE]: (data: Message[]) => {
      //   console.log(data, "chats dataaaa....  reciever k liye wala...");
      //   if (!data) {
      //     return;
      //   }
      //   dispatch(
      //     chatApi.util.updateQueryData(
      //       "getSingleChat",
      //       { chat_ids: [id] },
      //       (draft) => {
      //         // console.log(draft.data, "draft dataaaa...", data);
      //         const exists = draft.data.getChatById.data.items.find(
      //           (m: Message) => m.id === data[0].id,
      //         );
      //         if (exists) {
      //           const exists = draft.data.getChatById.data.items.map(
      //             (m: Message) => {
      //               if (m.id === data[0].id) {
      //                 return { ...m, ...data[0] };
      //               }
      //             },
      //           );
      //           return exists;
      //         }
      //         if (!exists) {
      //           // console.log("pushed new chat....", data);
      //           draft.data.getChatById.data.items.push(...data);
      //         }

      //         const unseenNewMessages = messages
      //           .filter(
      //             (m: Message) =>
      //               m.sender_id !== user_id &&
      //               (!m.seen_users || m.seen_users.length === 0),
      //           )
      //           .map((m: Message) => m.id);

      //         console.log(
      //           unseenNewMessages,
      //           "<<<<===unseen new messagessssssss===>>>>",
      //         );

      //         if (unseenNewMessages.length > 0) {
      //           console.log("eejhkdsahf kdfdthis unseeed message");
      //           socket.emit(MESSAGE_SEEN, {
      //             chat_id: id,
      //             message_ids: unseenNewMessages,
      //             reciever_id: chatDetails?.user_id,
      //           });
      //         }
      //       },
      //     ),
      //   );
      // },
      [MESSAGE_REACTION]: (data: message_reactions) => {
        if (!data) {
          return;
        }
        const patchResult = dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [id] },
            (draft) => {
              const message = draft?.data?.getChatById?.data?.items?.find(
                (m: Message) => m?.id === data.message_id,
              );

              if (message) {
                const exists = message?.reactions?.find(
                  (i: reaction) => i.user_id === data.user_id,
                );
                if (exists) {
                  message.reactions.map((i: reaction) => {
                    if (i.user_id === data.user_id) {
                      i.react_id = data.react_id;
                    }
                  });
                } else {
                  message.reactions.push(data);
                }
              }
            },
          ),
        );

        console.log("dataaaaa  in reaction", data);
      },
      [MESSAGE_SEEN]: (data: seen_user[]) => {
        if (!data) {
          return;
        }

        const pathResult = dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [id] },
            (draft) => {
              const seenMap = new Map(data.map((d) => [d.message_id, d]));

              draft.data.getChatById.data.items.forEach((message: Message) => {
                const seenData = seenMap.get(message.id);

                // console.log(seenData, "seen dataaaa.", seenMap);
                if (!seenData) return;

                message.seen_users = message.seen_users || [];

                if (!message.seen_users.includes(seenData.seen_user)) {
                  message.seen_users = [
                    ...message.seen_users,
                    seenData.seen_user,
                  ];
                }

                message.seen_at = seenData.seen_at;
              });

              // console.log(
              //   current(draft.data.getChatById.data.items),
              //   "latest updated dataaaaaaaa",
              // );
            },
          ),
        );
      },
    }),
    [dispatch, id, socket, user_id, chatDetails],
  );

  // console.log(onlineUsers, "onlineUserssssss");

  useSocketEvents(socket, handler);

  useEffect(() => {
    if (user_id) {
      socket.emit(
        CHAT_JOINED,
        {
          chat_id: id,

          user_id,
        },
        (response: socketResponse) => {
          console.log(response, "chat join response....");
        },
      );
    }

    return () => {
      if (user_id) {
        socket.emit(
          CHAT_LEAVED,
          { chat_id: id, user_id, socketId: socket.id },
          (response: socketResponse) => {
            console.log(response, "chat leave response....");
          },
        );
      }
    };
  }, [user_id, socket, id]);

  const throttleRef = useRef(false);

  useEffect(() => {
    if (!user_id || !messages?.length || throttleRef.current) return;

    const unseenMessages = messages
      .filter(
        (d: Message) => d.seen_users?.length === 0 && d?.sender_id !== user_id,
      )
      .map((d: Message) => d.id);

    console.log(unseenMessages, "un seend is useEffect are....", messages);
    if (!unseenMessages.length) return;

    throttleRef.current = true;

    socket.emit(
      MESSAGE_SEEN,
      {
        chat_id: id,
        message_ids: unseenMessages,
        reciever_id: chatDetails?.user_id,
      },
      (response: socketResponse) => {
        // agar backend fail
        if (!response.success) {
          // rollback
          // patchResult?.undo();

          console.log(response, "callback response");
        }
        console.log(response, "callback response outside");
      },
    );

    const timer = setTimeout(() => {
      throttleRef.current = false;
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, user_id, id, socket, chatDetails]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Chat not found
      </div>
    );
  }

  // console.log(chat, "chat detaillssss.");

  return (
    <div className="flex flex-col h-full w-full chat-bg relative">
      {/* Header */}

      <Chathead
        menu={menu}
        setShowModal={setShowModal}
        chatDetails={chatDetails}
      />

      <Chatlist
        setSelectedMessages={setSelectedMessages}
        setCursor={setCursor}
        setSelected={setSelected}
        isFetching={isFetching}
        data={messages}
        nextCursor={nextCursor}
        hasMore={hasMore}
        setMenu={setMenu}
        selectedMessages={selectedMessages}
        pausedRef={pausedRef}
        progress={progress}
        uploadChunks={uploadChunks}
        cancelUpload={cancelUpload}
        startUpload={startUpload}
        timerRef={timerRef}
        setActive={setActive}
        emojis={emojis}
        chat_id={id}
        user_id={user_id}
        messages={messages}
        setShow={setShow}
        // setMessages={setMessages}
        active={active}
        // file={file}
        setReplyMessage={setReplyMessage}
        uploadId={uploadId}
        setFile={setFile}
        show={show}
        menu={menu}
        chatDetails={chatDetails}
      />

      {/* Input */}

      <Inputbox
        chatDetails={chatDetails}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        setFile={setFile}
        setInputText={setInputText}
        inputText={inputText}
        file={file}
        handleSendMessage={handleSendMessage}
        // setMessages={setMessages}
        scrollToBottom={scrollToBottom}
        chat_id={id}
        pausedRef={pausedRef}
        progress={progress}
        uploadId={uploadId}
        uploadChunks={uploadChunks}
        cancelUpload={cancelUpload}
        startUpload={startUpload}
      />

      <Modal open={showModal} setOpen={setShowModal}>
        <DeleteMessage
          setShowModal={setShowModal}
          setSelected={setSelected}
          setSelectedMessages={setSelectedMessages}
          selectedMessages={selectedMessages}
          chat_id={id}
        />
      </Modal>
    </div>
  );
};

export default ChatPage;
