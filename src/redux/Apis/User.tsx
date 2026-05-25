import { Message } from "@/lib/dummy";
import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:3000/graphql",
  credentials: "include",
});

export interface GraphQLErrorLocation {
  line: number;
  column: number;
}

export interface GraphQLError {
  message: string;
  locations: GraphQLErrorLocation[];
  path: string[];
}

export interface GraphQLResponse<T> {
  data: T | null;
  errors?: GraphQLError[];
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  const data = result.data as GraphQLResponse<unknown>;

  // console.log(data, result, "result dataaa");
  // access token expired
  if (
    data &&
    data.errors &&
    data?.errors?.[0]?.message === "Invalid access token"
  ) {
    // refresh token call
    const refreshResult = await baseQuery(
      {
        url: "",
        method: "POST",
        body: {
          query: `
          mutation generateRefreshToken{
    generateRefreshToken{
        message,status,success,error
    }
}
          
          
          `,
        },
      },
      api,
      extraOptions,
    );

    // refresh success
    if (refreshResult.data) {
      // retry original api
      result = await baseQuery(args, api, extraOptions);
    } else {
      // logout user
      localStorage.removeItem("user");

      // optional redirect
      window.location.href = "/login";
    }
  } else if (!data) {
    throw new Error("Internal Server Error");
  }

  return result;
};

export const UserApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["chats"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ email }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
                    
             mutation sendOtpMail ($email:String!){
    sendOtpMail(email:$email){
        message,success,status

    }
}
                    
                    `,
          variables: { email },
        },
      }),
    }),
    verifyOtp: builder.mutation({
      query: ({
        email,
        otp,
        device_id,
        ip_address,
        location,
        device_name,
      }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
                    
                    mutation verifyOtp ($input:verifyOtpInput!){
                                        verifyOtp(input:$input){
                                        message,success,status data{
                                      
                                        ... on verifyOtpData {
                                        email,
                                        is_verified
                                        
                                        }
                                        ... on User {
                                        
                                        id
                                        user_name
                                        email
                                        }
                                        
                                        }
                                            }
                                        }
                    
                    `,
          variables: {
            input: {
              email,
              otp,
              device_id,
              ip_address,
              location,
              device_name,
            },
          },
        },
      }),
    }),
    getAllChats: builder.query({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query: `
            
            query getAllChats{
    getAllChats{
        message,error,success,
        status, data{
            ... on AllChats{
                items{
                    user_id,
                    name,profile_pic,last_message,last_message_at,chat_type,
                    chat_id
                }
            }
        }
    }
}
            
            
            `,
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
          query: `
          query getChatById($input:ChatInput!){
    getChatById(input:$input){
        message,status,success,error,data{
        ... on SingleChat {

        nextCursor,
        hasMore,
                 items{
                     id ,
  sender_id ,
  created_at,
  seen_at,
  is_forwarded ,
  preview,
  content,
  story_id ,
  is_edited ,
  seen_users,
  reply_to_message_id ,
  is_deleted ,
  reactions{

   react_id,
  user_id
  
  
  }
                 }
            }
        }
    }
}
          `,
          variables: {
            input: { chat_ids, limit, cursor },
          },
        },
      }),
      providesTags: (result) => {
        // console.log(result, "result.......");
        return result
          ? [
              ...result.data.getChatById.data.items.map((msg: Message) => ({
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
          query: `
          
          query getEmojis{
    getEmojis{
        message,error,status,data{
            
            ... on Emojis{
                items{
                    react_id,emoji
                }
            }
        }
    }
}

                `,
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

    sendMessage: builder.mutation({
      query: ({ content, chat_ids, reciever_ids, media }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
          
          mutation sendMessage( $input:ChatInput!){
    sendMessage(input:$input){

message,status,error,success

    }
}
          `,
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
          query: `
          
          mutation replyMessage($input:ChatInput!){
    replyMessage(input:$input){
        message,status,success,error
    }
}
          
          
          `,
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
    deleteMessages: builder.mutation({
      query: ({ message_ids, chat_ids, delete_type }) => ({
        url: "",
        method: "POST",
        body: {
          query: `

          mutation DeleteMessage($input:ChatInput!) {
  deleteMessage(input:$input) {
    message
    status
    success
    error
  }
}
          
          `,
          variables: {
            input: {
              delete_type,
              message_ids,
              chat_ids,
            },
          },
        },
      }),
      invalidatesTags: ["chats"],
    }),
  }),
});

export const {
  useLoginMutation,
  useVerifyOtpMutation,
  useGetAllChatsQuery,
  useLazyGetAllChatsQuery,
  useGetSingleChatQuery,
  useLazyGetSingleChatQuery,
  useGetEmojisQuery,
  useLazyGetEmojisQuery,
  useReactMessageMutation,
  useSendMessageMutation,
  useReplyToMessageMutation,
  useDeleteMessagesMutation,
} = UserApi;

// export const {useRegisterMutation} = UserApi
