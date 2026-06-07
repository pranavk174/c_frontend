import { profileProps } from "@/lib/dummy";
import { BaseApi } from "./BaseApi";
import { blockUserMutation, createUserMutation, loginMutation, logoutMutaion, refreshTokenGenerateMutation, unBlockUserMutation, updateUserMutation, veridyOtpMutation } from "@/graphql/Modules/Users/User.mutation";
import { getAllUsersQuery, getUserQuery } from "@/graphql/Modules/Users/User.queries";

export const authApi = BaseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ email }) => ({
        url: "",
        method: "POST",
        body: {
          query: loginMutation,
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
          query: veridyOtpMutation,
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
    createUser: builder.mutation({

      query: ({ formData }) => ({

        url: "",
        method: 'POST',
        body: {
          query: createUserMutation
          , variables: {
            input: formData
          }
        }
      }),
      invalidatesTags: ['User']
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query: refreshTokenGenerateMutation,
        },
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '',
        method: "POST",

        body: {
          query: logoutMutaion
        }


      })
      , invalidatesTags: ['User']
    }),

    getUser: builder.query({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query:
            getUserQuery,
        },
      }),
      providesTags: ["User"],
    }),
    getUsers: builder.query({
      query: () => ({
        url: "",
        method: "POST",
        body: {
          query:
            getAllUsersQuery,
        },
      }),
      providesTags: ["User"],
    }),
    updateUser: builder.mutation({
      query: ({ name, profile_pic, bio, cover_pic }: profileProps) => ({
        url: "",
        method: "POST",
        body: {
          query: updateUserMutation,
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
          query:
            blockUserMutation,
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
          query:
            unBlockUserMutation,
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
  useCreateUserMutation,
  useBlockUserMutation,
  useLogoutMutation,
  useGetUserQuery,
  useGetUsersQuery,
  useLazyGetUserQuery,
  useRefreshTokenMutation,
  useUnBlockUserMutation,
  useUpdateUserMutation,

  useVerifyOtpMutation,
  usePrefetch,
} = authApi;
