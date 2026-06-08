import { Message } from "@/lib/dummy";
import { BaseApi } from "./BaseApi";
import {
  getAllchatsQuery,
  getEmojiQuery,
  getSingleChatQuery,
  getWallpaperQuery,
} from "@/graphql/Modules/Chat/Chat.queries";
import {
  deletMessageMutation,
  editMessageMutation,
  newChatMutation,
  replyMessageMutation,
  sendMessageMutation,
  setWallPaperMutation,
} from "@/graphql/Modules/Chat/Chat.mutation";

export const chatApi = BaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllChats: builder.query({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query: getAllchatsQuery,
        },
        providesTags: ["chats"],
      }),
      providesTags: ["chats"],
    }),
    getSingleChat: builder.query({
      query: ({ chat_ids, limit = 20, cursor = null }) => ({
        url: "",
        method: "POST",
        body: {
          query: getSingleChatQuery,
          variables: {
            input: { chat_ids, limit, cursor },
          },
        },
      }),
      providesTags: (result) => {
        // console.log(result, "result.......");
        return result
          ? [
              ...result.data?.getChatById?.data?.items?.map((msg: Message) => ({
                type: "chats" as const,
                id: msg.id,
              })),
              { type: "chats", id: "LIST" },
            ]
          : [{ type: "chats", id: "LIST" }];
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        // chat_ids se unique key banao, cursor ko ignore karo taaki merge ho sake
        return `${endpointName}-${queryArgs.chat_ids?.join(",")}`;
      },

      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },

      merge: (currentCache, newData) => {
        const currentItems = currentCache?.data?.getChatById?.data?.items ?? [];
        const newItems = newData?.data?.getChatById?.data?.items ?? [];

        const existingIds = new Set(currentItems.map((m: Message) => m.id));
        const uniqueNewMessages = newItems.filter(
          (msg: Message) => !existingIds.has(msg.id),
        );

        // purane messages ke upar naye (older) messages prepend karo
        currentCache.data.getChatById.data.items = [
          ...uniqueNewMessages,
          ...currentItems,
        ];

        // nextCursor aur hasMore update karo
        currentCache.data.getChatById.data.nextCursor =
          newData.data.getChatById.data.nextCursor;
        currentCache.data.getChatById.data.hasMore =
          newData.data.getChatById.data.hasMore;
      },
    }),
    getEmojis: builder.query({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query: getEmojiQuery,
        },
      }),
    }),
    reactMessage: builder.mutation({
      query: ({ message_ids, react_id, chat_ids }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
                    mutation reactMessage($input:ChatInput!){
        reactMessage(input:$input){
    
    message,success,status,error
        }
    }
                    
                    `,
          variables: {
            input: {
              chat_ids,
              message_ids,
              reaction_id: parseInt(react_id),
            },
          },
        },
      }),
      invalidatesTags: ["chats"],
    }),
    newChat: builder.mutation({
      query: ({ member_id }) => ({
        url: "",
        method: "POST",
        body: {
          query: newChatMutation,
          variables: {
            member_id,
          },
        },
      }),
      invalidatesTags: ["chats"],
    }),

    sendMessage: builder.mutation({
      query: ({ content, chat_ids, reciever_ids, media }) => ({
        url: "",
        method: "POST",
        body: {
          query: sendMessageMutation,
          variables: {
            input: {
              content,
              chat_ids,
              reciever_ids,
              media,
            },
          },
        },
      }),
      invalidatesTags: ["chats"],
    }),
    replyToMessage: builder.mutation({
      query: ({ message_ids, chat_ids, content }) => ({
        url: "",
        method: "POST",
        body: {
          query: replyMessageMutation,
          variables: {
            input: {
              message_ids,
              content,
              chat_ids,
            },
          },
        },
      }),
      invalidatesTags: ["chats"],
    }),
    editMessage: builder.mutation({
      query: ({ message_id, content, chat_id }) => ({
        url: "",
        method: "POST",
        body: {
          query: editMessageMutation,
          variables: {
            input: {
              message_ids: [message_id],
              chat_ids: chat_id,
              content,
            },
          },
        },
      }),
    }),
    deleteMessages: builder.mutation({
      query: ({ message_ids, chat_ids, delete_type }) => ({
        url: "",
        method: "POST",
        body: {
          query: deletMessageMutation,
          variables: {
            input: {
              delete_type,
              message_ids,
              chat_ids,
            },
          },
        },
      }),
      invalidatesTags: [{ type: "chats", id: "LIST" }],
    }),
    setWallPaper: builder.mutation({
      query: ({ url }) => ({
        url: "",
        method: "POST",
        body: {
          query: setWallPaperMutation,
          variables: {
            url,
          },
        },
      }),
      invalidatesTags: ["wallpaper"],
    }),

    getWallpaper: builder.query({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query: getWallpaperQuery,
        },
      }),
    }),
  }),
});

export const {
  useDeleteMessagesMutation,
  useGetAllChatsQuery,
  useGetEmojisQuery,
  useGetSingleChatQuery,

  useEditMessageMutation,
  useLazyGetAllChatsQuery,
  useLazyGetEmojisQuery,
  useLazyGetSingleChatQuery,
  usePrefetch,
  useReactMessageMutation,
  useReplyToMessageMutation,
  useSendMessageMutation,
  useNewChatMutation,
  useGetWallpaperQuery,
  useLazyGetWallpaperQuery,
  useSetWallPaperMutation,
} = chatApi;
