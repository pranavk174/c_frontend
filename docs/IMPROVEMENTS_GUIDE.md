# Production Improvements — Step-by-step Guide

Har step independent commit ke layak hai. **Isi order mein karo**, kyunki aage ke steps pichhle steps ke code pe depend karte hain
(jaise Step 4 ko Step 2 ka `client_msg_id` aur Step 3 ka socket singleton chahiye).

| Step | Kya                                    | Kyun zaroori                                                       |
| ---- | -------------------------------------- | ------------------------------------------------------------------ |
| 1    | Upload routes security                 | Abhi koi bhi request bhej ke server ka folder delete kar sakta hai |
| 2    | `client_msg_id` se optimistic messages | Fake ID collision, duplicate messages                              |
| 3    | Socket singleton + reconnect           | Reconnect ke baad messages aana band, logout pe socket zinda       |
| 4    | `useSendMessage` rewrite               | Ack timeout, group bug, empty message, DOM se text padhna          |
| 5    | Upload → Redux + uploadManager         | Har bubble ka re-render, upload navigation pe khatam               |
| 6    | Context split                          | Aapka naya `ChatMetaContext` / `ChatActionContext`                 |
| 7    | Per-chat UI state, timerRef, typing    | Reply/typing chat-to-chat leak, timer collision                    |
| 8    | Selectors + virtual list perf          | Har Redux action pe ChatPage re-render, unstable keys              |
| 9    | Error handling                         | Har blip pe offline redirect, galat toasts                         |
| 10   | Cleanup + tests                        | Config, dead code, pehla test                                      |

---

## Step 1 — Upload routes ko secure karo 🔴

**Problem:** `uploadId` client se aata hai aur seedha file path mein lagta hai.
`cancel` route mein `fs.rm("upload/" + uploadId, { recursive: true, force: true })` hai, toh `uploadId = ".."` bhejoge to **poora project folder delete** ho jayega.
Upar se `proxy.ts` `/api/*` ko bina token ke aage jaane deta hai.

### 1.1 Naya file: `src/app/api/upload/uploadUtils.ts`

```ts
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const CHUNK_SIZE = 1024 * 1024; // 1MB — client ke CHUNK_SIZE jaisa hi rakho
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — MediaOptions wali limit
export const MAX_CHUNKS = Math.ceil(MAX_FILE_SIZE / CHUNK_SIZE);
export const UPLOAD_ROOT = path.join(process.cwd(), "upload");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "mp4",
  "webm",
  "mp3",
  "ogg",
  "wav",
  "pdf",
]);

export const isValidUploadId = (value: unknown): value is string =>
  typeof value === "string" && UUID_RE.test(value);

export const isValidChunkIndex = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d+$/.test(value) &&
  Number(value) < MAX_CHUNKS;

export const isAllowedExtension = (value: unknown): value is string =>
  typeof value === "string" && ALLOWED_EXTENSIONS.has(value.toLowerCase());

// Double safety: resolve hone ke baad bhi path UPLOAD_ROOT ke andar hi hona chahiye
export const safeUploadPath = (...parts: string[]) => {
  const resolved = path.resolve(UPLOAD_ROOT, ...parts);
  if (!resolved.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error("Invalid upload path");
  }
  return resolved;
};

// HTTP status bhi sahi bhejo — warna client ka res.ok hamesha true aata hai
export const jsonError = (message: string, status: number) =>
  NextResponse.json({ success: false, message, status }, { status });

// NOTE: ye sirf cookie presence check hai. Real JWT verify backend karta hai.
// Agar JWT secret yahan available hai to `jose` ki jwtVerify() se verify karo.
export const requireAuth = (req: NextRequest) =>
  req.cookies.get("accessToken")?.value ? null : jsonError("Unauthorized", 401);
```

### 1.2 `src/app/api/upload/start/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import {
  CHUNK_SIZE,
  jsonError,
  requireAuth,
  safeUploadPath,
} from "../uploadUtils";
import { logger } from "@/lib/utils";

export const POST = async (req: NextRequest) => {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const uploadId = crypto.randomUUID();
    await fs.mkdir(safeUploadPath(uploadId), { recursive: true });

    return NextResponse.json(
      {
        message: "upload started",
        status: 201,
        success: true,
        uploadId,
        chunkSize: CHUNK_SIZE,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error(error, "UPLOAD_START_ERROR");
    return jsonError("Some thing went wrong in starting upload", 500);
  }
};
```

### 1.3 `src/app/api/upload/upload/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import {
  CHUNK_SIZE,
  isValidChunkIndex,
  isValidUploadId,
  jsonError,
  requireAuth,
  safeUploadPath,
} from "../uploadUtils";
import { logger } from "@/lib/utils";

export const POST = async (req: NextRequest) => {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const form = await req.formData();
    const uploadId = form.get("uploadId");
    const index = form.get("index");
    const chunk = form.get("chunk");

    if (
      !isValidUploadId(uploadId) ||
      !isValidChunkIndex(index) ||
      !(chunk instanceof Blob)
    ) {
      return jsonError("Invalid chunk payload", 400);
    }
    if (chunk.size > CHUNK_SIZE) {
      return jsonError("Chunk too large", 413);
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());
    await fs.writeFile(safeUploadPath(uploadId, index), buffer);

    return NextResponse.json(
      { message: "upload successfull", status: 201, success: true },
      { status: 201 },
    );
  } catch (error) {
    logger.error(error, "CHUNK_UPLOAD_ERROR");
    return jsonError("upload failed", 500);
  }
};
```

### 1.4 `src/app/api/upload/finish/route.ts` — sirf badle hue hisse

```ts
import {
  isAllowedExtension,
  isValidUploadId,
  jsonError,
  requireAuth,
  safeUploadPath,
} from "../uploadUtils";

export const POST = async (req: NextRequest) => {
  const authError = requireAuth(req);
  if (authError) return authError;

  let finalPath = "";
  let folderPath = "";

  try {
    const { uploadId, extension } = await req.json();

    if (!isValidUploadId(uploadId) || !isAllowedExtension(extension)) {
      return jsonError("Invalid upload", 400);
    }

    folderPath = safeUploadPath(uploadId);

    // sirf numeric chunk files lo, baaki kuch bhi ho to ignore
    const sortedParts = (await fs.readdir(folderPath))
      .filter((p) => /^\d+$/.test(p))
      .sort((a, b) => Number(a) - Number(b));

    // chunks 0,1,2... continuous hone chahiye, warna file corrupt banegi
    const isComplete = sortedParts.every((p, i) => Number(p) === i);
    if (sortedParts.length === 0 || !isComplete) {
      return jsonError("Missing chunks", 400);
    }

    finalPath = safeUploadPath(
      `${uploadId}-${Date.now()}.${extension.toLowerCase()}`,
    );

    // ... merge wala code SAME rahega ...

    const cloudinaryResult = await cloudinary.uploader.upload(finalPath, {
      folder: "uploads",
      resource_type: "auto",
      // chunk_size: 6000000000000  <- hata do, ye galat value hai
    });

    // ... cleanup SAME ...

    return NextResponse.json(
      {
        message: "Successfully uploaded",
        success: true,
        status: 201,
        data: cloudinaryResult,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    logger.error(error, "UPLOAD_ERROR");
    if (finalPath && fsSync.existsSync(finalPath)) await fs.unlink(finalPath);
    if (folderPath) await fs.rm(folderPath, { recursive: true, force: true });

    return jsonError("Upload failed", 500);
  }
};
```

### 1.5 `src/app/api/upload/cancel/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import {
  isValidUploadId,
  jsonError,
  requireAuth,
  safeUploadPath,
} from "../uploadUtils";

export const POST = async (req: NextRequest) => {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { uploadId } = await req.json();
    if (!isValidUploadId(uploadId)) return jsonError("Invalid uploadId", 400);

    await fs.rm(safeUploadPath(uploadId), { recursive: true, force: true });

    return NextResponse.json({
      message: "Cancel Upload Succeeeded",
      status: 200,
      success: true,
    });
  } catch {
    return jsonError("Cancel Upload Failed", 500);
  }
};
```

`simpleUpload` route mein bhi `requireAuth` aur size/type check lagao.

### 1.6 `.gitignore` mein add karo

```
/upload
```

### 1.7 (Phase 2, optional) Direct-to-Cloudinary signed upload

Chunks ko apne server ki disk pe rakhna **horizontal scale nahi karta**: 2 server instances ho gaye toh chunks alag-alag machine pe jayenge.
Production pattern ye hai ki server sirf signature de, aur file browser se seedha Cloudinary jaaye:

```ts
// src/app/api/upload/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../uploadUtils";

export const POST = async (req: NextRequest) => {
  const authError = requireAuth(req);
  if (authError) return authError;

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "uploads";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return NextResponse.json({
    success: true,
    data: {
      timestamp,
      folder,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_NAME,
    },
  });
};
```

Client pe `https://api.cloudinary.com/v1_1/<cloud_name>/auto/upload` pe `file, api_key, timestamp, folder, signature` FormData mein POST karo
(progress ke liye `XMLHttpRequest.upload.onprogress` use karo). Step 5 ka `uploadManager` aisa banaya hai ki sirf `runChunks` function badalna padega.

---

## Step 2 — `client_msg_id` se optimistic messages 🔴

**Problem:** `addMessage` mein `id = lastId + 1` hai. Ye real server ID se takra sakti hai, `updateMessage(serverId)` fake ID wala message dhoondh hi nahi paata,
aur jab real message `REFETCH_CHATS` se aata hai toh **duplicate** ban jaata hai.

**Solution:** Client har message ke liye ek UUID (`client_msg_id`) banata hai aur server ko bhejta hai. Server use save karke ack aur broadcast dono mein wapas bhejta hai.
Reconcile isi UUID se hota hai. Temp `id` **negative** rakhte hain, taaki server ki positive IDs se kabhi na takraye.

### 2.1 `src/lib/dummy.ts` — `Message` mein add karo

```ts
export interface Message {
  id: number;
  chat_id?: number; // backend REFETCH_CHATS mein bheje to galat chat mein message nahi jayega
  client_msg_id?: string | null;
  send_status?: "sending" | "sent" | "failed";
  // ...baaki fields same
  isLocal: boolean;
}
```

### 2.2 `src/lib/cacaheupdateutils.tsx` — `addMessage` / `updateMessage` replace karo

```ts
let localSeq = 0;

// tempId hamesha NEGATIVE aur unique — server ki ids se collision impossible
export const createLocalIds = () => ({
  clientMsgId: crypto.randomUUID(),
  tempId: -(Date.now() + ++localSeq),
});

interface AddMessageArgs {
  tempId: number;
  clientMsgId: string;
  content: string;
  user_id: number;
  replyMessage: Message | null;
  url?: string | null;
}

export const addMessage =
  ({
    tempId,
    clientMsgId,
    content,
    user_id,
    replyMessage,
    url = null,
  }: AddMessageArgs) =>
  (draft: Draft<GetChatByIdResponse>) => {
    const items = draft?.data?.getChatById?.data?.items;
    if (!items) return;

    items.push({
      id: tempId,
      client_msg_id: clientMsgId,
      send_status: "sending",
      sender_id: user_id,
      created_at: Date.now().toString(),
      seen_at: null,
      story_id: null,
      seen_users: [],
      content,
      preview: url,
      reply_to_message_id: replyMessage?.id ?? null,
      is_forwarded: false,
      is_edited: false,
      is_deleted: false,
      reactions: [],
      isLocal: true,
    });
  };

// Server ack aane pe local message ko real message se replace karo
export const confirmMessage =
  (clientMsgId: string, serverMessage?: Message) =>
  (draft: Draft<GetChatByIdResponse>) => {
    const items = draft?.data?.getChatById?.data?.items;
    if (!items) return;

    const localIndex = items.findIndex(
      (m: Message) => m.client_msg_id === clientMsgId,
    );
    if (localIndex === -1) return;

    if (!serverMessage) {
      items[localIndex].isLocal = false;
      items[localIndex].send_status = "sent";
      return;
    }

    // REFETCH_CHATS broadcast ack se PEHLE aa gaya → real message pehle se list mein hai
    const alreadyExists = items.some((m: Message) => m.id === serverMessage.id);
    if (alreadyExists) {
      items.splice(localIndex, 1);
      return;
    }

    items[localIndex] = {
      ...items[localIndex],
      ...serverMessage,
      isLocal: false,
      send_status: "sent",
    };
  };

export const markMessageFailed =
  (clientMsgId: string) => (draft: Draft<GetChatByIdResponse>) => {
    const message = draft?.data?.getChatById?.data?.items?.find(
      (m: Message) => m.client_msg_id === clientMsgId,
    );
    if (message) message.send_status = "failed";
  };

export const removeLocalMessage =
  (clientMsgId: string) => (draft: Draft<GetChatByIdResponse>) => {
    const items = draft?.data?.getChatById?.data?.items;
    if (!items) return;
    const index = items.findIndex(
      (m: Message) => m.client_msg_id === clientMsgId,
    );
    if (index !== -1) items.splice(index, 1);
  };

// fake last_message_id mat banao — server ka id REFETCH_CHATS se aayega
export const updateAllChatcache =
  (id: number, inputText: string) => (draft: Draft<GetAllChatResponse>) => {
    const chat = draft.data.getAllChats.data.items.find(
      (item: Chat) => item.chat_id === id,
    );
    if (!chat) return;
    chat.last_message = inputText;
    chat.last_message_at = new Date().toISOString();
  };
```

### 2.3 `refetchChat` — incoming message ko sahi chat mein, aur client_msg_id se dedupe karke daalo

```ts
export const refetchChat = (
  dispatch: AppDispatch,
  data: Message[],
  currentChatId: number,
) => {
  const incoming = data[0];
  if (!incoming) return;

  // backend chat_id bheje to wahi use karo — current open chat pe blindly mat daalo
  const chatId = incoming.chat_id ?? currentChatId;

  dispatch(
    chatApi.util.updateQueryData("getAllChats", {}, (draft) => {
      const chat = draft.data.getAllChats.data.items.find(
        (c: Chat) => c.chat_id === chatId,
      );
      if (!chat) return;
      chat.last_message = incoming.content || "image";
      chat.last_message_at = incoming.created_at;
      chat.last_message_id = incoming.id;
    }),
  );

  // Jo chat cache mein nahi hai uspe updateQueryData kuch nahi karta — safe hai
  dispatch(
    chatApi.util.updateQueryData(
      "getSingleChat",
      { chat_ids: [chatId] },
      (draft) => {
        const items = draft?.data?.getChatById?.data?.items;
        if (!items) return;

        const index = items.findIndex(
          (m: Message) =>
            m.id === incoming.id ||
            (!!incoming.client_msg_id &&
              m.client_msg_id === incoming.client_msg_id),
        );

        if (index !== -1) {
          items[index] = {
            ...items[index],
            ...incoming,
            isLocal: false,
            send_status: "sent",
          };
          return;
        }

        items.push(...data);
      },
    ),
  );
};
```

`updateMessage` function ab use nahi hoga, use delete kar do.

### 2.4 Backend (`c-backend-express`) mein ye karna padega

```sql
ALTER TABLE messages ADD COLUMN client_msg_id UUID;
-- Same sender same client_msg_id dobara bheje (retry) to duplicate na bane
CREATE UNIQUE INDEX messages_sender_client_msg_uq ON messages (sender_id, client_msg_id);
```

```js
socket.on("SEND_MESSAGE", async (payload, ack) => {
  const { client_msg_id } = payload;

  // Idempotency: retry pe wahi purana message lauta do, naya mat banao
  if (client_msg_id) {
    const existing = await findMessage({
      sender_id: socket.user.id,
      client_msg_id,
    });
    if (existing) return ack({ success: true, data: { message: existing } });
  }

  const message = await createMessage({
    ...payload,
    sender_id: socket.user.id,
  });

  // broadcast mein bhi client_msg_id aur chat_id bhejo
  socket.to(roomFor(message.chat_id)).emit("REFETCH_CHATS", [message]);
  ack({ success: true, data: { message } });
});
```

**Idempotency kyun zaroori hai:** socket disconnect hone pe Socket.IO emit ko buffer kar leta hai. Client pe 8s ka timeout ho gaya aur message "failed" dikha,
lekin reconnect pe wahi buffered packet server tak pahunch gaya. User ne retry dabaya toh bina idempotency ke **2 message** ban jayenge.

---

## Step 3 — Socket singleton, reconnect pe rejoin + resync 🔴

**Problem:**

- Sockets `useMemo` mein bante hain aur cleanup comment out hai, toh logout ke baad bhi purani session ka socket zinda rehta hai.
- `reconnectionAttempts: 5` ke baad socket hamesha ke liye ruk jaata hai.
- `CHAT_JOINED` sirf mount pe emit hota hai, toh reconnect ke baad server room membership bhool jaata hai aur us chat ke messages aana band ho jaate hain.

### 3.1 Naya file: `src/lib/socket.ts`

```ts
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";

// Vercel pe WebSocket upgrade nahi hota → env se polling-only on karo.
// Custom server (Render/VPS) pe websocket allow karo.
const pollingOnly = process.env.NEXT_PUBLIC_SOCKET_POLLING_ONLY === "true";

const options: Partial<ManagerOptions & SocketOptions> = {
  withCredentials: true,
  autoConnect: false, // connect hum khud karenge (auth ke baad)
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000, // exponential backoff 1s → 10s
  transports: pollingOnly ? ["polling"] : ["polling", "websocket"],
};

let chatSocket: Socket | null = null;
let notificationSocket: Socket | null = null;

// Pure app mein ek hi instance — re-render / StrictMode se naya socket nahi banega
export const getSockets = () => {
  if (!chatSocket) chatSocket = io("/chat", options);
  if (!notificationSocket) notificationSocket = io("/notification", options);
  return { chatSocket, notificationSocket };
};

export const disconnectSockets = () => {
  chatSocket?.disconnect();
  notificationSocket?.disconnect();
  chatSocket = null;
  notificationSocket = null;
};
```

### 3.2 `src/layouts/SocketWrapper.tsx` — socket creation replace karo

```tsx
import { getSockets } from "@/lib/socket";
import { chatApi } from "@/redux/Apis/Chat";
import { useState } from "react";

export const SocketProvider = ({ children }: Props) => {
  // useState initializer sirf ek baar chalta hai — useMemo ki tarah "maybe" nahi
  const [{ chatSocket, notificationSocket }] = useState(getSockets);

  useEffect(() => {
    chatSocket.connect();
    notificationSocket.connect();

    // Reconnect pe chat list dobara lao — disconnect ke time ke messages miss hue honge
    const resync = () => {
      dispatch(
        chatApi.util.invalidateTags([{ type: "chats", id: "ALL_CHATS" }]),
      );
    };
    chatSocket.io.on("reconnect", resync);

    return () => {
      chatSocket.io.off("reconnect", resync);
      chatSocket.disconnect();
      notificationSocket.disconnect();
    };
  }, [chatSocket, notificationSocket, dispatch]);

  // ...baaki handlers SAME
};
```

Iske liye `src/redux/Apis/Chat.tsx` mein `getAllChats` ka tag change karo. `"chats"` invalidate karne wali mutations ab bhi kaam karengi, kyunki type same hai:

```ts
getAllChats: builder.query({
  query: () => ({ url: "/chat/all-chats", method: "GET" }),
  providesTags: [{ type: "chats", id: "ALL_CHATS" }],
}),
```

### 3.3 Logout pe socket band + cache saaf karo — `src/components/Sidebar.tsx`

```ts
import { disconnectSockets } from "@/lib/socket";
import { BaseApi } from "@/redux/Apis/BaseApi";
import { removeUser } from "@/redux/slices/User";

const handleLogout = asyncHandler(async () => {
  await logout(null).unwrap();
  disconnectSockets();
  dispatch(BaseApi.util.resetApiState()); // agla user login kare to purani chats cache mein na dikhe
  dispatch(removeUser());
  document.documentElement.classList.remove("dark", "light");
  route.replace("/login");
});
```

### 3.4 Naya hook: `src/lib/useChatRoom.tsx`

```tsx
import { useEffect, useEffectEvent } from "react";
import { useSocket } from "@/layouts/SocketWrapper";
import { CHAT_JOINED, CHAT_LEAVED } from "./events";

interface useChatRoomProps {
  chatId: number;
  userId: number | null;
  onReconnect: () => void;
}

export const useChatRoom = ({
  chatId,
  userId,
  onReconnect,
}: useChatRoomProps) => {
  const { chatSocket: socket } = useSocket();

  // useEffectEvent: hamesha latest onReconnect use karega, effect dobara nahi chalega
  const handleReconnect = useEffectEvent(() => onReconnect());

  useEffect(() => {
    if (!userId) return;

    const join = () =>
      socket.emit(CHAT_JOINED, { chat_id: chatId, user_id: userId },socketcallBack);
    const reconnectHandler = () => handleReconnect();

    if (socket.connected) join();
    socket.on("connect", join); // har connect (reconnect bhi) pe room dobara join
    socket.io.on("reconnect", reconnectHandler);

    return () => {
      socket.off("connect", join);
      socket.io.off("reconnect", reconnectHandler);
      socket.emit(CHAT_LEAVED, {
        chat_id: chatId,
        user_id: userId,
        socketId: socket.id,
      });
    };
  }, [chatId, userId, socket]);
};
```

### 3.5 `ChatPage.tsx` — purana `CHAT_JOINED` wala `useEffect` hata ke ye lagao

```tsx
const { /* ... */ refetch } = useGetSingleChatQuery(/* ... */);

useChatRoom({
  chatId: id,
  userId: user_id,
  onReconnect: () => {
    // cursor null = latest page. Agar user ne purane messages load kiye the,
    // to cursor null karne se forceRefetch + merge latest page se replace kar dega
    if (cursor === null) refetch();
    else setCursor(null);
  },
});
```

### 3.6 `next.config.ts`

```ts
reactStrictMode: true, // socket ab singleton hai, double-connect nahi hoga
```

---

## Step 4 — `useSendMessage` rewrite 🔴

**Problem:**

- Text DOM (`inputRef.current.value`) se padha jaata hai.
- Group mein `reciever_ids: [chatDetails.user_id]` hardcoded hai, toh message sirf ek bande ko jaata hai.
- Ack ka timeout nahi hai.
- Khaali message bhi chala jaata hai.

### `src/lib/useSendMessage.tsx` — `useSendMessage` poora replace karo

```tsx
import { useCallback, useMemo } from "react";
import { useSelector, useStore } from "react-redux";
import { Chat, Message, socketResponse } from "./dummy";
import { chatApi } from "@/redux/Apis/Chat";
import { useAppDispatch } from "./hooks";
import {
  addMessage,
  confirmMessage,
  createLocalIds,
  markMessageFailed,
  updateAllChatcache,
} from "./cacaheupdateutils";
import { logger } from "./utils";
import { RootState } from "@/redux/store";
import { REPLY_MESSAGE, SEND_MESSAGE } from "./events";
import { setReplyMessage } from "@/redux/slices/ChatSlice";
import { useSocket } from "@/layouts/SocketWrapper";

export const ACK_TIMEOUT = 8000;

export interface mediaProps {
  file_name: string;
  url: string;
  file_type: string;
  file_size: string;
}

export interface LocalMessage {
  clientMsgId: string;
  content: string;
  replyMessage: Message | null;
}

interface useSendMessageProps {
  chatDetails: Chat;
  recieverIds: number[];
}

export const useSendMessage = ({
  chatDetails,
  recieverIds,
}: useSendMessageProps) => {
  const { id: user_id } = useSelector((state: RootState) => state.userSlice);
  const store = useStore<RootState>();
  const { chatSocket: socket } = useSocket();
  const dispatch = useAppDispatch();
  const chat_id = chatDetails.chat_id;

  // 1) UI mein turant dikhao (optimistic)
  const addLocalMessage = useCallback(
    (
      content: string,
      previewUrl: string | null = null,
    ): LocalMessage | null => {
      if (!user_id) return null;

      // replyMessage call ke time store se padho — selector se lete to har reply change
      // pe ye function badalta aur saare context consumers re-render hote
      const replyMessage = store.getState().ChatSlice.replyMessage;
      const { clientMsgId, tempId } = createLocalIds();

      dispatch(
        chatApi.util.updateQueryData(
          "getSingleChat",
          { chat_ids: [chat_id] },
          addMessage({
            tempId,
            clientMsgId,
            content,
            user_id,
            replyMessage,
            url: previewUrl,
          }),
        ),
      );
      dispatch(
        chatApi.util.updateQueryData(
          "getAllChats",
          {},
          updateAllChatcache(chat_id, content || "📷 Photo"),
        ),
      );

      if (replyMessage) dispatch(setReplyMessage(null));

      return { clientMsgId, content, replyMessage };
    },
    [user_id, store, dispatch, chat_id],
  );

  // 2) Server ko bhejo + ack ka wait (timeout ke saath)
  const emitMessage = useCallback(
    async (local: LocalMessage, media: mediaProps | null = null) => {
      const payload = {
        client_msg_id: local.clientMsgId,
        chat_ids: [chat_id],
        content: local.content,
        media: media ? [media] : [],
        reciever_ids: recieverIds, // group mein saare members
        message_ids: local.replyMessage ? [local.replyMessage.id] : [],
        chat_type: chatDetails.chat_type,
      };
      const event = local.replyMessage ? REPLY_MESSAGE : SEND_MESSAGE;

      try {
        // timeout ke andar ack nahi aaya to ye throw karega
        const response: socketResponse = await socket
          .timeout(ACK_TIMEOUT)
          .emitWithAck(event, payload);

        if (!response.success) throw new Error(response.message);

        dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [chat_id] },
            confirmMessage(local.clientMsgId, response.data?.message),
          ),
        );
        return true;
      } catch (error) {
        logger.error(error, "message send failed");
        dispatch(
          chatApi.util.updateQueryData(
            "getSingleChat",
            { chat_ids: [chat_id] },
            markMessageFailed(local.clientMsgId),
          ),
        );
        return false;
      }
    },
    [chat_id, recieverIds, chatDetails.chat_type, socket, dispatch],
  );

  const sendText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text) return false; // khaali message nahi jayega

      const local = addLocalMessage(text);
      if (!local) return false;

      return emitMessage(local);
    },
    [addLocalMessage, emitMessage],
  );

  // Failed message pe "retry" — backend idempotent hai to duplicate nahi banega
  const retryMessage = useCallback(
    (msg: Message) => {
      if (!msg.client_msg_id) return;
      return emitMessage({
        clientMsgId: msg.client_msg_id,
        content: msg.content ?? "",
        replyMessage: null,
      });
    },
    [emitMessage],
  );

  return useMemo(
    () => ({ sendText, retryMessage, addLocalMessage, emitMessage }),
    [sendText, retryMessage, addLocalMessage, emitMessage],
  );
};
```

> `retryMessage` mein `replyMessage: null` jaata hai, toh retry hua reply normal message ban jayega. Agar ye chahiye ki retry pe bhi reply bana rahe,
> toh `reply_to_message_id` se reply message cache mein dhoondh ke pass karo.

### Ack timeout baaki jagah bhi lagao

`handleLikes` aur `updateSeenMessage` (`cacaheupdateutils.tsx`) mein bhi callback ki jagah ye pattern use karo:

```ts
try {
  const response: socketResponse = await socket
    .timeout(ACK_TIMEOUT)
    .emitWithAck(MESSAGE_REACTION, payload);
  if (!response.success) pathResult.undo();
} catch {
  pathResult.undo(); // timeout / disconnect
}
```

---

## Step 5 — Upload state Redux mein + `uploadManager` 🟠

**Problem:**

- Har message bubble (`Messages.tsx`) `useChat()` se `progress` padhta hai, toh har chunk pe **saari bubbles re-render** hoti hain.
- Har local bubble ek hi `progress` dikhata hai.
- Chat badlo toh upload kho jaata hai.
- Chunk fail hone pe `res.ok` check nahi hota.
- URLs `NEXT_PUBLIC_DOMAIN:PORT` se bante hain, jo real domain pe toot jayenge.

**Design:**

- Upload job ka **serializable** state (progress, status) Redux mein rakho, `clientMsgId` se keyed. Har bubble sirf apna job select karegi.
- `File` aur `AbortController` serializable nahi hain, isliye ye module-level `Map` mein rahenge.
- Upload loop component ke bahar chalta hai, toh navigation pe band nahi hoga.

### 5.1 Naya file: `src/redux/slices/UploadSlice.tsx`

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UploadStatus = "uploading" | "paused" | "failed" | "done";

export interface UploadJob {
  chatId: number;
  progress: number;
  status: UploadStatus;
}

interface initialStateProps {
  jobs: Record<string, UploadJob>; // key = clientMsgId
}

const initialState: initialStateProps = { jobs: {} };

export const UploadSlice = createSlice({
  name: "Uploads",
  initialState,
  reducers: {
    uploadStarted: (
      state,
      action: PayloadAction<{ clientMsgId: string; chatId: number }>,
    ) => {
      state.jobs[action.payload.clientMsgId] = {
        chatId: action.payload.chatId,
        progress: 0,
        status: "uploading",
      };
    },
    uploadProgress: (
      state,
      action: PayloadAction<{ clientMsgId: string; progress: number }>,
    ) => {
      const job = state.jobs[action.payload.clientMsgId];
      if (job) job.progress = action.payload.progress;
    },
    uploadStatusChanged: (
      state,
      action: PayloadAction<{ clientMsgId: string; status: UploadStatus }>,
    ) => {
      const job = state.jobs[action.payload.clientMsgId];
      if (job) job.status = action.payload.status;
    },
    uploadRemoved: (state, action: PayloadAction<string>) => {
      delete state.jobs[action.payload];
    },
  },
});

export const {
  uploadStarted,
  uploadProgress,
  uploadStatusChanged,
  uploadRemoved,
} = UploadSlice.actions;

export default UploadSlice.reducer;
```

`src/redux/store.tsx` mein add karo. Persist whitelist mein **mat** daalna:

```ts
import UploadSlice from "./slices/UploadSlice";

const rootReducer = combineReducers({
  [BaseApi.reducerPath]: BaseApi.reducer,
  userSlice: userSlice,
  onlineUsersSlice: onlineUsersSlice,
  ChatSlice: ChatSlice,
  UploadSlice: UploadSlice,
});
```

### 5.2 Naya file: `src/lib/uploadManager.ts`

```ts
import { AppDispatch } from "@/redux/store";
import {
  uploadProgress,
  uploadRemoved,
  uploadStarted,
  uploadStatusChanged,
} from "@/redux/slices/UploadSlice";
import { mediaProps } from "./useSendMessage";
import { logger } from "./utils";

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
```

### 5.3 `src/lib/useSendMessage.tsx` — `useSendMediaMessage` poora replace karo

```tsx
import { useToast } from "@/components/Utility/Toast";
import { uploadManager } from "./uploadManager";
import { removeLocalMessage } from "./cacaheupdateutils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const useSendMediaMessage = ({
  chatDetails,
  recieverIds,
}: useSendMessageProps) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { sendText, retryMessage, addLocalMessage, emitMessage } =
    useSendMessage({
      chatDetails,
      recieverIds,
    });
  const chat_id = chatDetails.chat_id;

  // Upload background mein chalega — modal turant band kar sakte ho
  const sendMedia = useCallback(
    (file: File, caption: string) => {
      if (file.size > MAX_FILE_SIZE) {
        showToast("File Size Cant be Greater then 10MB", "error");
        return false;
      }

      const previewUrl = URL.createObjectURL(file);
      const local = addLocalMessage(caption.trim(), previewUrl);
      if (!local) {
        URL.revokeObjectURL(previewUrl);
        return false;
      }

      // ye callback component unmount hone ke baad bhi chalega (socket + dispatch global hain)
      uploadManager.start(
        local.clientMsgId,
        file,
        chat_id,
        dispatch,
        async (media) => {
          const sent = await emitMessage(local, media);
          // server ka cloudinary URL aa gaya → blob URL ki zarurat nahi, memory free karo
          if (sent) URL.revokeObjectURL(previewUrl);
          return sent;
        },
      );

      return true;
    },
    [addLocalMessage, emitMessage, chat_id, dispatch, showToast],
  );

  const pauseUpload = useCallback(
    (clientMsgId: string) => uploadManager.pause(clientMsgId, dispatch),
    [dispatch],
  );

  const resumeUpload = useCallback(
    (clientMsgId: string) => uploadManager.resume(clientMsgId, dispatch),
    [dispatch],
  );

  const cancelUpload = useCallback(
    async (clientMsgId: string) => {
      await uploadManager.cancel(clientMsgId, dispatch);
      dispatch(
        chatApi.util.updateQueryData(
          "getSingleChat",
          { chat_ids: [chat_id] },
          removeLocalMessage(clientMsgId),
        ),
      );
    },
    [chat_id, dispatch],
  );

  return useMemo(
    () => ({
      sendText,
      retryMessage,
      sendMedia,
      pauseUpload,
      resumeUpload,
      cancelUpload,
    }),
    [
      sendText,
      retryMessage,
      sendMedia,
      pauseUpload,
      resumeUpload,
      cancelUpload,
    ],
  );
};
```

Ab ye files delete kar do: `src/lib/useUploadHook.tsx`, `src/lib/useSendMessagehook.tsx` (purana dead code).
`ChatSlice` se `uploadId` field bhi hata do.

---

## Step 6 — Context split (aapke naye files) 🟠

**Aapke current attempt pe feedback:**

- ✅ `ChatMetaContext` alag banana sahi direction hai.
- ❌ `ChatActionContext` abhi bhi `progress`, `file`, `uploadId` saath rakhta hai, toh har chunk pe consumers re-render honge aur asli problem solve nahi hogi.
  Step 5 ke baad ye state Redux mein chali gayi, toh action context mein **sirf functions** bachenge.
- ❌ `chatDetails` dono contexts mein duplicate hai. Ye sirf Meta mein rahe.
- ❌ `inputRef` context mein nahi hona chahiye. Har input apna ref khud rakhe.

### 6.1 `src/Context/ChatMetaContext.tsx`

```tsx
"use client";

import { Chat } from "@/lib/dummy";
import { createContext, ReactNode, useContext, useMemo } from "react";

type ChatMetaContextType = {
  chatDetails: Chat;
  recieverIds: number[];
};

const ChatMetaContext = createContext<ChatMetaContextType | null>(null);

export function ChatMetaProvider({
  children,
  chatDetails,
  recieverIds,
}: ChatMetaContextType & { children: ReactNode }) {
  // value tabhi badle jab chat ya members badlein
  const value = useMemo(
    () => ({ chatDetails, recieverIds }),
    [chatDetails, recieverIds],
  );

  return (
    <ChatMetaContext.Provider value={value}>
      {children}
    </ChatMetaContext.Provider>
  );
}

export function useChatMeta() {
  const context = useContext(ChatMetaContext);
  if (context === null) {
    throw new Error("useChatMeta must be used within ChatMetaProvider");
  }
  return context;
}
```

### 6.2 `src/Context/ChatActionContext.tsx`

```tsx
"use client";

import { useSendMediaMessage } from "@/lib/useSendMessage";
import { createContext, ReactNode, useContext } from "react";
import { useChatMeta } from "./ChatMetaContext";

type ChatActionContextType = ReturnType<typeof useSendMediaMessage>;

const ChatActionContext = createContext<ChatActionContextType | null>(null);

// Sirf functions — koi fast-changing state nahi, isliye consumers re-render nahi honge
export function ChatActionProvider({ children }: { children: ReactNode }) {
  const { chatDetails, recieverIds } = useChatMeta();
  const actions = useSendMediaMessage({ chatDetails, recieverIds });

  return (
    <ChatActionContext.Provider value={actions}>
      {children}
    </ChatActionContext.Provider>
  );
}

export function useChatActions() {
  const context = useContext(ChatActionContext);
  if (context === null) {
    throw new Error("useChatActions must be used within ChatActionProvider");
  }
  return context;
}
```

Migration ke baad `src/Context/ChatContext.tsx` delete kar do.

### 6.3 `ChatPage.tsx` — providers aur `chatDetails` guard

```tsx
import { ChatMetaProvider } from "@/Context/ChatMetaContext";
import { ChatActionProvider } from "@/Context/ChatActionContext";

// ⚠️ Saare hooks (useMemo, useChatRoom, etc.) early return se PEHLE likho
const recieverIds = useMemo(
  () =>
    chat_type === "group"
      ? memberIds
      : chatDetails
        ? [chatDetails.user_id]
        : [],
  [chat_type, memberIds, chatDetails],
);

if (isLoading || isChatLoading) return /* loader same */;

// chat list mein chat nahi mili (deep link) → crash ki jagah message dikhao
if (!messages || !chatDetails) {
  return <div className="...">Chat not found</div>;
}

return (
  <div className="flex flex-col w-full chat-bg relative">
    <ChatMetaProvider chatDetails={chatDetails} recieverIds={recieverIds}>
      <ChatActionProvider>
        <Chathead
          menu={menu}
          members={members}
          memberIds={memberIds}
          setShowModal={setShowModal}
          selected={selecteds}
          chatDetails={chatDetails}
        />
        <VirtualChatlistGrouped
          setCursor={setCursor}
          isFetching={isFetching}
          data={groupedMessages}
          messageMap={messageMap}
          nextCursor={nextCursor}
          hasMore={hasMore}
          setMenu={setMenu}
          messages={messages}
          menu={menu}
          cursor={cursor}
        />
        <Inputbox />
      </ChatActionProvider>
    </ChatMetaProvider>

    <Modal values={showModal} setModal={setShowModal}>
      {showModal.type === "delete" && (
        <DeleteMessage setShowModal={setShowModal} chat_id={id} />
      )}
    </Modal>
  </div>
);
```

`Suspense` wrapper hata do. `VirtualChatlistGrouped` suspend nahi karta, toh wo kabhi trigger nahi hota.

### 6.4 `src/components/Chat/Inputbox.tsx`

```tsx
import { useChatMeta } from "@/Context/ChatMetaContext";
import { useChatActions } from "@/Context/ChatActionContext";

const Inputbox = memo(() => {
  const [mic, setMic] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const { chatSocket: socket } = useSocket();
  const inputRef = useRef<HTMLInputElement>(null); // local ref — context mein nahi
  const typingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { chatDetails, recieverIds } = useChatMeta();
  const { sendText } = useChatActions();
  const chat_id = chatDetails.chat_id;

  const dispatch = useAppDispatch();
  const replyMessage = useSelector(
    (state: RootState) => state.ChatSlice.replyMessage,
  );

  const stopTyping = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (typingRef.current) {
      typingRef.current = false;
      socket.emit(STOP_TYPING, { chat_id, reciever_ids: recieverIds });
    }
  };

  const handleTyping = (e: React.FormEvent<HTMLInputElement>) => {
    setMic(e.currentTarget.value === "");
    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit(START_TYPING, { chat_id, reciever_ids: recieverIds });
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(stopTyping, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;

    const text = input.value;
    input.value = ""; // await se pehle clear — user turant agla message type kar sake
    stopTyping(); // send ke baad bhi "typing..." na dikhe
    void sendText(text);
  };

  // JSX same — bas form pe onSubmit={handleSubmit}
});
```

### 6.5 `src/components/Chat/MediaOptions.tsx`

`file` sirf isi component ko chahiye, isliye local state rakho:

```tsx
import { useChatActions } from "@/Context/ChatActionContext";

const [file, setFile] = useState<File | null>(null);
const { sendMedia } = useChatActions();

// ...

<Modal values={show} setModal={setShow}>
  {file && show.type === "preview" && (
    <MediaPreviewContent
      file={file}
      onSend={({ file, caption }) => {
        if (sendMedia(file, caption)) {
          setFile(null);
          setShow(modalValue);
        }
      }}
    />
  )}
</Modal>;
```

### 6.6 `src/components/ModalChilds/MediaPreviewContent.tsx`

Abhi har render pe naya `createObjectURL` banta hai aur kabhi revoke nahi hota (memory leak). Caption state bhi use nahi hota:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";
import Image from "next/image";

const MediaPreviewContent = ({
  file,
  onSend,
}: {
  file: File;
  onSend: (data: { file: File; caption: string }) => void;
}) => {
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ek file ka ek hi URL, aur unmount pe free
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {previewUrl && (
          <Image
            priority
            src={previewUrl}
            alt="preview"
            height={400}
            width={400}
            className="max-h-full max-w-full object-contain rounded-2xl"
          />
        )}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 h-12 rounded-full bg-white/10 px-4 text-white outline-none placeholder:text-gray-400"
          />
          <button
            onClick={() => onSend({ file, caption })}
            className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewContent;
```

### 6.7 `src/components/Chat/Messages.tsx` — har bubble sirf APNA upload job dekhe

```tsx
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useChatMeta } from "@/Context/ChatMetaContext";
import { useChatActions } from "@/Context/ChatActionContext";

// purana useChat() wala block hata ke:
const { chatDetails } = useChatMeta();
const { pauseUpload, resumeUpload, cancelUpload, retryMessage } =
  useChatActions();

// Sirf is message ka job — dusre message ka progress badle to ye bubble re-render NAHI hogi
const upload = useSelector((state: RootState) =>
  msg.client_msg_id ? state.UploadSlice.jobs[msg.client_msg_id] : undefined,
);
const progress = upload?.progress ?? 0;
const canResume = upload?.status === "paused" || upload?.status === "failed";

// render ke andar ka console.log hata do (line ~83)
```

Overlay ke controls:

```tsx
{
  msg.isLocal && upload && msg.client_msg_id && (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      {/* circular progress SAME — bas `progress` variable ab upar wala hai */}

      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            canResume
              ? resumeUpload(msg.client_msg_id!)
              : pauseUpload(msg.client_msg_id!)
          }
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
        >
          {canResume ? "▶" : "❚❚"}
        </button>
        <button
          onClick={() => cancelUpload(msg.client_msg_id!)}
          className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition"
        >
          ✕
        </button>
      </div>

      <p className="text-white text-sm font-medium">
        {upload.status === "paused" && "Upload Paused"}
        {upload.status === "failed" && "Upload Failed — tap ▶ to retry"}
        {upload.status === "uploading" && "Uploading..."}
      </p>
    </div>
  );
}
```

Text message fail hone pe bubble ke neeche retry dikhao:

```tsx
{
  msg.send_status === "failed" && (
    <button
      onClick={() => retryMessage(msg)}
      className="text-xs text-red-500 mt-1"
    >
      ⚠ Not sent — tap to retry
    </button>
  );
}
```

---

## Step 7 — Per-chat UI state, timerRef, typing 🟠

**Problem:**

- `replyMessage`, `selectedMessages` aur `typing` global hain, toh ek chat ka reply/typing dusri chat mein dikh jaata hai.
- `setTyping` payload ignore karke toggle karta hai.
- Long-press aur seen-batch dono ek hi `timerRef` use karte hain, toh ek dusre ka timer cancel kar dete hain.
- `STOP_TYPING` miss ho gaya toh "Typing…" hamesha dikhta rahega.

### 7.1 `src/redux/slices/ChatSlice.tsx`

```ts
import { MessageItem } from "@/lib/dummy";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface initialStateProps {
  replyMessage: MessageItem | null;
  selectedMessages: number[];
  typingChatIds: number[]; // kis kis chat mein koi type kar raha hai
  show: string | number | null;
}

const initialState: initialStateProps = {
  selectedMessages: [],
  typingChatIds: [],
  replyMessage: null,
  show: null,
};

export const ChatSlice = createSlice({
  name: "Chats",
  initialState,
  reducers: {
    setReplyMessage: (state, action) => {
      state.replyMessage = action.payload;
    },
    // toggle nahi — jo bola wahi set karo
    setTyping: (
      state,
      action: PayloadAction<{ chatId: number; typing: boolean }>,
    ) => {
      const { chatId, typing } = action.payload;
      const exists = state.typingChatIds.includes(chatId);
      if (typing && !exists) state.typingChatIds.push(chatId);
      if (!typing && exists) {
        state.typingChatIds = state.typingChatIds.filter((id) => id !== chatId);
      }
    },
    setShow: (state, action) => {
      state.show = action.payload;
    },
    setSelectedMessages: (state, action) => {
      state.selectedMessages = action.payload;
    },
    // chat chhodte waqt reply/selection saaf
    resetChatUi: (state) => {
      state.replyMessage = null;
      state.selectedMessages = [];
    },
  },
});

export const {
  setSelectedMessages,
  setShow,
  setTyping,
  setReplyMessage,
  resetChatUi,
} = ChatSlice.actions;

export default ChatSlice.reducer;
```

`ChatPage.tsx` mein:

```tsx
useEffect(() => {
  return () => {
    dispatch(resetChatUi());
  };
}, [id, dispatch]);
```

Bonus: Sidebar ki chat list mein bhi `typingChatIds.includes(chat.chat_id)` se "typing…" dikha sakte ho.

### 7.2 Socket handlers UI component se bahar — naya file `src/lib/useChatSocketSync.tsx`

```tsx
import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useSocket } from "@/layouts/SocketWrapper";
import { useAppDispatch, useSocketEvents } from "./hooks";
import { RootState } from "@/redux/store";
import { setTyping } from "@/redux/slices/ChatSlice";
import { Message, message_reactions, seen_user } from "./dummy";
import {
  EDIT_MESSAGE,
  MESSAGE_REACTION,
  MESSAGE_SEEN,
  REFETCH_CHATS,
  START_TYPING,
  STOP_TYPING,
} from "./events";
import {
  editMessage,
  reactMessage,
  refetchChat,
  seenMessage,
} from "./cacaheupdateutils";

const TYPING_EXPIRE_MS = 5000;

type TypingPayload = { chat_id?: number } | undefined;

export const useChatSocketSync = (chatId: number) => {
  const { chatSocket: socket } = useSocket();
  const dispatch = useAppDispatch();
  const userId = useSelector((state: RootState) => state.userSlice.id);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlers = useMemo(() => {
    const clearTypingTimer = () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    return {
      [START_TYPING]: (data: TypingPayload) => {
        const id = data?.chat_id ?? chatId;
        dispatch(setTyping({ chatId: id, typing: true }));
        // STOP_TYPING miss ho jaye (network drop) to bhi 5s mein hata do
        clearTypingTimer();
        typingTimeoutRef.current = setTimeout(
          () => dispatch(setTyping({ chatId: id, typing: false })),
          TYPING_EXPIRE_MS,
        );
      },
      [STOP_TYPING]: (data: TypingPayload) => {
        clearTypingTimer();
        dispatch(setTyping({ chatId: data?.chat_id ?? chatId, typing: false }));
      },
      [REFETCH_CHATS]: (data: Message[]) => {
        if (data?.length) refetchChat(dispatch, data, chatId);
      },
      [MESSAGE_REACTION]: (data: message_reactions) => {
        if (data && userId) reactMessage(dispatch, data, chatId);
      },
      [MESSAGE_SEEN]: (data: seen_user[]) => {
        if (data) seenMessage(dispatch, chatId, data);
      },
      [EDIT_MESSAGE]: (data: Message) => {
        editMessage(dispatch, chatId, data);
      },
    };
  }, [dispatch, chatId, userId]);

  useSocketEvents(socket, handlers);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);
};
```

`ChatPage.tsx` mein `useChatRoom` ke saath:

```tsx
useChatSocketSync(id);
```

Aur `VirtualChatListgrouped.tsx` se `handler` wala `useMemo` aur `useSocketEvents(socket, handler)` **hata do**.

### 7.3 `VirtualChatListgrouped.tsx` — alag timers + seen sirf jab tab visible ho

```tsx
import { useEffectEvent } from "react";
import { useChatMeta } from "@/Context/ChatMetaContext";
import { useChatActions } from "@/Context/ChatActionContext";
const { chatDetails } = useChatMeta();
const { chat_id, user_id: chat_user_id } = chatDetails;

const typing = useSelector((state: RootState) =>
  state.ChatSlice.typingChatIds.includes(chat_id),
);

// do alag kaam → do alag refs (prop wala timerRef hata do)
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

// user tab pe wapas aaya → pending seen bhej do
useEffect(() => {
  const onVisibilityChange = () => flushSeen();
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () =>
    document.removeEventListener("visibilitychange", onVisibilityChange);
}, []);
```

`src/lib/dummy.ts` ke `chatListProps` se `timerRef` hata do, `messageMap` add karo:

```ts
export interface chatListProps {
  menu: boolean;
  setMenu: Dispatch<SetStateAction<boolean>>;
  setCursor: Dispatch<SetStateAction<number | null>>;
  hasMore: boolean;
  nextCursor: number;
  data: ChatItem[];
  messageMap: Map<number, Message>;
  isFetching: boolean;
  messages: Message[];
  cursor: number | null;
}
```

`MessageboxProps.startPressTimer` ka type `() => void` kar do.

---

## Step 8 — Selectors + virtual list performance 🟡

**Problem:**

- `selectFromResult` **har Redux action** pe chalta hai (typing, online users, sab pe). Ye har baar naye arrays banata hai (`flatData`, `memberIds`, `mappedMessages`),
  toh shallow-compare fail hota hai aur **ChatPage har action pe re-render** hota hai.
- Header ka id `crypto.randomUUID()` hai, toh har baar naya key banta hai.
- Rows `key={index}` use karti hain, toh purane messages prepend hote hi saare rows remount ho jaate hain.

### 8.1 Naya file: `src/lib/chatGrouping.ts`

```ts
import { ChatItem, Message } from "./dummy";

const dateLabel = (date: Date, today: Date, yesterday: Date) => {
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Messages already time ke order mein hain → ek pass mein header + messages
export const groupMessagesByDate = (messages: Message[]): ChatItem[] => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const items: ChatItem[] = [];
  let lastLabel: string | null = null;

  for (const msg of messages) {
    const label = dateLabel(new Date(Number(msg.created_at)), today, yesterday);
    if (label !== lastLabel) {
      items.push({ kind: "header", id: `header-${label}`, date: label }); // stable id
      lastLabel = label;
    }
    items.push({ ...msg, kind: "message" });
  }

  return items;
};
```

### 8.2 `ChatPage.tsx` — queries

```tsx
import { groupMessagesByDate } from "@/lib/chatGrouping";

const { data: chatDetails, isLoading: isChatLoading } = useGetAllChatsQuery(
  {},
  {
    selectFromResult: ({ data, isLoading }) => ({
      // find() cache ka hi object lautata hai → reference stable
      data: data?.data?.getAllChats?.data?.items?.find(
        (item: Chat) => item.chat_id === id,
      ) as Chat | undefined,
      isLoading,
    }),
  },
);

const { messages, nextCursor, hasMore, isLoading, isFetching, refetch } =
  useGetSingleChatQuery(
    { chat_ids: [id], cursor, limit: 20 },
    {
      // sirf cache ke references lautao — yahan naya array/object MAT banao
      selectFromResult: ({ data, isLoading, isFetching }) => ({
        messages: data?.data?.getChatById?.data?.items as Message[] | undefined,
        nextCursor: data?.data?.getChatById?.data?.nextCursor,
        hasMore: data?.data?.getChatById?.data?.hasMore,
        isLoading,
        isFetching,
      }),
      refetchOnMountOrArgChange: true,
    },
  );

// heavy kaam useMemo mein — sirf tab jab messages array badle
const groupedMessages = useMemo(
  () => groupMessagesByDate(messages ?? []),
  [messages],
);
const messageMap = useMemo(
  () => new Map((messages ?? []).map((m) => [m.id, m])),
  [messages],
);

const { members } = useGetMembersQuery(
  { chat_id: id },
  {
    selectFromResult: ({ data }) => ({
      members: data?.data?.getMembers?.data?.items as memberProps[] | undefined,
    }),
    skip: chat_type !== "group",
  },
);
const memberIds = useMemo(
  () => members?.map((m) => m.member_id) ?? [],
  [members],
);

const selecteds = useMemo(() => {
  const selected = messageMap.get(selectedMessages[0]);
  return {
    message: selected?.content,
    sender_id: selected?.sender_id,
    id: selected?.id,
  };
}, [messageMap, selectedMessages]);
```

### 8.3 `VirtualChatListgrouped.tsx`

```tsx
// typing row sirf tab jab koi type kar raha ho, stable id ke saath
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
  getScrollElement: () => parentRef.current,
  // id se key → prepend pe rows remount nahi hongi, measured height bhi sahi row ke paas rahegi
  getItemKey: (index) => data[index].id,
  estimateSize: () => 72, // 10 bahut kam tha → scroll jump karta tha
  overscan: 10,
  measureElement: (el) => el.getBoundingClientRect().height,
});
```

Render mein teeno jagah `key={virtualItem.index}` ko `key={virtualItem.key}` kar do.

Reply lookup O(n) `find` se O(1) Map pe:

```tsx
const repliedMessage =
  msg.reply_to_message_id !== null
    ? (messageMap.get(msg.reply_to_message_id) ?? null)
    : null;
```

Naya message aane pe auto-scroll (khud bheja ho, ya user already neeche ho):

```tsx
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
```

Ye **dead code hata do**:

- `chatContainerRef` aur uska `useEffect` (ref kahin attach hi nahi hai)
- `hasMountedRef` wala `useEffect` (`initialScrollDone` wala `useLayoutEffect` same kaam karta hai)
- `useSendMessage` ka `scrollToBottom` / `messagesEndRef`

Layout: `height: "83vh"` ki jagah parent ko `flex flex-col h-full` aur list ko `className="flex-1 min-h-0 overflow-y-auto"` do, taaki har screen pe fit ho.

---

## Step 9 — Error handling 🟡

### 9.1 `src/redux/Apis/BaseApi.tsx` — `baseQueryWithReauth` replace karo

Problems:

- Har error pe toast aata hai (`jwt expired` pe bhi, refresh se pehle).
- Refresh fail branch mein `logOutPromise` reset nahi hota.
- `import { log } from "node:console"` client bundle mein hai.
- `controllers` / `getRequest` unused hain.

```ts
import { disconnectSockets } from "@/lib/socket";

// Backend codes bheje to unhe prefer karo; message string fallback hai
const isTokenExpired = (data: errors | null) =>
  data?.status === 401 &&
  (data.code === "TOKEN_EXPIRED" || data.message === "jwt expired");

const isInvalidToken = (data: errors | null) =>
  data?.code === "INVALID_TOKEN" || data?.message === "invalid signature";

const clearSessionAndRedirect = () => {
  disconnectSockets();
  localStorage.removeItem("persist:root");
  localStorage.removeItem("device_id");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

type BaseQueryResult = Awaited<ReturnType<typeof baseQuery>>;
let refreshPromise: Promise<BaseQueryResult> | null = null;
let logOutPromise: Promise<BaseQueryResult> | null = null;

const forceLogout = (api: BaseQueryApi, extraOptions: object) => {
  logOutPromise ??= Promise.resolve(
    baseQuery({ url: "/auth/logout", method: "POST" }, api, extraOptions),
  ).finally(() => {
    logOutPromise = null;
    clearSessionAndRedirect();
  });
  return logOutPromise;
};

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (!result.error) return result;

  const data = result.error.data as errors | null;

  if (isInvalidToken(data)) {
    await forceLogout(api, extraOptions);
    return result;
  }

  if (isTokenExpired(data)) {
    // single-flight: 10 parallel 401 → sirf 1 refresh call
    refreshPromise ??= Promise.resolve(
      baseQuery(
        { url: "/auth/refresh-token", method: "POST" },
        api,
        extraOptions,
      ),
    ).finally(() => {
      refreshPromise = null;
    });

    const refreshResult = await refreshPromise;
    if (refreshResult.error) {
      await forceLogout(api, extraOptions);
      return result;
    }

    result = await baseQuery(args, api, extraOptions); // original request retry
    if (!result.error) return result; // ✅ user ko koi toast nahi dikha
  }

  // Sirf asli errors pe toast
  const finalData = result.error.data as errors | null;
  showGlobalToast(finalData?.message ?? "Something went wrong", "error");
  return result;
};
```

`BaseQueryApi` ko `@reduxjs/toolkit/query/react` se import karo.

### 9.2 `src/redux/middlewares/erroreMiddleware.tsx`

Abhi wala `return;` action ko **reducer tak pahunchne hi nahi deta**, toh query hamesha `isLoading` mein atak jaati hai. Upar se user ko app se bahar phenk diya jaata hai.

```ts
import { Middleware, isRejectedWithValue } from "@reduxjs/toolkit";
import { showGlobalToast } from "../toastservices";

export const errorMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload as ApiErrorResponse;
    const isNetworkError =
      payload.status === "FETCH_ERROR" ||
      payload?.data?.code === "ECONNREFUSED" ||
      payload.data?.offline;

    if (isNetworkError) {
      showGlobalToast("Network issue — reconnecting…", "warning");
    }
  }

  return next(action); // action hamesha aage jaane do
};
```

### 9.3 Offline banner — naya file `src/components/Utility/NetworkBanner.tsx`

```tsx
"use client";

import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

export const useOnlineStatus = () =>
  useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

const NetworkBanner = () => {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-yellow-500 text-black text-center text-sm py-1">
      You&apos;re offline. Messages will send when you reconnect.
    </div>
  );
};

export default NetworkBanner;
```

Ise `src/app/layout.tsx` mein `<ToastProvider>` ke andar daal do.
`src/redux/Wrapper.tsx` se `window.location.href = "/offline.html"` aur `onLineRef` wala code hata do.

### 9.4 Error boundary — naya file `src/app/(main)/error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { logger } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(error);
    // Sentry lagane ke baad: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex-1 h-screen flex flex-col items-center justify-center gap-3">
      <p className="font-semibold">Something went wrong.</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-wa-primary text-white"
      >
        Try again
      </button>
    </div>
  );
}
```

Production monitoring ke liye `npx @sentry/wizard@latest -i nextjs` chalao, aur `logger.error` ke andar `Sentry.captureException` call karo.

---

## Step 10 — Cleanup + pehla test 🟢

### Cleanup checklist

- [ ] "End-to-end encrypted" notice hatao, ya sach likho. App E2E encrypted nahi hai, ye trust/legal issue hai.
- [ ] `next.config.ts` ke socket `rewrites` aur `server.ts` ka proxy, dono same kaam karte hain. Deployment ke hisaab se ek rakho.
- [ ] `NEXT_PUBLIC_DOMAIN` / `NEXT_PUBLIC_SELF_PORT` ke saare usages relative URLs se replace karo.
- [ ] `src/app/api/socket/route.ts` placeholder hatao, agar use nahi hota.
- [ ] Typos IDE ke "Rename Symbol" (F2) se theek karo: `reciever` → `receiver`, `cacaheupdateutils` → `cacheUpdateUtils`, `CHAT_LEAVED` → `CHAT_LEFT` (backend ke saath), `erroreMiddleware` → `errorMiddleware`, `dummy.ts` → `types.ts`.
- [ ] GraphQL schema repo mein hai, toh `@graphql-codegen/cli` se types generate karo, manual interfaces ki jagah.
- [ ] `getDeviceInfo` client se `ipapi.co` call karta hai. IP server pe request headers se lo (privacy + rate limit).

### Pehla test (Vitest)

```bash
pnpm add -D vitest vite-tsconfig-paths
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({ plugins: [tsconfigPaths()] });
```

`src/lib/cacaheupdateutils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createNextState as produce } from "@reduxjs/toolkit";
import {
  addMessage,
  confirmMessage,
  GetChatByIdResponse,
} from "./cacaheupdateutils";
import { Message } from "./dummy";

const emptyChat: GetChatByIdResponse = {
  data: { getChatById: { data: { items: [] } } },
};

describe("optimistic messages", () => {
  it("local message ko server message se replace karta hai", () => {
    let state = produce(
      emptyChat,
      addMessage({
        tempId: -1,
        clientMsgId: "abc",
        content: "hi",
        user_id: 1,
        replyMessage: null,
      }),
    );
    const server = {
      ...state.data.getChatById.data.items[0],
      id: 55,
    } as Message;

    state = produce(state, confirmMessage("abc", server));

    expect(state.data.getChatById.data.items).toHaveLength(1);
    expect(state.data.getChatById.data.items[0]).toMatchObject({
      id: 55,
      isLocal: false,
    });
  });

  it("broadcast pehle aa gaya ho to duplicate nahi banata", () => {
    let state = produce(
      emptyChat,
      addMessage({
        tempId: -1,
        clientMsgId: "abc",
        content: "hi",
        user_id: 1,
        replyMessage: null,
      }),
    );
    const server = {
      ...state.data.getChatById.data.items[0],
      id: 55,
    } as Message;
    state = produce(state, (draft) => {
      draft.data.getChatById.data.items.push(server); // REFETCH_CHATS se aaya
    });

    state = produce(state, confirmMessage("abc", server));

    expect(state.data.getChatById.data.items.map((m) => m.id)).toEqual([55]);
  });
});
```

`package.json` mein `"test": "vitest run"` add karo, aur `.github/workflows/ci.yml` mein `pnpm test` step daalo.
