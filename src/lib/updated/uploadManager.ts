import { AppDispatch } from "@/redux/store";
import {
  uploadProgress,
  uploadRemoved,
  uploadStarted,
  uploadStatusChanged,
} from "@/redux/slices/UploadSlice";
import { mediaProps } from "../useSendMessage";
import { logger } from "../utils";

const CHUNK_SIZE = 1024 * 1024;

interface UploadTask {
  file: File;
  chatId: number;
  uploadId: string | null;
  nextChunk: number; // resume yahin se hoga
  paused: boolean;
  running: boolean;
  controller: AbortController;
  onUploaded: (media: mediaProps) => Promise<boolean>;
}

// File / AbortController serializable nahi hain → Redux mein nahi, yahan rakho
const tasks = new Map<string, UploadTask>();

const isAbortError = (error: unknown) =>
  (error as Error)?.name === "AbortError";

// Network blip pe chunk 3 baar try karo (0.5s, 1s, 2s backoff)
const withRetry = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts || isAbortError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
};

// Relative URL — kisi bhi domain pe kaam karega
const postJson = async (url: string, body: unknown, signal: AbortSignal) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal,
  });
  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.message ?? "Upload request failed");
  return data;
};

// Direct Cloudinary upload pe shift karna ho to sirf ye function badlo
const runChunks = async (
  clientMsgId: string,
  task: UploadTask,
  dispatch: AppDispatch,
): Promise<mediaProps | null> => {
  const { file } = task;
  const signal = task.controller.signal;

  if (!task.uploadId) {
    const started = await postJson("/api/upload/start", {}, signal);
    task.uploadId = started.uploadId as string;
  }
  const uploadId = task.uploadId;

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = task.nextChunk; i < totalChunks; i++) {
    if (task.paused) return null; // pause — nextChunk yaad hai

    await withRetry(async () => {
      const form = new FormData();
      form.append("uploadId", uploadId);
      form.append("index", String(i));
      form.append("chunk", file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));

      const res = await fetch("/api/upload/upload", {
        method: "POST",
        body: form,
        signal,
      });
      if (!res.ok) throw new Error(`Chunk ${i} failed`);
    });

    task.nextChunk = i + 1;
    dispatch(
      uploadProgress({
        clientMsgId,
        progress: Math.round(((i + 1) / totalChunks) * 100),
      }),
    );
  }

  const done = await postJson(
    "/api/upload/finish",
    { uploadId, extension: file.name.split(".").pop() },
    signal,
  );

  return {
    file_name: file.name,
    url: done.data.secure_url ?? done.data.url, // https wala URL
    file_type: done.data.resource_type,
    file_size: String(done.data.bytes),
  };
};

const cleanup = (clientMsgId: string, dispatch: AppDispatch) => {
  tasks.delete(clientMsgId);
  dispatch(uploadRemoved(clientMsgId));
};

const execute = async (clientMsgId: string, dispatch: AppDispatch) => {
  const task = tasks.get(clientMsgId);
  if (!task || task.running) return;

  task.running = true;
  try {
    const media = await runChunks(clientMsgId, task, dispatch);
    if (!media) return; // paused

    dispatch(uploadStatusChanged({ clientMsgId, status: "done" }));
    await task.onUploaded(media);
    cleanup(clientMsgId, dispatch);
  } catch (error) {
    if (isAbortError(error)) return; // cancel ne abort kiya
    logger.error(error, "upload failed");
    dispatch(uploadStatusChanged({ clientMsgId, status: "failed" }));
  } finally {
    task.running = false;
  }
};

export const uploadManager = {
  start(
    clientMsgId: string,
    file: File,
    chatId: number,
    dispatch: AppDispatch,
    onUploaded: UploadTask["onUploaded"],
  ) {
    tasks.set(clientMsgId, {
      file,
      chatId,
      uploadId: null,
      nextChunk: 0,
      paused: false,
      running: false,
      controller: new AbortController(),
      onUploaded,
    });
    dispatch(uploadStarted({ clientMsgId, chatId }));
    void execute(clientMsgId, dispatch);
  },

  pause(clientMsgId: string, dispatch: AppDispatch) {
    const task = tasks.get(clientMsgId);
    if (!task) return;
    task.paused = true;
    dispatch(uploadStatusChanged({ clientMsgId, status: "paused" }));
  },

  // Paused aur failed dono ke liye kaam karta hai
  resume(clientMsgId: string, dispatch: AppDispatch) {
    const task = tasks.get(clientMsgId);
    if (!task) return;
    task.paused = false;
    dispatch(uploadStatusChanged({ clientMsgId, status: "uploading" }));
    if (!task.running) void execute(clientMsgId, dispatch);
  },

  async cancel(clientMsgId: string, dispatch: AppDispatch) {
    const task = tasks.get(clientMsgId);
    if (!task) return;
    task.controller.abort();

    if (task.uploadId) {
      await fetch("/api/upload/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: task.uploadId }),
      }).catch(() => {}); // server cleanup fail ho bhi jaye to UI se hata do
    }
    cleanup(clientMsgId, dispatch);
  },
};
