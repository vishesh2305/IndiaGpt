"use client";

import { MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeSwitcher } from "@/components/layout/mode-switcher";

interface DesktopHeaderProps {
  location?: { city: string; state: string } | null;
}

export function DesktopHeader({ location }: DesktopHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 lg:px-6">
      {/* Left: Mode Switcher */}
      <div className="flex items-center">
        <ModeSwitcher />
      </div>

      {/* Center: Location display */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        {location?.city ? (
          <span>
            {location.city}
            {location.state ? `, ${location.state}` : ""}
          </span>
        ) : (
          <span className="text-xs">Location not set</span>
        )}
      </div>

      {/* Right: Language selector placeholder */}
      <div className="flex items-center">
        <Button variant="ghost" size="icon-sm" aria-label="Select language">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
