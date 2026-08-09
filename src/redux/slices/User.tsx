import { createSlice } from "@reduxjs/toolkit";

type initialState = {
  name: string;
  id: number | null;
  email: string;
};

const initialState: initialState = {
  name: "",
  id: null,
  email: "",
};

export const userSlice = createSlice({
  name: "User",
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.name = action.payload.name;
      state.id = parseInt(action.payload.id);
      state.email = action.payload.email;
    },
    removeUser: (state) => {
      state.name = "";
      state.id = null;
      state.email = "";
    },
  },
});

export const { addUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
