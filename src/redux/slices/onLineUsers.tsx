import { createSlice } from "@reduxjs/toolkit";

interface initialStateProps {
  onlineUsers: string[];
}

const initialState: initialStateProps = {
  onlineUsers: [],
};

export const onlineUsersSlice = createSlice({
  name: "online users",
  initialState,
  reducers: {
    addOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    removeOnlineUsers: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter((d) => d !== action.payload);
    },
  },
});

export const { addOnlineUsers, removeOnlineUsers } = onlineUsersSlice.actions;

export default onlineUsersSlice.reducer;
