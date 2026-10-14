import { chatApi } from "@/redux/Apis/Chat";

import { useRef, useState, useCallback, RefObject, FormEvent } from "react";
import { addMessage } from "./cacaheupdateutils";
import { Message, MessageItem } from "./dummy";
import { logger } from "./utils";
import { useToast } from "@/components/Utility/Toast";
import { useAppDispatch } from "./hooks";

interface mediaProps {
  file_name: string;
  url: string;
  file_type: string;
  file_size: string;
}
interface uploadHookProps {
  inputRef: RefObject<HTMLInputElement | null>;
  user_id: number | null;
  replyMessage: MessageItem | null;
  id: number;
  handleSendMessage: (e: mediaProps | FormEvent<Element>) => Promise<void>;
}

export const useUpload = ({
  inputRef,
  user_id,
  replyMessage,
  handleSendMessage,
  id,
}: uploadHookProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string>("");
  const [currentChunk, setCurrentChunk] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const CHUNK_SIZE = 1024 * 1024;
  const pausedRef = useRef(false);
  const { showToast } = useToast();
  const dispatch = useAppDispatch();

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
          //  logger.log();
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

          await handleSendMessage(media);

          logger.log(result);
          return true;
          // alert("upload completed");
        } else {
          alert("error in uploading");
          return false;
        }
      } catch (error) {
        // alert("error in uploading");
        logger.log(error, "error in uploaddd.");
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
            },
          ),
        );
      }
      setProgress(0);
      //   setInputText("");
      setUploadId("");
      setCurrentChunk(0);
      //   inputRef.current = null;
      setFile(null);
      // setMessages(prev => prev.filter(pf => pf.id !== prev[prev.length - 1].id))
    },
    [file, CHUNK_SIZE, currentChunk, showToast, handleSendMessage, dispatch],
  );
  const startUpload = useCallback(async () => {
    // debugger;
    if (!file || currentChunk > 0 || !user_id) {
      logger.debug("data is bklank", file, currentChunk);
      showToast("data file is blank", "warning");
      return;
    }

    let pathResult;

    const url = URL.createObjectURL(file);
    if (inputRef.current) {
      pathResult = dispatch(
        chatApi.util.updateQueryData(
          "getSingleChat",
          { chat_ids: [id] },
          addMessage(inputRef.current.value, user_id, replyMessage, url),
        ),
      );
    }

    // logger.log(messages, "messageeeeeeee", inputText)

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
      logger.log(data, "data....");
      const uid = data.uploadId;
      setUploadId(uid);

      uploadChunks(uid);
    } catch (error) {
      pathResult?.undo();
    }
  }, [
    currentChunk,
    dispatch,
    file,
    // setMessages,
    replyMessage,
    id,
    showToast,
    user_id,
    inputRef,
    uploadChunks,
    // inputText,
  ]);

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
      //  logger.log(error, "errorrrrr");
    }
  }, [uploadId]);

  return {
    currentChunk,
    setCurrentChunk,
    uploadId,
    setUploadId,
    file,
    setFile,

    uploadChunks,
    startUpload,
    cancelUpload,
    pausedRef,
    progress,
    setProgress,
  };
};
