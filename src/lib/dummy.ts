import { Dispatch, RefObject, SetStateAction } from "react";

export type Chat = {
  // id: string;
  name: string;
  // avatar: string;
  // lastMessage: string;
  // time: string;
  unread_count: number;
  isOnline?: boolean;
  chat_id: number;
  blocked: boolean;
  chat_type: string;
  user_id: number;
  profile_pic: string;
  last_message_id: number;
  last_message: string;
  last_message_at: string;
};

export type emoji = {
  react_id: number;
  emoji: string;
};

export interface selectedProp {
  message: string;
  id: number;
  sender_id: number;
}

export interface chatListProps {
  menu: boolean;

  setMenu: Dispatch<SetStateAction<boolean>>;
  chat_id: number;
  chatDetails: Chat;
  setSelectedMessages: Dispatch<SetStateAction<number[]>>;
  setCursor: Dispatch<SetStateAction<number | null>>;
  // setSelected: Dispatch<SetStateAction<number[] | null>>;
  hasMore: boolean;
  setShow: Dispatch<SetStateAction<string | number | null>>;
  // setActive: Dispatch<SetStateAction<string | number | null>>;
  emojis: emoji[];
  show: string | number | null;
  nextCursor: number;
  timerRef: RefObject<NodeJS.Timeout | null>;
  setReplyMessage: Dispatch<SetStateAction<MessageItem | null>>;
  data: ChatItem[];
  // active: string | number | null;
  isFetching: boolean;
  selectedMessages: number[];
  user_id: number | null;

  startUpload: () => Promise<void>;
  cancelUpload: () => Promise<"success" | undefined>;
  uploadChunks: (id: string) => Promise<void>;
  // setMessages?: Dispatch<SetStateAction<Message[]>>;
  messages: Message[];
  pausedRef: React.RefObject<boolean>;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  progress: number;
  uploadId: string;
}
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
  type?: "message" | "header";
  date?: string;
  sender_id: number;
  created_at: string;
  preview: string | null;
  seen_at: string | null;
  is_forwarded: boolean;
  seen_users: number[];
  content: string | null;
  story_item?: string;
  story_id: number | null;
  is_edited: boolean;
  reply_to_message_id: number | null;
  is_deleted: boolean;
  reactions: reaction[];
  isLocal: boolean;
}

type HeaderItem = {
  kind: "header";
  id: string;
  date: string;
};

export type MessageItem = Message & {
  kind: "message";
};

export type ChatItem = MessageItem | HeaderItem;



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
  id?: number;
  profile_pic?: string;
  cover_pic?: string;
  name?: string;
  bio?: string;
  mobile?: string;
  email?: string;
  role?: string | unknown;

  theme?: "dark" | "light";
  blocked?: boolean;
  chat_id?: number;
  user_id?: number;
}

export interface groupProps {
  profile_pic?: string;
  cover_pic?: string;
  name?: string;
  bio?: string;
  role?: string | unknown;
  members?: number[];
  groupName?: string;
  id?: number;
}

export interface StoryItem {
  id: number;
  user_id: number;
  text_data: string;
  content: string;
  created_at: string;
  expires_at: string;
}

export interface interactions {
  id: number;
  name: string;
  seen: boolean;
  liked: boolean;
  seen_at: string;
  liked_at?: string | null;
  profile_pic?: string;
}

export interface StoryContent {
  id: number;
  text_data: string;
  content: string;
  created_at: string;
  seen: boolean;
  liked: boolean;
  expires_at: string;
  likes_count: number;
  interactions: interactions[] | null;
}

export interface valueProps {
  type: string | null;
  open: boolean;
}

export interface UserStories {
  user_id: number;
  name: string;
  profile_pic: string | null;
  isOwn: boolean;
  stories: StoryContent[];
}

export const modalValue = {
  type: null,
  open: false,
};

export interface Notification {
  notification_id: number;

  reference_id: number | null;
  notification_type: "new_message" | "story_like" | "post_like" | "follow";

  name: string;

  message: string;

  profile_pic: string;

  time: string;
  color?: string;
}

// export type Message = {
//   id: string;
//   senderId: string;
//   text: string;
//   timestamp: string;
//   isRead?: boolean;
//   isSentByMe: boolean;
// };

export interface MessageboxProps {
  startPressTimer: (id: number) => void;
  cancelPressTimer: () => void;
  msg: MessageItem;
  repliedMessage: Message | null;
  setActive: Dispatch<SetStateAction<string | number | null>>;
  show: string | number | null;
  selectionMode: boolean;
  toggleSelection: (id: number) => void;
  isSelected: boolean;
  user_id: number | null;
  active: string | number | null;
  // startUpload: () => Promise<void>;
  setShow: Dispatch<SetStateAction<string | number | null>>;
  handleLike: (id: number, react_id: number) => void;
  pausedRef: RefObject<boolean>;
  progress: number;
  uploadId: string;
  // mappedMessages: Map<number, MessageItem>;
  cancelUpload: () => Promise<"success" | undefined>;
  uploadChunks: (id: string) => Promise<void>;
  chatDetails: Chat;
  // data: Message[];
  icons: emoji[];
  setReplyMessage: Dispatch<SetStateAction<MessageItem | null>>;
  emojis: emoji[];
}

export interface User {
  id: number;
  name: string;
  chat_id: number | null;
  username: string;
  profile_pic?: string;
}

export interface NewChatProps {
  users: User[];
  setModal: Dispatch<SetStateAction<valueProps>>;
  // onSelectUser: (user: User) => void;
}


export interface memberProps {
  member_id: number;
  role: 'admin' | 'member'
}

export interface storySeen {

  story_id: number;
  user_id: number
  profile_pic?: string
  name: string
  seen_at: string


}

export interface socketCallback {
  message: string;
  status: number;
  success: boolean;
}