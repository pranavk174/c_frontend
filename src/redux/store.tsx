import { configureStore } from "@reduxjs/toolkit";
// import userReducer from "./slices/userSlice";
import { UserApi } from "./Apis/User";

export const store = configureStore({
  reducer: {
    [UserApi.reducerPath]: UserApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(UserApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 