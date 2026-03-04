"use client";

import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chat } from "@/types/chat";

interface SidebarChatItemProps {
  chat: Chat;
  onDelete?: (chatId: string) => void;
}

export function SidebarChatItem({ chat, onDelete }: SidebarChatItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === `/chat/${chat._id}`;

  const handleClick = () => {
    router.push(`/chat/${chat._id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(chat._id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        "hover:bg-sidebar-accent",
        isActive
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground"
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 overflow-hidden">
        <p className="truncate font-medium leading-tight">
          {chat.title || "New Chat"}
        </p>
        {chat.lastMessagePreview && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {chat.lastMessagePreview}
          </p>
        )}
      </div>
      <button
        onClick={handleDelete}
        className={cn(
          "shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity",
          "hover:bg-destructive/10 hover:text-destructive",
          "group-hover:opacity-100",
          isActive && "opacity-100"
        )}
        aria-label={`Delete chat: ${chat.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </button>
  );
}
