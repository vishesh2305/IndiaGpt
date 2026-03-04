"use client";

import { useMemo } from "react";
import { isToday, isYesterday, subDays, isAfter, parseISO } from "date-fns";
import { MessageSquare } from "lucide-react";
import { SidebarChatItem } from "@/components/sidebar/sidebar-chat-item";
import type { Chat } from "@/types/chat";

interface SidebarChatListProps {
  chats: Chat[];
  onDeleteChat?: (chatId: string) => void;
}

interface ChatGroup {
  label: string;
  chats: Chat[];
}

function groupChatsByDate(chats: Chat[]): ChatGroup[] {
  const today: Chat[] = [];
  const yesterday: Chat[] = [];
  const previous7Days: Chat[] = [];
  const older: Chat[] = [];

  const sevenDaysAgo = subDays(new Date(), 7);

  for (const chat of chats) {
    const date = parseISO(chat.updatedAt);

    if (isToday(date)) {
      today.push(chat);
    } else if (isYesterday(date)) {
      yesterday.push(chat);
    } else if (isAfter(date, sevenDaysAgo)) {
      previous7Days.push(chat);
    } else {
      older.push(chat);
    }
  }

  const groups: ChatGroup[] = [];

  if (today.length > 0) {
    groups.push({ label: "Today", chats: today });
  }
  if (yesterday.length > 0) {
    groups.push({ label: "Yesterday", chats: yesterday });
  }
  if (previous7Days.length > 0) {
    groups.push({ label: "Previous 7 Days", chats: previous7Days });
  }
  if (older.length > 0) {
    groups.push({ label: "Older", chats: older });
  }

  return groups;
}

export function SidebarChatList({ chats, onDeleteChat }: SidebarChatListProps) {
  const groups = useMemo(() => groupChatsByDate(chats), [chats]);

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron-50">
          <MessageSquare className="h-6 w-6 text-saffron" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No chats yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Start a new conversation to get going
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-2 py-2">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.chats.map((chat) => (
              <SidebarChatItem
                key={chat._id}
                chat={chat}
                onDelete={onDeleteChat}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
