export const getUserQuery = `
              
              query getUser{
              
              getUser{
              message , error,success,status, data {
              ... on User {
              
              name
      id
      user_name
      email
      bio
      mobile
      profile_pic
      cover_pic
    
              
              }
              }
              }
              }
              
              `;

export const getAllUsersQuery = `
              
              query getUsers{
              
              getUsers{
              message , error,success,status, data {
              ... on Users {
              
           items{
              name
      id
      user_name
      email
      bio
      mobile
      profile_pic
      chat_id
      cover_pic
    }
              
              }
              }
              }
              }
              
              `;
