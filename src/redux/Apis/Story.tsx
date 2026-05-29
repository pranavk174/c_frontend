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


  interactions{
   id
  name
  seen
  liked
  seen_at
  liked_at
  profile_pic
  
  }
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
    seenStory: builder.mutation({
      query: ({ id }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
          mutation seenStory($id){
          seenStory(id:$id){
          message,status,error}
          }
          
          
          `,
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
          query: `
          
          mutation replyToStory($id: Int! , $content: String!){
          replyToStory(id:$id , content:$content){
          
          message, error , success
          }
          }
          
          `,
          variables: {
            id,
            content,
          },
        },
      }),
    }),
  }),
});

export const {
  useCreateStoryMutation,
  useGetStoriesQuery,
  useSeenStoryMutation,
  useReplyToStoryMutation,
} = storyApi;
