"use client";

import {
  MapPin,
  Coins,
  FileText,
  Sparkles,
  Cloud,
  Languages,
} from "lucide-react";
import { IndiaLogo } from "@/components/shared/india-logo";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

interface SuggestionCard {
  text: string;
  icon: React.ReactNode;
}

const suggestions: SuggestionCard[] = [
  {
    text: "What are the best places to visit in Rajasthan?",
    icon: <MapPin className="h-5 w-5 text-saffron-600" />,
  },
  {
    text: "Explain the new income tax rules for 2024-25",
    icon: <Coins className="h-5 w-5 text-india-green-600" />,
  },
  {
    text: "How to apply for a new passport online?",
    icon: <FileText className="h-5 w-5 text-navy-500" />,
  },
  {
    text: "Tell me about Diwali celebrations across India",
    icon: <Sparkles className="h-5 w-5 text-saffron-600" />,
  },
  {
    text: "What's the weather like in Mumbai today?",
    icon: <Cloud className="h-5 w-5 text-india-green-600" />,
  },
  {
    text: "Translate this to Hindi: Good morning",
    icon: <Languages className="h-5 w-5 text-navy-500" />,
  },
];

interface ChatEmptyStateProps {
  className?: string;
}

export function ChatEmptyState({ className }: ChatEmptyStateProps) {
  const setInputText = useChatStore((s) => s.setInputText);

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-4 py-12",
        className
      )}
    >
      {/* Logo */}
      <div className="mb-6">
        <IndiaLogo size="lg" className="items-center" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">
        Namaste! How can I help you today?
      </h1>

      {/* Subtitle */}
      <p className="text-muted-foreground text-center text-sm sm:text-base mb-10 max-w-md">
        Ask me anything about India, or chat in your language
      </p>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => setInputText(suggestion.text)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-saffron hover:shadow-sm hover:bg-saffron-50/40"
          >
            <div className="flex-shrink-0 mt-0.5">{suggestion.icon}</div>
            <span className="text-sm leading-snug text-foreground group-hover:text-foreground">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
