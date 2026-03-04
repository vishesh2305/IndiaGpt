"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MapChatPanelProps {
  /** Additional class names for the container. */
  className?: string;
}

/**
 * Chat panel overlaying the map view.
 *
 * - **Desktop**: slides in from the right side (400px wide).
 * - **Mobile**: slides up from the bottom as a sheet.
 *
 * Contains a mini chat interface for asking about places and directions.
 */
export function MapChatPanel({ className }: MapChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste! I can help you explore India on the map. Ask me about places, directions, or local recommendations.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Auto-scroll to bottom on new messages ─────────────────────────────

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Focus input when panel opens ──────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      // Small delay to wait for the animation
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── Send message ──────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // For now, generate a contextual response.
        // In production, this would call the AI stream endpoint with map context.
        const response = await generateMapResponse(trimmed);

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("[MapChat] Error:", error);

        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "I'm sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading]
  );

  // ── Toggle ────────────────────────────────────────────────────────────

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <>
      {/* Toggle button */}
      <Button
        type="button"
        onClick={togglePanel}
        className={cn(
          "fixed z-20 shadow-lg transition-all duration-300",
          // Desktop: right side
          "md:right-4 md:top-4",
          // Mobile: bottom right (above controls)
          "bottom-32 right-4 md:bottom-auto",
          isOpen
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-[#FF9933] text-white hover:bg-[#FF9933]/90"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </Button>

      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed z-10 flex flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          // Desktop: right side panel
          "md:right-0 md:top-0 md:h-full md:w-[400px] md:border-l md:border-border",
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 h-[60vh] rounded-t-2xl border-t border-border md:rounded-none",
          // Open/closed states
          isOpen
            ? "translate-x-0 translate-y-0"
            : "md:translate-x-full translate-y-full md:translate-y-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-[#FF9933]/10 via-white to-[#138808]/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF9933]/10">
              <MapPin className="h-4 w-4 text-[#FF9933]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#000080]">
                Map Assistant
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Ask about places &amp; directions
              </p>
            </div>
          </div>

          {/* Mobile drag indicator */}
          <div className="flex items-center gap-2 md:hidden">
            <ChevronDown
              className="h-5 w-5 cursor-pointer text-muted-foreground"
              onClick={togglePanel}
            />
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.role === "user"
                      ? "bg-[#FF9933] text-white"
                      : "bg-muted/50 text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      msg.role === "user"
                        ? "text-white/60"
                        : "text-muted-foreground"
                    )}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF9933]" />
                  <span className="text-xs text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border bg-white p-3">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a place or directions..."
              disabled={isLoading}
              className="flex-1 rounded-xl border-border bg-muted/20 text-sm focus-visible:ring-[#FF9933]"
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={isLoading || !input.trim()}
              className="shrink-0 bg-[#FF9933] text-white hover:bg-[#FF9933]/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Placeholder response generator ──────────────────────────────────────────

/**
 * Generates a contextual response for map-related queries.
 * In production, this would call the AI endpoint with map context.
 */
async function generateMapResponse(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase();

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Direction queries
  if (
    lowerQuery.includes("direction") ||
    lowerQuery.includes("how to get") ||
    lowerQuery.includes("route") ||
    lowerQuery.includes("navigate")
  ) {
    return "I can help with directions! Please specify your starting point and destination. For example: \"Directions from Mumbai to Pune\" or \"How to get from Delhi to Agra by train.\"";
  }

  // Place queries
  if (
    lowerQuery.includes("restaurant") ||
    lowerQuery.includes("hotel") ||
    lowerQuery.includes("cafe") ||
    lowerQuery.includes("food") ||
    lowerQuery.includes("eat")
  ) {
    return "I'd be happy to help you find dining options! Try searching for specific cuisine types or areas in the search bar above. You can also ask me about popular food spots in any Indian city.";
  }

  // Tourist queries
  if (
    lowerQuery.includes("tourist") ||
    lowerQuery.includes("visit") ||
    lowerQuery.includes("attraction") ||
    lowerQuery.includes("monument") ||
    lowerQuery.includes("temple") ||
    lowerQuery.includes("heritage")
  ) {
    return "India has incredible heritage sites! Some top attractions include:\n\n- Taj Mahal, Agra\n- Red Fort, Delhi\n- Gateway of India, Mumbai\n- Hawa Mahal, Jaipur\n- Mysore Palace, Karnataka\n\nSearch for any city to discover local attractions on the map.";
  }

  // Weather queries
  if (
    lowerQuery.includes("weather") ||
    lowerQuery.includes("climate") ||
    lowerQuery.includes("rain")
  ) {
    return "For real-time weather information, I recommend checking a weather service. However, I can tell you about general climate patterns for different regions of India. Which area are you interested in?";
  }

  // Default response
  return `I received your question: "${query}"\n\nI can help you with:\n- Finding places on the map\n- Getting directions between locations\n- Discovering restaurants, hotels, and attractions\n- Learning about different regions of India\n\nTry being more specific, and I'll do my best to assist!`;
}
