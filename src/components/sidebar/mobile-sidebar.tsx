"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHeader } from "@/components/sidebar/sidebar-header";
import { SidebarChatList } from "@/components/sidebar/sidebar-chat-list";
import { SidebarFooter } from "@/components/sidebar/sidebar-footer";
import type { Chat } from "@/types/chat";

interface MobileSidebarProps {
  chats?: Chat[];
  onNewChat?: () => void;
  onDeleteChat?: (chatId: string) => void;
}

export function MobileSidebar({
  chats = [],
  onNewChat,
  onDeleteChat,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the sheet whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleNewChat = useCallback(() => {
    setOpen(false);
    if (onNewChat) {
      onNewChat();
    }
  }, [onNewChat]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex h-full flex-col">
          <SidebarHeader onNewChat={handleNewChat} />
          <ScrollArea className="flex-1">
            <SidebarChatList chats={chats} onDeleteChat={onDeleteChat} />
          </ScrollArea>
          <SidebarFooter />
        </div>
      </SheetContent>
    </Sheet>
  );
}
