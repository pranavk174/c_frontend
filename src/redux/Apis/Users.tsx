import { profileProps } from "@/lib/dummy";
import { BaseApi } from "./BaseApi";
import {
  blockUserMutation,
  createUserMutation,
  loginMutation,
  logoutMutaion,
  refreshTokenGenerateMutation,
  unBlockUserMutation,
  updatePreference,
  updateUserMutation,
  verifyOtpMutation,
} from "@/graphql/Modules/Users/User.mutation";
import {
  getAllUsersQuery,
  getUserQuery,
} from "@/graphql/Modules/Users/User.queries";

export const authApi = BaseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ email }) => ({
        url: "/auth/send-otp",
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      }),
      invalidatesTags: ["User"],
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
        url: "/auth/verify-otp",
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          device_id,
          ip_address,
          location,
          device_name,
        }),
      }),
      invalidatesTags: ["User"],
    }),
    createUser: builder.mutation({
      query: ({ formData }) => ({
        url: "/auth/create-user",
        method: "POST",
        body: JSON.stringify({
          formData,
        }),
      }),
      invalidatesTags: ["User"],
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh-token",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    getUser: builder.query({
      query: () => ({
        url: "/user/single-user",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    getUsers: builder.query({
      query: () => ({
        url: "/user/all-users",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    updateUser: builder.mutation({
      query: ({ name, profile_pic, bio, cover_pic, theme }: profileProps) => ({
        url: "/user/single-user",
        method: "PUT",
        body: JSON.stringify({
          name,
          profile_pic,
          bio,
          cover_pic,
          theme,
        }),
      }),
      invalidatesTags: ["User"],
    }),
    updatePreference: builder.mutation({
      query: ({ theme }) => ({
        url: "/user/single-user",
        method: "PATCH",
        body: JSON.stringify({
          query: updatePreference,
          variables: {
            input: { theme },
          },
        }),
      }),
    }),
    blockUser: builder.mutation({
      query: ({ user_id: blocked_user_id, reason }) => ({
        url: "/user/block-user",
        method: "PUT",
        body: JSON.stringify({
          blocked_user_id,
          reason,
        }),
      }),
      invalidatesTags: ["chats"],
    }),
    unBlockUser: builder.mutation({
      query: ({ user_id: blocked_user_id }) => ({
        url: "/user/unblock-user",
        method: "PUT",
        body: JSON.stringify({
          blocked_user_id,
        }),
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
  useUpdatePreferenceMutation,
  useVerifyOtpMutation,
  usePrefetch,
} = authApi;
