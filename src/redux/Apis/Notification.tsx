import { getAllNotifictaionQuery } from "@/graphql/Modules/Notifications/notifications.queries";
import { BaseApi } from "./BaseApi";

export const NotificationApi = BaseApi.injectEndpoints({
    endpoints: (builder) => ({

        getNotifications: builder.query({
            query: () => ({
                url: "",
                method: 'POST',
                body: {
                    query:
                        getAllNotifictaionQuery
                }
            })
        })
    })
})

export const { useGetNotificationsQuery, useLazyGetNotificationsQuery } = NotificationApi