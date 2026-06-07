export const getStoriesQuery = `
          
          query getAllStories{
          getAllStories{
          
          message,error,success,data {
          
          ... on StoriesData{
          
          stories{

  user_id
  name
  profile_pic
  stories{
  

      id,

  text_data,  content,  created_at,
  seen,liked,


  interactions{
   id
  name
  seen
  liked
  seen_at
  liked_at
  profile_pic
  
  }
        }    
          }
          
          }
          
          }
          }}
          
          `

