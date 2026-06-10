"use client";

import {
  useState,
  useRef,
  useEffect,
  Suspense,
  useMemo,
  useCallback,
} from "react";

import dynamic from "next/dynamic";
const VirtualChatlist = dynamic(
  () => import("@/components/Chat/VirtualChatList"),
);
import { useSelector } from "react-redux";
// import { chatApi } from "../../../../redux/Apis/User";
import { chatApi } from "@/redux/Apis/Chat";
import { RootState } from "@/redux/store";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";

import {
  Chat,
  Message,
  message_reactions,
  seen_user,
  socketResponse,
  valueProps,
} from "@/lib/dummy";

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
  EDIT_MESSAGE,
  MESSAGE_REACTION,
  MESSAGE_SEEN,
  REFETCH_CHATS,
  REPLY_MESSAGE,
  SEND_MESSAGE,
} from "@/lib/events";

// import VirtualChatlist from "@/components/Chat/VirtualChatList";

import Inputbox from "@/components/Chat/Inputbox";
import DeleteMessage from "@/components/ModalChilds/DeleteMessage";
import Chathead from "@/components/Chat/Chathead";
import { useToast } from "@/components/Utility/Toast";
import SpinLoader from "@/components/Utility/SpinLoader";
import {
  addMessage,
  editMessage,
  reactMessage,
  refetchChat,
  seenMessage,
  updateAllChatcache,
} from "@/lib/cacaheupdateutils";
import Loader from "@/components/Utility/Loader";
import VirtualChatlistGrouped from "@/components/Chat/VirtualChatListgrouped";

interface mediaProps {
  file_name: string;
  url: string;
  file_type: string;
  file_size: string;
}

const ChatPage = ({ id }: { id: number }) => {
  const [show, setShow] = useState<number | string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string>("");
  const [currentChunk, setCurrentChunk] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const CHUNK_SIZE = 1024 * 1024;
  const pausedRef = useRef(false);

  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);

  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<valueProps>({
    open: false,
    type: null,
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const throttleRef = useRef(false);

  const socket = useSocket();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number[] | null>([]);
  const [menu, setMenu] = useState(false);
  const [inputText, setInputText] = useState("");
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

  const {
    data: messages,
    groupedMessages,
    mappedMessages,
    isLoading,
    isFetching,
    nextCursor,
    hasMore,
  } = useGetSingleChatQuery(
    { chat_ids: [id], cursor, limit: 20 },
    {
      selectFromResult: ({ data, isLoading, isSuccess, isFetching }) => {
        // const res = new Map();
        const result =
          data?.data?.getChatById?.data?.items.reduce(
            (acc: Record<string, Message[]>, idx: Message) => {
              const date = new Date(Number(idx.created_at));

              const today = new Date();
              const yesterday = new Date();
              yesterday.setDate(today.getDate() - 1);

              let key = "";

              if (date.toDateString() === today.toDateString()) {
                key = "Today";
              } else if (date.toDateString() === yesterday.toDateString()) {
                key = "Yesterday";
              } else {
                key = date.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
              }

              if (!acc[key]) {
                acc[key] = [];
              }

              acc[key].push(idx);

              return acc;
            },
            {} as Record<string, Message[]>,
          ) ?? [];

        // console.log("result daataaa.", result);
        const flatData = Object.entries(result)?.flatMap(
          ([date, messagess]) => [
            { type: "header", date, id: crypto.randomUUID() },
            ...messagess?.map((msg: Message) => ({
              type: "message",
              ...msg,
            })),
          ],
        );

        // console.log(flatData, "result daataaa.", result);

        const mappedMessages = new Map(
          data?.data?.getChatById?.data?.items.map((m: Message) => [m.id, m]),
        );

        return {
          data: data?.data?.getChatById?.data?.items,
          groupedMessages: flatData,
          mappedMessages,
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

  // const chat = messages;

  // console.log(messages, "messagessss");
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, nextCursor]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent | mediaProps) => {
      if ("preventDefault" in e) {
        console.log("gotr issueeee");
        e.preventDefault();
      } else if ((!e.url && !inputText.trim()) || !socket) {
        return;
      }
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
            addMessage(inputText, user_id ?? 2, replyMessage),
          ),
        );
        chatPatchResult = dispatch(
          chatApi.util.updateQueryData(
            "getAllChats",
            {},
            updateAllChatcache(id, inputText),
          ),
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
              chatPatchResult?.undo();
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

      dispatch,
      replyMessage,
      inputText,
      chatDetails,
      socket,
      scrollToBottom,
      user_id,
    ],
  );

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
            `${process.env.NEXT_PUBLIC_DOMAIN + ":" + process.env.NEXT_PUBLIC_SELF_PORT}/api/upload/upload`,
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
          `${process.env.NEXT_PUBLIC_DOMAIN + ":" + process.env.NEXT_PUBLIC_SELF_PORT}/api/upload/finish`,
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
      }
      setProgress(0);
      setInputText("");
      setUploadId("");
      setCurrentChunk(0);
      setFile(null);
      // setMessages(prev => prev.filter(pf => pf.id !== prev[prev.length - 1].id))
    },
    [file, CHUNK_SIZE, currentChunk, showToast, handleSendMessage, dispatch],
  );
  const startUpload = useCallback(async () => {
    if (!file || currentChunk > 0 || !user_id) return;

    const url = URL.createObjectURL(file);

    const pathResult = dispatch(
      chatApi.util.updateQueryData(
        "getSingleChat",
        { chat_ids: [id] },
        addMessage(inputText, user_id, replyMessage, url),
      ),
    );

    // console.log(messages, "messageeeeeeee", inputText)

    try {
      controllerRef.current = new AbortController();
      const upload = await fetch(
        `${process.env.NEXT_PUBLIC_DOMAIN + ":" + process.env.NEXT_PUBLIC_SELF_PORT}/api/upload/start`,
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
    replyMessage,
    id,
    user_id,
    uploadChunks,
    inputText,
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
        // console.log(data, "chats dataaaa.... new wala...");
        if (!data) {
          return;
        }
        if (!user_id) return;
        refetchChat(dispatch, data, id, user_id, chatDetails, socket, cursor);
      },

      [MESSAGE_REACTION]: (data: message_reactions) => {
        if (!data || !user_id) {
          return;
        }
        reactMessage(dispatch, data, id);
      },
      [MESSAGE_SEEN]: (data: seen_user[]) => {
        if (!data) {
          return;
        }
        seenMessage(dispatch, id, data);
      },

      [EDIT_MESSAGE]: (data: Message) => {
        console.log(data, "data from edit message ");
        editMessage(dispatch, id, data);
      },
    }),
    [dispatch, id, socket, user_id, chatDetails, cursor],
  );

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

  useEffect(() => {
    if (!user_id || !messages?.length || throttleRef.current) return;

    const unseenMessages = messages
      .filter(
        (d: Message) => d.seen_users?.length === 0 && d?.sender_id !== user_id,
      )
      .map((d: Message) => d.id);

    if (!unseenMessages.length) return;
    console.log(unseenMessages, "un seend is useEffect are....", messages);
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

        if (response.success) {
          // rollback
          dispatch(
            chatApi.util.updateQueryData(
              "getSingleChat",
              { chat_ids: [id], cursor, limit: 20 },
              (draft) => {
                draft?.data?.getChatById?.data?.items?.forEach(
                  (chat: Message) => {
                    if (
                      chat.sender_id !== user_id &&
                      !chat.seen_users.includes(user_id) &&
                      unseenMessages.includes(chat.id)
                    ) {
                      console.log("ye condition true hai");
                      chat.seen_users = [...chat.seen_users, user_id];
                    }
                    console.log("ye condition false hai......");
                  },
                );
              },
            ),
          );

          dispatch(
            chatApi.util.updateQueryData("getAllChats", {}, (draft) => {
              const item = draft.data.getAllChats.data.items.find(
                (c: Chat) => c.chat_id === id,
              );

              if (item) {
                item.unread_count -= unseenMessages;
              }
            }),
          );

          // dispatch(NotificationApi.util.updateQueryData("getNotifications", {}, (draft) => {

          // }))

          // patchResult?.undo();

          console.log(response, "callback response in seen message", response);
        }
        console.log(response, "callback response outside");
      },
    );

    const timer = setTimeout(() => {
      throttleRef.current = false;
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, user_id, id, socket, chatDetails, cursor, dispatch]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center">
        <SpinLoader height={"100px"} width={"100px"} />
        Chats Loading...
      </div>
    );
  }

  if (!messages) {
    return (
      <div className="flex-1 h-screen flex items-center font-bold text-xl uppercase justify-center text-gray-500">
        Chat not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full chat-bg relative">
      {/* Header */}

      <Chathead
        menu={menu}
        setShowModal={setShowModal}
        selected={{
          message: messages.find(
            (msg: Message) => msg.id === selectedMessages[0],
          )?.content,
          sender_id: messages.find(
            (msg: Message) => msg.id === selectedMessages[0],
          )?.sender_id,
          id: messages.find((msg: Message) => msg.id === selectedMessages[0])
            ?.id,
        }}
        selectedMessages={selectedMessages}
        chatDetails={chatDetails}
      />

      <Suspense
        fallback={
          <div className="h-screen w-full flex  justify-center items-center">
            <SpinLoader height={"50px"} width={"50px"} />
          </div>
        }
      >
        <VirtualChatlistGrouped
          setSelectedMessages={setSelectedMessages}
          setCursor={setCursor}
          setSelected={setSelected}
          isFetching={isFetching}
          data={groupedMessages}
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
          // setActive={setActive}
          emojis={emojis}
          chat_id={id}
          user_id={user_id}
          // messages={groupedMessages}
          setShow={setShow}
          // setMessages={setMessages}
          // active={active}
          // file={file}
          setReplyMessage={setReplyMessage}
          uploadId={uploadId}
          setFile={setFile}
          show={show}
          menu={menu}
          chatDetails={chatDetails}
        />
      </Suspense>

      {/* <VirtualChatlist /> */}

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

      <Modal values={showModal} setModal={setShowModal}>
        {showModal.type === "delete" && (
          <DeleteMessage
            setShowModal={setShowModal}
            setSelected={setSelected}
            setSelectedMessages={setSelectedMessages}
            selectedMessages={selectedMessages}
            chat_id={id}
          />
        )}
      </Modal>
    </div>
  );
};

export default ChatPage;
