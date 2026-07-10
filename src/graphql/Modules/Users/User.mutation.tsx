export const refreshTokenGenerateMutation = `
          mutation generateRefreshToken{
    generateRefreshToken{
        message,status,success,error
    }
}
          
          
          `;

export const loginMutation = `
                        
                 mutation sendOtpMail ($email:String!){
        sendOtpMail(email:$email){
            message,success,status
    
        }
    }
                        
                        `;

export const veridyOtpMutation = `
                        
                        mutation verifyOtp ($input:verifyOtpInput!){
                                            verifyOtp(input:$input){
                                            message,success,status data{
                                          
                                            ... on verifyOtpData {
                                            email,
                                            is_verified
                                            
                                            }
                                            ... on User {
                                            
                                            id
                                            user_name
                                            email
                                            }
                                            
                                            }
                                                }
                                            }
                        
                        `;
export const createUserMutation = `
          
          
          mutation createUser($input:UserInput){
          
          createUser(input:$input){
          
          
          message,status,error,success
          
          }
          
          }
          
          `;

export const logoutMutaion = `
          
          mutation logout{
          logout{
          message,success,error}}
          
          `;

export const blockUserMutation = `
              mutation blockUser($input:blockUserInput!){
              
              blockUser(input:$input){
              message , success, error}
              
    
              }
              
              `;

export const unBlockUserMutation = `
              
              mutation unBlockUser($input:blockUserInput!){
              unBlockUser(input:$input){
              
              message ,
    error,success
    
    
              
              }
              
              }
              
    
              `;

export const updateUserMutation = `
              
              mutation updateUser($input: UpdateUserInput){
              updateUser(input:$input){
              message, status,success,error}
              }
              
              `;

export const updatePreference = `
              
              mutation updatePreference($input: personalizationInput!){
              updatePreference(input:$input){
              message, status,success,error}
              }
              
              `;
