"use client";

import { Chat } from "@/lib/dummy";
import { useSendMediaMessage } from "@/lib/useSendMessage";
import { createContext, ReactNode, useContext, useState } from "react";

type ChatContextType = ReturnType<typeof useSendMediaMessage>;
const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({
  children,
  chatDetails,
}: {
  children: ReactNode;
  chatDetails: Chat;
}) {
  const {
    file,
    setFile,
    // uploadChunks,
    // startUpload,
    uploadId,
    cancelUpload,
    continueUpload,
    sendMedia,
    pausedRef,
    handleSendMessage,
    progress,
    scrollToBottom,
    inputRef,
  } = useSendMediaMessage({ chatDetails });
  const value = {
    file,
    setFile,
    // uploadChunks,
    // startUpload,
    uploadId,
    cancelUpload,
    continueUpload,
    sendMedia,
    pausedRef,
    handleSendMessage,
    progress,
    scrollToBottom,
    inputRef,
    chatDetails,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);

  if (context === null) {
    throw new Error("useChat must be used within ChatProvider");
  }

  return context;
}
