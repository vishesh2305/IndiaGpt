"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { DesktopHeader } from "@/components/layout/desktop-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { IndiaLogo } from "@/components/shared/india-logo";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Desktop Sidebar: hidden on mobile, visible on md+ */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar: visible on mobile only */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 md:hidden">
          <MobileSidebar />
          <IndiaLogo size="sm" />
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Desktop header: hidden on mobile, visible on md+ */}
        <div className="hidden md:block">
          <DesktopHeader />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">{children}</main>

        {/* Mobile bottom nav: visible on mobile only */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
