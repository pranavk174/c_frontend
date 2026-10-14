import { getAllNotifictaionQuery } from "@/graphql/Modules/Notifications/notifications.queries";
import { BaseApi } from "./BaseApi";

export const NotificationApi = BaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => ({
        url: "/notification",
        method: "GET",
      }),
      providesTags: ["notification"],
    }),
    seenNotification: builder.mutation({
      query: ({ notification_ids }) => ({
        url: `/notification`,
        method: "PUT",
        body: { notification_ids }
      }),
      invalidatesTags: ["notification"],
    }),
  }),
});

export const { useGetNotificationsQuery, useLazyGetNotificationsQuery, useSeenNotificationMutation } =
  NotificationApi;
