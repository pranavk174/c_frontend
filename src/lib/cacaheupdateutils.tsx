import {
  Chat,
  Message,
  message_reactions,
  reaction,
  seen_user,
  socketResponse,
} from "./dummy";
import { Draft, current } from "@reduxjs/toolkit";
import { chatApi } from "@/redux/Apis/Chat";
import { MESSAGE_SEEN } from "./events";
import { AppDispatch } from "@/redux/store";
import { Socket } from "socket.io-client";
import { } from "./utils";
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

export const addMessage =
  (
    inputText: string,
    user_id: number,
    replyMessage: Message | null,
    url: string | null = null,
  ) =>
    (draft: Draft<GetChatByIdResponse>) => {
      const items = draft?.data?.getChatById?.data?.items;

      if (!items) return;

      items.push({
        id: (items[items.length - 1]?.id || 0) + 1,
        sender_id: user_id ?? 2,
        created_at: Date.now().toString(),
        seen_at: null,
        story_id: null,
        seen_users: [],
        content: inputText,
        preview: url,
        reply_to_message_id: replyMessage?.id ?? null,
        is_forwarded: false,
        is_edited: false,
        is_deleted: false,
        reactions: [],
        isLocal: true,
      });
    };

export const updateMessage =
  (message_id?: number | null) => (draft: Draft<GetChatByIdResponse>) => {
    const items = draft?.data?.getChatById?.data?.items;

    if (!items || !message_id) return;

    items.forEach((data: Message) => {
      if (data.id === message_id) {
        return (data.isLocal = false);
      }
    });
  };

export const updateAllChatcache =
  (id: number, inputText: string) => (draft: Draft<GetAllChatResponse>) => {
    const items = draft.data.getAllChats.data.items;
    draft.data.getAllChats.data.items.forEach((item: Chat) => {
      if (item.chat_id === id) {
        item.last_message = inputText;
        item.last_message_at = new Date().toISOString();
        item.last_message_id =
          (items[items.length - 1]?.last_message_id || 0) + 1;
      }
    });
  };

export const refetchChat = (
  dispatch: AppDispatch,
  data: Message[],
  id: number,
  user_id: number,
  chatDetails: Chat,
  socket: Socket,
  cursor: number | null,
) => {
  const chatPatchResult = dispatch(
    chatApi.util.updateQueryData("getAllChats", {}, (draft) => {
      const items = draft.data.getAllChats.data.items;
      draft.data.getAllChats.data.items.forEach((item: Chat) => {
        if (item.chat_id === id) {
          item.last_message = data[0]?.content ? data[0]?.content : "image";
          item.last_message_at = data[0].created_at;
          item.last_message_id = data[0].id;
        }
      });
    }),
  );

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
          // logger.log("triggered here and exitsssss");
          draft.data.getChatById.data.items = items.map((m: Message) => {
            if (m?.id === data[0].id) {
              return { ...m, ...data[0], isLocal: false };
            }

            return m;
          });

          return;
        }

        // add new
        draft.data.getChatById.data.items = [
          ...draft.data.getChatById.data.items,
          ...data,
        ];

        const unseenNewMessages = draft.data.getChatById.data.items
          .filter(
            (m: Message) =>
              m.sender_id !== user_id &&
              (!m.seen_users || m.seen_users.length === 0),
          )
          .map((m: Message) => m.id);

        logger.log(
          unseenNewMessages,
          // current(draft.data.getChatById.data.items),
          " <<<<====in reftech message unseen new messagessssssss===>>>>",
        );

        if (unseenNewMessages.length > 0) {
          logger.log("eejhkdsahf kdfdthis unseeed message", unseenNewMessages);
          // socket.emit(
          //   MESSAGE_SEEN,
          //   {
          //     chat_id: id,
          //     message_ids: unseenNewMessages,
          //     reciever_id: chatDetails?.user_id,
          //   },
          //   (response: socketResponse) => {
          //     const patchResult3 = dispatch(
          //       chatApi.util.updateQueryData(
          //         "getSingleChat",
          //         { chat_ids: [id], cursor, limit: 20 },
          //         (draft) => {
          //           // draft?.data?.getChatById?.data?.items?.forEach(
          //           //   (chat: Message) => {
          //           //     if (
          //           //       user_id &&
          //           //       chat.sender_id !== user_id &&
          //           //       !chat.seen_users.includes(user_id) &&
          //           //       unseenNewMessages.includes(chat.id)
          //           //     ) {
          //           //       logger.log("ye condition true hai");
          //           //       chat.seen_users = [...chat.seen_users, user_id];
          //           //     }
          //           //     logger.log("ye condition false hai......");
          //           //   },
          //           // );


          //           const items = draft?.data?.getChatById?.data?.items ?? [];

          //           draft.data.getChatById.data.items = items.map((chat: Message) => {
          //             if (
          //               user_id &&
          //               chat.sender_id !== user_id &&
          //               !chat.seen_users.includes(user_id) &&
          //               unseenNewMessages.includes(chat.id)
          //             ) {
          //               chat.seen_users.push(user_id); // direct mutation
          //             }

          //             return chat;
          //           });

          //         },
          //       ),
          //     );
          //     // agar backend fail
          //     if (!response.success) {
          //       // rollback
          //       patchResult.undo();
          //       patchResult3.undo();
          //       chatPatchResult.undo();

          //       logger.log(response, "callback response");
          //     }
          //     logger.log(response, "callback response outside");
          //   },
          // );
        }
      },
    ),
  );
};

export const reactMessage = (
  dispatch: AppDispatch,
  data: message_reactions,
  id: number,
) => {
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
  const patchResult = dispatch(
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
