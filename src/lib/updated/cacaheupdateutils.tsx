import {
  Chat,
  Message,
  message_reactions,
  reaction,
  seen_user,
  socketResponse,
} from "./dummy";
import { Draft } from "@reduxjs/toolkit";

import { chatApi } from "@/redux/Apis/Chat";

import { ACK_TIMEOUT, MESSAGE_REACTION, MESSAGE_SEEN } from "../events";
import { AppDispatch } from "@/redux/store";
import { Socket } from "socket.io-client";
import {} from "../utils";
import { logger } from "@/lib/utils";

export interface GetChatByIdResponse {
  data: {
    getChatById: {
      data: {
        items: Message[];
      };
    };
  };
}

export interface GetAllChatResponse {
  data: {
    getAllChats: {
      data: {
        items: Chat[];
      };
    };
  };
}

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

export const reactMessage = (
  dispatch: AppDispatch,
  data: message_reactions,
  id: number,
) => {
  dispatch(
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
};

export const seenMessage = (
  dispatch: AppDispatch,
  id: number,
  data: seen_user[],
) => {
  dispatch(
    chatApi.util.updateQueryData(
      "getSingleChat",
      { chat_ids: [id] },
      (draft) => {
        const seenMap = new Map(data.map((d) => [d.message_id, d]));

        draft.data.getChatById.data.items.forEach((message: Message) => {
          const seenData = seenMap.get(message.id);

          // logger.log(seenData, "seen dataaaa.", seenMap);
          if (!seenData) return;

          message.seen_users = message.seen_users || [];

          if (!message.seen_users.includes(seenData.seen_user)) {
            message.seen_users = [...message.seen_users, seenData.seen_user];
          }

          message.seen_at = seenData.seen_at;
        });

        // logger.log(
        //   current(draft.data.getChatById.data.items),
        //   "latest updated dataaaaaaaa",
        // );
      },
    ),
  );
};

export const editMessage = (
  dispatch: AppDispatch,
  id: number,
  data: Message,
) => {
  dispatch(
    chatApi.util.updateQueryData(
      "getSingleChat",
      { chat_ids: [id] },
      (draft) => {
        const items = draft?.data?.getChatById?.data?.items;

        if (!items) return;

        items.forEach((msg: Message) => {
          if (msg.id === data.id) {
            msg.content = data.content;
            msg.is_edited = data.is_edited;
          }
        });
      },
    ),
  );
};

export const handleLikes = async ({
  msg_id,
  react_id,
  socket,
  user_id,
  chat_id,
  dispatch,
  chat_user_id,
}: {
  msg_id: number;
  react_id: number;
  socket: Socket;
  user_id: number | null;
  chat_id: number;
  dispatch: AppDispatch;
  chat_user_id: number;
}) => {
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
  const payload = {
    chat_ids: [chat_id],
    message_ids: [msg_id],
    react_id,
    reciever_ids: [chat_user_id],
  };
  try {
    const response: socketResponse = await socket
      .timeout(ACK_TIMEOUT)
      .emitWithAck(MESSAGE_REACTION, payload);
    if (!response.success) pathResult.undo();
  } catch {
    pathResult.undo(); // timeout / disconnect
  }
};

export const updateSeenMessage = ({
  chatDetails,
  cursor,
  message_ids,
  user_id,
  dispatch,
  socket,
}: {
  cursor: number | null;
  chatDetails: Chat;
  message_ids: number[];
  socket: Socket;
  user_id: number | null;
  dispatch: AppDispatch;
}) => {
  if (!user_id) return;
  socket.emit(
    MESSAGE_SEEN,
    {
      chat_id: chatDetails?.chat_id,
      message_ids,
      reciever_id: chatDetails?.user_id,
    },
    (response: socketResponse) => {
      if (!response.success) return;

      dispatch(
        chatApi.util.updateQueryData(
          "getSingleChat",
          { chat_ids: [chatDetails?.chat_id], cursor, limit: 20 },
          (draft) => {
            draft?.data?.getChatById?.data?.items?.forEach((chat: Message) => {
              if (
                message_ids.includes(chat.id) &&
                chat.sender_id !== user_id &&
                !chat.seen_users.includes(user_id)
              ) {
                chat.seen_users.push(user_id);
              }
            });
          },
        ),
      );

      dispatch(
        chatApi.util.updateQueryData("getAllChats", {}, (draft) => {
          const item = draft.data.getAllChats.data.items.find(
            (c: Chat) => c.chat_id === chatDetails?.chat_id,
          );

          if (item) {
            item.unread_count = Math.max(
              0,
              item.unread_count - message_ids.length,
            );
          }
        }),
      );
    },
  );
};
