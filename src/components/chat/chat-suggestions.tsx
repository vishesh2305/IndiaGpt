"use client";

import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

interface ChatSuggestionsProps {
  suggestions: string[];
  className?: string;
}

export function ChatSuggestions({
  suggestions,
  className,
}: ChatSuggestionsProps) {
  const setInputText = useChatStore((s) => s.setInputText);

  if (suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-none",
        className
      )}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => setInputText(suggestion)}
          className="flex-shrink-0 rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:bg-saffron-50 hover:border-saffron transition-colors whitespace-nowrap"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
