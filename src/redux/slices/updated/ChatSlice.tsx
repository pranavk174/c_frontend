import { MessageItem } from "@/lib/dummy";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface initialStateProps {
  replyMessage: MessageItem | null;
  selectedMessages: number[];
  typingChatIds: number[];
  show: string | number | null;
}

const initialState: initialStateProps = {
  selectedMessages: [],
  typingChatIds: [],
  replyMessage: null,
  show: null,
};

export const ChatSlice = createSlice({
  name: "Chats",
  initialState,
  reducers: {
    setReplyMessage: (state, action) => {
      state.replyMessage = action.payload;
    },
    setTyping: (
      state,
      action: PayloadAction<{ chatId: number; typing: boolean }>,
    ) => {
      const { chatId, typing } = action.payload;
      const exists = state.typingChatIds.includes(chatId);
      if (typing && !exists) state.typingChatIds.push(chatId);
      if (!typing && exists) {
        state.typingChatIds = state.typingChatIds.filter((id) => id !== chatId);
      }
    },
    setShow: (state, action) => {
      state.show = action.payload;
    },
    setSelectedMessages: (state, action) => {
      state.selectedMessages = action.payload;
    },
    resetChatUi: (state) => {
      state.replyMessage = null;
      state.selectedMessages = [];
    },
    // removeOnlineUsers: (state, action) => {
    //   state.onlineUsers = state.onlineUsers.filter((d) => d !== action.payload);
    // },
  },
});

export const {
  setSelectedMessages,
  setShow,
  setTyping,
  setReplyMessage,
  resetChatUi,
} = ChatSlice.actions;

export default ChatSlice.reducer;
