import { ChatItem, Message } from "./dummy";

const dateLabel = (date: Date, today: Date, yesterday: Date) => {
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Messages already time ke order mein hain → ek pass mein header + messages
export const groupMessagesByDate = (messages: Message[]): ChatItem[] => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const items: ChatItem[] = [];
  let lastLabel: string | null = null;

  for (const msg of messages) {
    const label = dateLabel(new Date(Number(msg.created_at)), today, yesterday);
    if (label !== lastLabel) {
      items.push({ kind: "header", id: `header-${label}`, date: label }); // stable id
      lastLabel = label;
    }
    items.push({ ...msg, kind: "message" });
  }

  return items;
};
