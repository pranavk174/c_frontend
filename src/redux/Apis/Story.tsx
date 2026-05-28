import { BaseApi } from "./BaseApi";

export const storyApi = BaseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStory: builder.mutation({
      query: ({ text_data, content, message_ids = [] }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
                    mutation createStory($input:createStoryInput!){
                    createStory(input:$input){
                    
                    message,success,status,error
                    
                    }}
                    
                    `,
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
          query: `
          
          query getAllStories{
          getAllStories{
          
          message,error,success,data {
          
          ... on StoriesData{
          
          stories{

  user_id
  name
  profile_pic
  stories{
  

      id,

  text_data,  content,  created_at,
likes_count,
  expires_at,
        }    
          }
          
          }
          
          }
          }}
          
          `,
        },
      }),
      providesTags: ["story"],
    }),
  }),
});

export const { useCreateStoryMutation, useGetStoriesQuery } = storyApi;
