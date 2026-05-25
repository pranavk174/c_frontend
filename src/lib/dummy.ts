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

type reaction = {
  react_id: number;
  user_id: number;
};

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

// export type Message = {
//   id: string;
//   senderId: string;
//   text: string;
//   timestamp: string;
//   isRead?: boolean;
//   isSentByMe: boolean;
// };
