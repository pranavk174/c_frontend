export const reactMessageMutation = `
                    mutation reactMessage($input:ChatInput!){
        reactMessage(input:$input){
    
    message,success,status,error
        }
    }
                    
                    `;

export const newChatMutation = `
  
  mutation createNewChat($member_id:Int!){
  createNewChat(member_id:$member_id){
  
  message, error,success,data{
  
  ... on newChat{
  chat_id
  
  }
  
  }
  
  }
  }
  
  `;

export const editMessageMutation = `

mutation editMessage($input: ChatInput!){
editMessage(input: $input){

message,error,success,status

}
}

`;

export const sendMessageMutation = `
              
              mutation sendMessage( $input:ChatInput!){
        sendMessage(input:$input){
    
    message,status,error,success
    
        }
    }
              `;
export const replyMessageMutation = `
              
              mutation replyMessage($input:ChatInput!){
        replyMessage(input:$input){
            message,status,success,error
        }
    }
              
              
              `;
export const deletMessageMutation = `
    
              mutation DeleteMessage($input:ChatInput!) {
      deleteMessage(input:$input) {
        message
        status
        success
        error
      }
    }
              
              `;
export const setWallPaperMutation = `
          

          mutation setWallpaper($url:String!){
          setWallpaper(url:$url){
          
          message,error,success
          
          
          }}
          
          
          
          `;

export const newGroupMutation = `
           mutation createNewGroup($input: newGroupInput!){
           createNewGroup(input: $input){
           
             message,error,success
          
           }
           
           }
          
          `;


export const forwardMessageMutation = `
          
          mutation forwardMessage($input:ChatInput!){
forwardMessage(input:$input){
message,error,success
}
}
          
          
          `