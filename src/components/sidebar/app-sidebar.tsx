"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHeader } from "@/components/sidebar/sidebar-header";
import { SidebarChatList } from "@/components/sidebar/sidebar-chat-list";
import { SidebarFooter } from "@/components/sidebar/sidebar-footer";
import type { Chat } from "@/types/chat";

interface AppSidebarProps {
  chats?: Chat[];
  onNewChat?: () => void;
  onDeleteChat?: (chatId: string) => void;
}

export function AppSidebar({
  chats = [],
  onNewChat,
  onDeleteChat,
}: AppSidebarProps) {
  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar">
      <SidebarHeader onNewChat={onNewChat} />
      <ScrollArea className="flex-1">
        <SidebarChatList chats={chats} onDeleteChat={onDeleteChat} />
      </ScrollArea>
      <SidebarFooter />
    </aside>
  );
}
