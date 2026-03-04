"use client";

import { useParams } from "next/navigation";
import { ChatContainer } from "@/components/chat/chat-container";

export default function ChatPage() {
  const params = useParams<{ chatId: string }>();

  return <ChatContainer chatId={params.chatId} />;
}
