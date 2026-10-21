"use client";

import { Chat } from "@/lib/dummy";
import { useSendMediaMessage } from "@/lib/updated/useSendMessage";
import { createContext, ReactNode, useContext, useState } from "react";
import { useChatMeta } from "./ChatMetaContext";

type ChatActionContextType = ReturnType<typeof useSendMediaMessage>;

const ChatActionContext = createContext<ChatActionContextType | null>(null);

// Sirf functions — koi fast-changing state nahi, isliye consumers re-render nahi honge
export function ChatActionProvider({ children }: { children: ReactNode }) {
  const { chatDetails, recieverIds } = useChatMeta();
  const actions = useSendMediaMessage({ chatDetails, recieverIds });

  return (
    <ChatActionContext.Provider value={actions}>
      {children}
    </ChatActionContext.Provider>
  );
}

export function useChatActions() {
  const context = useContext(ChatActionContext);
  if (context === null) {
    throw new Error("useChatActions must be used within ChatActionProvider");
  }
  return context;
}
