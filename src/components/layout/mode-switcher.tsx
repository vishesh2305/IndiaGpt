"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Mic, Car, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const modes = [
  { label: "Chat", href: "/", icon: MessageSquare },
  { label: "Voice", href: "/voice", icon: Mic },
  { label: "Drive", href: "/driving", icon: Car },
  { label: "Map", href: "/map", icon: MapPin },
] as const;

export function ModeSwitcher() {
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive =
          mode.href === "/"
            ? pathname === "/" || pathname.startsWith("/chat/")
            : pathname === mode.href || pathname.startsWith(`${mode.href}/`);

        return (
          <Link
            key={mode.href}
            href={mode.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-saffron text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{mode.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
