"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { DesktopHeader } from "@/components/layout/desktop-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { IndiaLogo } from "@/components/shared/india-logo";
import type { Chat } from "@/types/chat";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [chats, setChats] = useState<Chat[]>([]);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?limit=30");
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("[Layout] Failed to fetch chats:", error);
    }
  }, []);

  // Refetch chat list on every route change (covers new chat creation,
  // navigating between chats, returning to home, etc.)
  useEffect(() => {
    fetchChats();
  }, [pathname, fetchChats]);

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
        if (res.ok) {
          setChats((prev) => prev.filter((c) => c._id !== chatId));
        }
      } catch (error) {
        console.error("[Layout] Failed to delete chat:", error);
      }
    },
    []
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Desktop Sidebar: hidden on mobile, visible on md+ */}
      <div className="hidden md:flex">
        <AppSidebar
          chats={chats}
          onNewChat={fetchChats}
          onDeleteChat={handleDeleteChat}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar: visible on mobile only */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 md:hidden">
          <MobileSidebar
            chats={chats}
            onNewChat={fetchChats}
            onDeleteChat={handleDeleteChat}
          />
          <IndiaLogo size="sm" />
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Desktop header: hidden on mobile, visible on md+ */}
        <div className="hidden md:block">
          <DesktopHeader />
        </div>

        {/* Page content */}
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>

        {/* Mobile bottom nav: visible on mobile only */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
