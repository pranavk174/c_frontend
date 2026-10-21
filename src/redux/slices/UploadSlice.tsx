import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UploadStatus = "uploading" | "paused" | "failed" | "done";

export interface UploadJob {
  chatId: number;
  progress: number;
  status: UploadStatus;
}

interface initialStateProps {
  jobs: Record<string, UploadJob>; // key = clientMsgId
}

const initialState: initialStateProps = { jobs: {} };

export const UploadSlice = createSlice({
  name: "Uploads",
  initialState,
  reducers: {
    uploadStarted: (
      state,
      action: PayloadAction<{ clientMsgId: string; chatId: number }>,
    ) => {
      state.jobs[action.payload.clientMsgId] = {
        chatId: action.payload.chatId,
        progress: 0,
        status: "uploading",
      };
    },
    uploadProgress: (
      state,
      action: PayloadAction<{ clientMsgId: string; progress: number }>,
    ) => {
      const job = state.jobs[action.payload.clientMsgId];
      if (job) job.progress = action.payload.progress;
    },
    uploadStatusChanged: (
      state,
      action: PayloadAction<{ clientMsgId: string; status: UploadStatus }>,
    ) => {
      const job = state.jobs[action.payload.clientMsgId];
      if (job) job.status = action.payload.status;
    },
    uploadRemoved: (state, action: PayloadAction<string>) => {
      delete state.jobs[action.payload];
    },
  },
});

export const {
  uploadStarted,
  uploadProgress,
  uploadStatusChanged,
  uploadRemoved,
} = UploadSlice.actions;

export default UploadSlice.reducer;
