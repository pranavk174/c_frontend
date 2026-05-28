export type Chat = {
  // id: string;
  name: string;
  // avatar: string;
  // lastMessage: string;
  // time: string;
  // unread: number;
  isOnline?: boolean;
  chat_id: number;
  chat_type: string;
  user_id: number;
  profile_pic: string;
  last_message_id: number;
  last_message: string;
  last_message_at: string;
};
export enum delete_type {
  onlyme,
  ONLYME,
  OnlyMe,
  Everyone,
  everyone,
  EVERYONE,
}

export interface reaction {
  react_id: number;
  user_id: number;
}

export interface Message {
  id: number;
  sender_id: number;
  created_at: string;
  preview: string | null;
  seen_at: string | null;
  is_forwarded: boolean;
  seen_users: number[];
  content: string | null;
  story_id: number | null;
  is_edited: boolean;
  reply_to_message_id: number | null;
  is_deleted: boolean;
  reactions: reaction[];
  isLocal: boolean;
}

export interface seen_user {
  message_id: number;
  seen_user: number;
  seen_at: string;
}

export interface message_reactions {
  react_id: number;
  user_id: number;
  message_id: number;
}

export interface socketResponse {
  message: string;
  success: boolean;
  status: number;
  error: string;
}

export interface profileProps {
  profile_pic?: string;
  cover_pic?: string;
  name?: string;
  bio?: string;
  mobile?: string;
  email?: string;
  blocked?: boolean;
  chat_id?: boolean;
  user_id?: number;
}


export interface StoryItem {
  id: number;
  user_id: number;
  text_data: string;
  content: string;
  created_at: string;
  expires_at: string;
}


export interface StoryContent {
  id: number;
  text_data: string;
  content: string;
  created_at: string;
  expires_at: string;
  likes_count: number;
}

export interface UserStories {
  user_id: number;
  name: string;
  profile_pic: string | null;
  isOwn: boolean;
  stories: StoryContent[];
}
// export type Message = {
//   id: string;
//   senderId: string;
//   text: string;
//   timestamp: string;
//   isRead?: boolean;
//   isSentByMe: boolean;
// };
