import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: "User",
    initialState: {
        name: "",
        id: null,
        email: ""
    }, reducers: {
        addUser: (state, action) => {
            state.name = action.payload.name,
                state.id = action.payload.id
            state.email = action.payload.emai
        },
        removeUser: (state, action) => {
            state.name = "",
                state.id = null, state.email = ""
        }


    }

})

export const { addUser, removeUser } = userSlice.actions
export default userSlice.reducer