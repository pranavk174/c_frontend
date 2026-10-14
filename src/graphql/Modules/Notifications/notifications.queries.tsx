export const getAllNotifictaionQuery = `


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