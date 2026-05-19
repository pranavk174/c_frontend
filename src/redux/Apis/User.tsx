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

  console.log(data, "result dataaa");
  // access token expired
  if (data.errors && data?.errors?.[0]?.message === "Invalid access token") {
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
  }

  return result;
};

export const UserApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
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
      }),
    }),
    getSingleChat: builder.query({
      query: ({ chat_id }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
          query getChatById($input:ChatInput!){
    getChatById(input:$input){
        message,status,success,error,data{
        ... on SingleChat {
                 items{
                     id ,
  sender_id ,
  created_at,
  seen_at,
  is_forwarded ,
  content,
  story_id ,
  is_edited ,
  reply_to_message ,
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
            input: { chat_ids: [parseInt(chat_id)] },
          },
        },
      }),
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
      query: ({ message_id, react_id, chat_id }) => ({
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
              chat_ids: [parseInt(chat_id)],
              message_ids: [parseInt(message_id)],
              reaction_id: parseInt(react_id),
            },
          },
        },
      }),
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
} = UserApi;

// export const {useRegisterMutation} = UserApi
