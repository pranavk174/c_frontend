import { createStoryMutation, likeStoryMutation, replySToryMutation, seenStoryMutation } from "@/graphql/Modules/Story/stories.mutation";
import { BaseApi } from "./BaseApi";
import { getStoriesQuery } from "@/graphql/Modules/Story/stories.queries";

export const storyApi = BaseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStory: builder.mutation({
      query: ({ text_data, content, message_ids = [] }) => ({
        url: "",
        method: "POST",
        body: {
          query: createStoryMutation,
          variables: {
            input: {
              text_data,
              content,
              message_ids,
            },
          },
        },
      }),
      invalidatesTags: ["story"],
    }),
    getStories: builder.query({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query: getStoriesQuery,
        },
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
        url: "",
        method: "POST",
        body: {
          query:
            replySToryMutation,
          variables: {
            id,
            content,
          },
        },
      }),
    }),

    likeStory: builder.mutation({
      query: ({ id, like, reaction_id = null }) => ({
        url: "",
        method: "POST",
        body: {
          query:
            likeStoryMutation,
          variables: {
            input: {
              id,
              reaction_id,
              like,
            },
          },
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
