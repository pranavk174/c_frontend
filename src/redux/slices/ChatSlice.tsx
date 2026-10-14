import { MessageItem } from "@/lib/dummy";
import { createSlice } from "@reduxjs/toolkit";

interface initialStateProps {
  replyMessage: MessageItem | null;
  selectedMessages: number[];
  typing: boolean;
  show: string | number | null;
  uploadId: string;
}

const initialState: initialStateProps = {
  selectedMessages: [],
  typing: false,
  replyMessage: null,
  show: null,
  uploadId: "",
};

export const ChatSlice = createSlice({
  name: "Chats",
  initialState,
  reducers: {
    setReplyMessage: (state, action) => {
      state.replyMessage = action.payload;
    },
    setTyping: (state, action) => {
      state.typing = !state.typing;
    },
    setShow: (state, action) => {
      state.show = action.payload;
    },
    setSelectedMessages: (state, action) =>
      (state.selectedMessages = action.payload),
    // removeOnlineUsers: (state, action) => {
    //   state.onlineUsers = state.onlineUsers.filter((d) => d !== action.payload);
    // },
  },
});

export const { setSelectedMessages, setShow, setTyping, setReplyMessage } =
  ChatSlice.actions;

export default ChatSlice.reducer;
