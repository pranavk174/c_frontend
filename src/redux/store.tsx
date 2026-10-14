import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistStore, persistReducer } from "redux-persist";
import onlineUsersSlice from "./slices/onLineUsers";
import ChatSlice from "./slices/ChatSlice";
import userSlice from "./slices/User";

import { BaseApi } from "./Apis/BaseApi";
import { errorMiddleware } from "./middlewares/erroreMiddleware";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["userSlice"],
};

const rootReducer = combineReducers({
  // [UserApi.reducerPath]: UserApi.reducer,
  [BaseApi.reducerPath]: BaseApi.reducer,
  userSlice: userSlice,
  onlineUsersSlice: onlineUsersSlice,
  ChatSlice: ChatSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
      .concat(BaseApi.middleware)
      .concat(errorMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
