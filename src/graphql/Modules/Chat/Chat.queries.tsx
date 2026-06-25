export const getAllchatsQuery = `
                
                query getAllChats{
        getAllChats{
            message,error,success,
            status, data{
                ... on AllChats{
                    items{
                        user_id,
                              isOnline,
                        name,profile_pic,last_message,last_message_at,chat_type,
                        chat_id
                        cover_pic,
                          bio
                          blocked
                          unread_count
      email
      mobile
                    }
                }
            }
        }
    }
                
                
                `
export const getSingleChatQuery = `
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
      story_item,
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
              `
export const getEmojiQuery = `
              
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
    
                    `

export const getWallpaperQuery = `
          
         query getWallPaper{
         getWallPaper{
         
         error,message,success,data{
         
         __typename
         ... on Wallpaper {
         
         url 
         
         }
         
         }
         
         }}
          `

export const getMemberQuery = `

query getMembers($input:ChatInput!){
    getMembers(input:$input){
        success,message,error,status,
        data{
            ... on members {
           
               items {
                   member_id,
                   role
               }
       
            }
        }
    }
}

`