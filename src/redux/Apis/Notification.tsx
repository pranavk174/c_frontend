import { BaseApi } from "./BaseApi";

export const NotificationApi = BaseApi.injectEndpoints({
    endpoints: (builder) => ({

        getNotifications: builder.query({
            query: () => ({
                url: "",
                method: 'POST',
                body: {
                    query: `


                   query getNotification{
                   getNotification{
                   
                   message,status,success, data
                   {
                   ... on notifications {
                   
           items
           {
                     notification_id
                     reference_id
  notification_type
  name
  message
  time
  profile_pic
  
  }
                   }
                   }
                   }}
                    `
                }
            })
        })
    })
})

export const { useGetNotificationsQuery, useLazyGetNotificationsQuery } = NotificationApi