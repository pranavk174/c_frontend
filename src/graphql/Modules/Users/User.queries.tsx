export const getUserQuery = `
              
              query getUser{
              
              getUser{
              message , error,success, data {
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
              message , error,success, data {
              ... on Users {
              
           items{
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
              }
              
              `;
