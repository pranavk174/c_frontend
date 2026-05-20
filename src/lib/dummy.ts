export type Chat = {
  // id: string;
  name: string;
  // avatar: string;
  // lastMessage: string;
  // time: string;
  // unread: number;
  // isOnline?: boolean;
  chat_id: Number;
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
  react_id: Number;
  user_id: Number;
};

export interface Message {
  id: string;
  sender_id: number;
  created_at: string;
  seen_at: string | null;
  is_forwarded: boolean;
  content: string;
  story_id: string | null;
  is_edited: boolean;
  reply_to_message: number | null;
  is_deleted: boolean;
  reactions: reaction[];
}

export const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    lastMessage: "Hey, are we still meeting today?",
    time: "10:30 AM",
    unread: 2,
    isOnline: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    lastMessage: "Sent an image",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: "3",
    name: "Alice Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    lastMessage: "Sounds good to me!",
    time: "Tuesday",
    unread: 1,
    isOnline: true,
  },
  {
    id: "4",
    name: "Work Group",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=WG",
    lastMessage: "Bob: The deployment is complete.",
    time: "Monday",
    unread: 5,
  },
];

// export type Message = {
//   id: string;
//   senderId: string;
//   text: string;
//   timestamp: string;
//   isRead?: boolean;
//   isSentByMe: boolean;
// };

export const MOCK_MESSAGES: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      senderId: "1",
      text: "Hey! How are you?",
      timestamp: "10:00 AM",
      isSentByMe: false,
    },
    {
      id: "m2",
      senderId: "me",
      text: "I'm good, thanks! You?",
      timestamp: "10:05 AM",
      isSentByMe: true,
      isRead: true,
    },
    {
      id: "m3",
      senderId: "1",
      text: "Doing well. Hey, are we still meeting today?",
      timestamp: "10:30 AM",
      isSentByMe: false,
    },
  ],
};
