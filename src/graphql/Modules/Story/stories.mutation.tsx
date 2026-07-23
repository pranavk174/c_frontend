export const createStoryMutation = `
                    mutation createStory($input:createStoryInput!){
                    createStory(input:$input){
                    
                    message,success,status,error
                    
                    }}
                    
                    `
export const seenStoryMutation = `
          mutation seenStory($id){
          seenStory(id:$id){
          message,status,error}
          }
          
          
          `


export const replySToryMutation = `
          
          mutation replyToStory($id: Int! , $content: String!){
          replyToStory(id:$id , content:$content){
          
          message, error , success
          }
          }
          
          `
export const likeStoryMutation = `

          mutation likeStory($input:storyLikeInput!){
          likeStory(input:$input){
          
          message,error,status
          
          }
          
          
          }
          `
