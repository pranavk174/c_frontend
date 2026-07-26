import { createStoryMutation, likeStoryMutation, replySToryMutation, seenStoryMutation } from "@/graphql/Modules/Story/stories.mutation";
import { BaseApi } from "./BaseApi";
import { getStoriesQuery } from "@/graphql/Modules/Story/stories.queries";

export const storyApi = BaseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStory: builder.mutation({
      query: ({ text_data, content, message_ids = [] }) => ({
        url: "/story/crud",
        method: "POST",
        body: {
          text_data,
          content,
          message_ids,
        },
      }),
      invalidatesTags: ["story"],
    }),
    getStories: builder.query({
      query: () => ({
        url: "/story/crud",
        method: "GET",
      }),
      providesTags: ["story"],
    }),
    seenStory: builder.mutation({
      query: ({ id }) => ({
        url: "",
        method: "POST",
        body: {
          query:

            seenStoryMutation,
          variables: {
            id,
          },
        },
      }),
    }),

    replyToStory: builder.mutation({
      query: ({ id, content }) => ({
        url: "/story/reply",
        method: "POST",
        body: {

          id,
          content,
        }
      }),
      invalidatesTags: ["story"],
    }),

    likeStory: builder.mutation({
      query: ({ id, like, reaction_id = null }) => ({
        url: "/story/like",
        method: "POST",
        body: {
          id,
          reaction_id,
          like,


        },
      }),
      invalidatesTags: ["story"],
    }),
  }),
});

export const {
  useCreateStoryMutation,
  useGetStoriesQuery,
  useSeenStoryMutation,
  useReplyToStoryMutation,
  useLikeStoryMutation,
} = storyApi;
