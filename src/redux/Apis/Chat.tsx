import { Message } from "@/lib/dummy";
import { BaseApi } from "./BaseApi";
import { logger } from "@/lib/utils";

import {
  editMessageMutation,
  replyMessageMutation,
  sendMessageMutation,
} from "@/graphql/Modules/Chat/Chat.mutation";

export const chatApi = BaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllChats: builder.query({
      query: () => ({
        url: "/chat/all-chats",
        method: "GET",
      }),
      providesTags: ["chats"],
    }),

    getSingleChat: builder.query({
      query: ({ chat_ids, limit = 20, cursor = null }) => ({
        url: "/chat/single-chat",
        method: "GET",
        params: {
          chat_ids,
          limit,
          cursor,
        },
      }),
      providesTags: (result) => {
        // logger.log(result, "result.......");
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

      merge: (currentCache, newData, { arg }) => {
        // cursor null means fresh/initial load — replace cache completely
        if (arg.cursor === null || arg.cursor === undefined) {
          currentCache.data.getChatById.data.items =
            newData.data.getChatById.data.items;
          currentCache.data.getChatById.data.nextCursor =
            newData.data.getChatById.data.nextCursor;
          currentCache.data.getChatById.data.hasMore =
            newData.data.getChatById.data.hasMore;
          return;
        }

        // cursor present means pagination — prepend older messages
        const currentItems = currentCache?.data?.getChatById?.data?.items ?? [];
        const newItems = newData?.data?.getChatById?.data?.items ?? [];

        const existingIds = new Set(currentItems.map((m: Message) => m.id));
        const uniqueNewMessages = newItems.filter(
          (msg: Message) => !existingIds.has(msg.id),
        );

        currentCache.data.getChatById.data.items = [
          ...uniqueNewMessages,
          ...currentItems,
        ];

        currentCache.data.getChatById.data.nextCursor =
          newData.data.getChatById.data.nextCursor;
        currentCache.data.getChatById.data.hasMore =
          newData.data.getChatById.data.hasMore;
      },
    }),
    getMembers: builder.query({
      query: ({ chat_id }) => ({
        url: `/chat/group/get-members/${chat_id}`,
        method: "GET",
      }),
    }),
    getEmojis: builder.query({
      query: () => ({
        url: "/chat/get-emojis",
        method: "GET",
      }),
      providesTags: ["emoji"],
    }),
    reactMessage: builder.mutation({
      query: ({ message_ids, react_id, chat_ids }) => ({
        url: "",
        method: "POST",
        body: {
          chat_ids,
          message_ids,
          reaction_id: parseInt(react_id),
        },
      }),
      invalidatesTags: ["chats"],
    }),
    newChat: builder.mutation({
      query: ({ member_id }) => ({
        url: "/chat/single-chat",
        method: "POST",
        body: { member_id },
      }),
      invalidatesTags: ["chats"],
    }),
    createNewGroup: builder.mutation({
      query: ({ groupName, profile_pic, members, cover_pic }) => ({
        url: "/chat/group/group-crud",
        method: "Post",
        body: JSON.stringify({
          groupName,
          profile_pic,
          member_ids: members,
          cover_pic,
        }),
      }),
    }),

    sendMessage: builder.mutation({
      query: ({
        content,
        chat_ids,
        reciever_ids,
        media,
        message_ids = [],
      }) => ({
        url: "/chat/message",
        method: "POST",
        body: {
          chat_ids,
          content,
          media,
          reciever_ids,
          message_ids,
        },
      }),
      invalidatesTags: ["chats"],
    }),
    replyToMessage: builder.mutation({
      query: ({ message_ids, chat_ids, content }) => ({
        url: "",
        method: "POST",
        body: {
          message_ids,
          content,
          chat_ids,
        },
      }),
      invalidatesTags: ["chats"],
    }),
    editMessage: builder.mutation({
      query: ({ message_id, content, chat_id }) => ({
        url: "",
        method: "POST",
        body: {
          message_ids: [message_id],
          chat_ids: chat_id,
          content,
        },
      }),
    }),
    deleteMessages: builder.mutation({
      query: ({ message_ids, chat_ids, delete_type }) => ({
        url: "/chat/single-chat",
        method: "DELETE",
        body: {
          delete_type,
          message_ids,
          chat_ids,
        },
      }),
      invalidatesTags: [{ type: "chats", id: "LIST" }],
    }),

    forwardMessage: builder.mutation({
      query: ({ reciever_ids, chat_ids, message_ids }) => ({
        url: "/chat/all-chats",
        method: "POST",
        body: {
          reciever_ids,
          chat_ids,
          message_ids,
        },
      }),
      invalidatesTags: ["chats"],
    }),
    setWallPaper: builder.mutation({
      query: ({ url }) => ({
        url: "/chat/wallpaper",
        method: "POST",
        body: JSON.stringify({
          url,
        }),
      }),
      invalidatesTags: ["wallpaper"],
    }),
    getWallpaper: builder.query({
      query: () => ({
        url: "/chat/wallpaper",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useDeleteMessagesMutation,
  useGetAllChatsQuery,
  useGetEmojisQuery,
  useGetSingleChatQuery,
  useGetMembersQuery,
  useLazyGetMembersQuery,
  useEditMessageMutation,
  useLazyGetAllChatsQuery,
  useLazyGetEmojisQuery,
  useLazyGetSingleChatQuery,
  useCreateNewGroupMutation,
  usePrefetch,
  useReactMessageMutation,
  useForwardMessageMutation,
  useReplyToMessageMutation,
  useSendMessageMutation,
  useNewChatMutation,
  useGetWallpaperQuery,
  useLazyGetWallpaperQuery,
  useSetWallPaperMutation,
} = chatApi;
