import { profileProps } from "@/lib/dummy";
import { BaseApi } from "./BaseApi";

export const authApi = BaseApi.injectEndpoints({
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
    refreshToken: builder.mutation({
      query: () => ({
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
      }),
    }),
    getUser: builder.query({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query: `
              
              query getUser{
              
              getUser{
              message , error,success, data {
              ... on User {
              
              name
      id
      user_name
      email
      bio
      mobile
      profile_pic
      cover_pic
    
              
              }
              }
              }
              }
              
              `,
        },
      }),
      providesTags: ["User"],
    }),
    updateUser: builder.mutation({
      query: ({ name, profile_pic, bio, cover_pic }: profileProps) => ({
        url: "",
        method: "POST",
        body: {
          query: `
              
              mutation updateUser($input: UpdateUserInput){
              updateUser(input:$input){
              message, status,success,error}
              }
              
              `,
          variables: {
            input: {
              name,
              profile_pic,
              bio,
              cover_pic,
            },
          },
        },
      }),
      invalidatesTags: ["User"],
    }),
    blockUser: builder.mutation({
      query: ({ user_id: blocked_user_id, reason }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
              mutation blockUser($input:blockUserInput!){
              
              blockUser(input:$input){
              message , success, error}
              
    
              }
              
              `,
          variables: {
            input: {
              blocked_user_id,
              reason,
            },
          },
        },
      }),
      invalidatesTags: ["chats"],
    }),
    unBlockUser: builder.mutation({
      query: ({ user_id: blocked_user_id }) => ({
        url: "",
        method: "POST",
        body: {
          query: `
              
              mutation unBlockUser($input:blockUserInput!){
              unBlockUser(input:$input){
              
              message ,
    error,success
    
    
              
              }
              
              }
              
    
              `,
          variables: {
            input: {
              blocked_user_id,
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
  useBlockUserMutation,
  useGetUserQuery,
  useLazyGetUserQuery,
  useRefreshTokenMutation,
  useUnBlockUserMutation,
  useUpdateUserMutation,
  useVerifyOtpMutation,
  usePrefetch,
} = authApi;
