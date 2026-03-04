"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Menu, Mic, Car, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title?: string;
  chatId?: string | null;
  onTitleChange?: (newTitle: string) => void;
  className?: string;
}

export function ChatHeader({
  title = "New Chat",
  chatId,
  onTitleChange,
  className,
}: ChatHeaderProps) {
  const router = useRouter();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when title prop changes
  useEffect(() => {
    setEditValue(title);
  }, [title]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    if (chatId) {
      setIsEditing(true);
    }
  }, [chatId]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title && onTitleChange) {
      onTitleChange(trimmed);
    } else {
      setEditValue(title);
    }
    setIsEditing(false);
  }, [editValue, title, onTitleChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        setEditValue(title);
        setIsEditing(false);
      }
    },
    [handleSave, title]
  );

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b border-border bg-background px-4",
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile sidebar trigger */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden flex-shrink-0"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Chat title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 bg-transparent text-sm font-medium border-b-2 border-saffron outline-none py-0.5 px-1"
            maxLength={200}
          />
        ) : (
          <h2
            className="text-sm font-medium truncate cursor-default select-none"
            onDoubleClick={handleDoubleClick}
            title={chatId ? "Double-click to edit title" : undefined}
          >
            {title}
          </h2>
        )}
      </div>

      {/* Right section: mode switch buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/voice")}
              aria-label="Voice mode"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Voice Mode</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/driving")}
              aria-label="Drive mode"
            >
              <Car className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Drive Mode</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/map")}
              aria-label="Map mode"
            >
              <Map className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Map Mode</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
