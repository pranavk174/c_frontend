"use client";

import { Chat } from "@/lib/dummy";

import { createContext, ReactNode, useContext, useMemo } from "react";

type ChatMetaContextType = {
  chatDetails: Chat;
  recieverIds: number[];
};

const ChatMetaContext = createContext<ChatMetaContextType | null>(null);

export function ChatMetaProvider({
  children,
  chatDetails,
  recieverIds,
}: ChatMetaContextType & { children: ReactNode }) {
  // value tabhi badle jab chat ya members badlein
  const value = useMemo(
    () => ({ chatDetails, recieverIds }),
    [chatDetails, recieverIds],
  );

  return (
    <ChatMetaContext.Provider value={value}>
      {children}
    </ChatMetaContext.Provider>
  );
}

export function useChatMeta() {
  const context = useContext(ChatMetaContext);
  if (context === null) {
    throw new Error("useChatMeta must be used within ChatMetaProvider");
  }
  return context;
}
