"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Mic,
  MapPin,
  Clock,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Chat", href: "/", icon: MessageSquare },
  { label: "Voice", href: "/voice", icon: Mic },
  { label: "Map", href: "/map", icon: MapPin },
  { label: "History", href: "/history", icon: Clock },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-14 shrink-0 items-center justify-around border-t border-border bg-white md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/" || pathname.startsWith("/chat/")
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-2 py-1 transition-colors",
              isActive ? "text-saffron" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span
              className={cn(
                "text-[10px] leading-tight",
                isActive && "font-medium"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
