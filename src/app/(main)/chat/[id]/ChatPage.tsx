"use client";

import { useState, useRef, useEffect, use, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSelector, UseSelector } from "react-redux";
import { UserApi, useSendMessageMutation } from "../../../../redux/Apis/User";
import { RootState } from "@/redux/store";
import { useAppDispatch, useSocketEvents } from "@/lib/hooks";

import { Chat, Message } from "@/lib/dummy";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Modal from "@/components/HOComponents/Modal";
import {
  useGetAllChatsQuery,
  useGetEmojisQuery,
  useGetSingleChatQuery,
} from "@/redux/Apis/User";

import { useSocket } from "@/layouts/SocketWrapper";
import { REFETCH_CHATS, REPLY_MESSAGE, SEND_MESSAGE } from "@/lib/events";
// import Chatlist from "@/components/Chat/Chatlist";
import Chatlist from "@/components/Chat/Chatlist";
import Inputbox from "@/components/Chat/Inputbox";
import DeleteMessage from "@/components/ModalChilds/DeleteMessage";
import Chathead from "@/components/Chat/Chathead";


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
  const [sendMessage] = useSendMessageMutation()
  const [show, setShow] = useState<number | string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);

  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  const { data, isLoading, isFetching, isSuccess, nextCursor, hasMore } = useGetSingleChatQuery(
    { chat_ids: [id], cursor, limit: 20 },
    {
      selectFromResult: ({ data, isLoading, isSuccess, isFetching }) => {
        return {
          data: data?.data?.getChatById?.data?.items,
          nextCursor: data?.data?.getChatById?.data?.nextCursor,
          hasMore: data?.data?.getChatById?.data?.hasMore,
          isLoading,
          isSuccess,
          isFetching
        };
      },
    },
  );

  const [messages, setMessages] = useState<Message[]>(data || [])

  const { emojis, emjojiLoading, emojiCallSuccess } = useGetEmojisQuery(
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
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(data)
    }
  }, [data])


  // console.log(cursor, "cursorrrrr....")

  // console.log(emojis, "emojissssssss", chatDetails);

  //   console.log(data, "chat data is message");

  // const chatId = resolvedParams.id;
  const chat = data;
  const socket = useSocket();


  const [active, setActive] = useState<number | string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number[] | []>([]);
  const [menu, setMenu] = useState(false);
  const [inputText, setInputText] = useState("");
  // console.log(messages, "messagessss");
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  const dispatch = useAppDispatch()


  const bottomRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        console.log(entries, "entriesssssssss")
        setCursor(() => nextCursor)
      }
    }, {
      rootMargin: "500px",
      threshold: 0,
    })


    if (bottomRef.current) observer.observe(bottomRef.current)

    //  console.log("= data =================")
    return () => observer.disconnect()
  }, [data, nextCursor, hasMore, isFetching]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [data, nextCursor]);

  // useSocketEvents(socket, handler);
  const [showModal, setShowModal] = useState<boolean>(false);



  const handleSendMessage =
    useCallback(async (e: React.FormEvent | mediaProps) => {
      if ("preventDefault" in e) {
        console.log("gotr issueeee")
        e.preventDefault();
      }

      if (!inputText.trim() || !socket) return;


      console.log(e, "medoiaaaaaaaaa")

      // console.log(chatDetails, "chat detaillssssss", chatDetails);
      const newMessage = {
        chat_ids: [id],
        content: inputText,
        media: "preventDefault" in e ? [] : [e],
        reciever_ids: [chatDetails.user_id],
        message_ids: [replyMessage?.id],

      };


      if ("preventDefault" in e) {
        setMessages(prev => [
          ...prev,
          {
            id: (prev[prev.length - 1]?.id || 0) + 1,
            sender_id: user_id ?? 2,
            created_at: new Date().toISOString(),
            seen_at: null,
            story_id: null,
            content: inputText,
            preview: null,
            reply_to_message_id: replyMessage?.id ?? null,
            is_forwarded: false,
            is_edited: false,
            is_deleted: false,
            reactions: [],
            isLocal: true,

          }
        ])
      }


      try {
        if (replyMessage !== null) {
          socket.emit(REPLY_MESSAGE, newMessage);
          console.log("messege repliy sent...")
          // await replyToMessage(newMessage).unwrap();
          setReplyMessage(null);
        } else {
          socket.emit(SEND_MESSAGE, newMessage);
          console.log("messege sent...")
          // await sendMessage(newMessage);
        }
        scrollToBottom();
      } catch (error) {
        console.log(error, "error in sending message")
      }

      // setMessages([...messages, newMessage]);
      setInputText("");
    }, [id, setInputText, sendMessage, replyMessage, inputText, chatDetails, socket, scrollToBottom
    ]);

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string>("");
  const [currentChunk, setCurrentChunk] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const CHUNK_SIZE = 1024 * 1024;
  const pausedRef = useRef(false);

  const uploadChunks = useCallback(async (id: string) => {
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

        await fetch(`${process.env.NEXT_PUBLIC_DOMAIN + ':' + process.env.NEXT_PUBLIC_SELF_PORT}/api/upload/upload`, {
          method: "POST",
          body: form,
          signal: controllerRef.current?.signal,
        });
        setCurrentChunk(i + 1);
        setProgress(Math.round(((i + 1) / totalChunk) * 100));
      }

      const done = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN + ':' + process.env.NEXT_PUBLIC_SELF_PORT}/api/upload/finish`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          uploadId: id,
          extension: file.name.split(".").pop(),
        }),
      });

      if (done.ok) {


        const result = await done.json()


        const media = {
          file_name: "imagefile",
          url: result.data.url,
          file_type: result.data.resource_type,
          file_size: result.data.bytes.toString()

        }



        handleSendMessage(media)


        console.log(result);
        // alert("upload completed");
      } else {
        alert("error in uploading");
      }
    } catch (error) {
      alert("error in uploading");
    } finally {
      setProgress(0)
      setInputText("")
      setUploadId("")
      setCurrentChunk(0)
      setFile(null)
      // setMessages(prev => prev.filter(pf => pf.id !== prev[prev.length - 1].id))
    }
  }, [file, CHUNK_SIZE, currentChunk, handleSendMessage]);
  const startUpload = useCallback(async () => {
    if (!file || currentChunk > 0) return;


    // console.log(inputText, "input test/.....")



    setMessages(prev => [
      ...prev,
      {
        id: (prev[prev.length - 1]?.id || 0) + 1,
        sender_id: user_id ?? 2,
        created_at: new Date().toISOString(),
        seen_at: null,
        story_id: null,
        content: inputText,
        preview: URL.createObjectURL(file),
        reply_to_message_id: replyMessage?.id ?? null,
        is_forwarded: false,
        is_edited: false,
        is_deleted: false,
        reactions: [],
        isLocal: true,

      }
    ])

    // console.log(messages, "messageeeeeeee", inputText)

    controllerRef.current = new AbortController();
    const upload = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN + ':' + process.env.NEXT_PUBLIC_SELF_PORT}/api/upload/start`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      }
    });

    const data = await upload.json();
    console.log(data, "data....");
    const id = data.uploadId;
    setUploadId(id);

    uploadChunks(id);
  }, [currentChunk, file, setMessages, user_id, uploadChunks, inputText, replyMessage?.id]);



  const cancelUpload = useCallback(async () => {
    controllerRef.current?.abort();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN + ':' + process.env.NEXT_PUBLIC_SELF_PORT}/api/upload/cancel`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({

          uploadId: uploadId,
        }),
      });

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
        dispatch(
          UserApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [id] },
            (draft) => {

              console.log(draft.data, "draft dataaaa...", data)
              const exists = draft.data.getChatById.data.items.find(
                (m: Message) => m.id === data[0].id,
              );
              if (exists) {
                const exists = draft.data.getChatById.data.items.map(
                  (m: Message) => {
                    if (m.id === data[0].id) {
                      return { ...m, ...data[0] }
                    }
                  },
                );
              }
              if (!exists) {
                console.log("pushed new chat....", data);
                draft.data.getChatById.data.items.push(...data);
              }
            },
          ));

      },
    }),
    [dispatch, id],
  );

  useSocketEvents(socket, handler)


  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Chat not found
      </div>
    );
  }




  // console.log(chat, "chat detaillssss.");

  return (
    <div className="flex relative flex-col h-full w-full chat-bg relative">
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
        uploadChunks={uploadChunks} cancelUpload={cancelUpload} startUpload={startUpload}
        timerRef={timerRef}
        setActive={setActive}
        emojis={emojis}
        chat_id={id}
        user_id={user_id}
        messages={messages}
        setShow={setShow}
        setMessages={setMessages}
        active={active}
        // file={file}
        setReplyMessage={setReplyMessage}
        uploadId={uploadId}
        setFile={setFile}



        show={show} menu={menu} chatDetails={chatDetails} />

      {/* Input */}



      <Inputbox
        chatDetails={chatDetails}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        setFile={setFile}
        setInputText={setInputText} inputText={inputText}
        file={file}
        handleSendMessage={handleSendMessage}
        setMessages={setMessages}
        scrollToBottom={scrollToBottom}
        chat_id={id}



        pausedRef={pausedRef} progress={progress} uploadId={uploadId} uploadChunks={uploadChunks} cancelUpload={cancelUpload} startUpload={startUpload}

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
