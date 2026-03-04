"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import { MessageMarkdown } from "@/components/chat/message-markdown";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

interface MessageListProps {
  className?: string;
}

export function MessageList({ className }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages change or streaming content updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, isStreaming]);

  return (
    <ScrollArea className={cn("flex-1 h-full", className)}>
      <div ref={scrollContainerRef} className="flex flex-col py-4">
        {/* Rendered messages */}
        {messages.map((message) => (
          <MessageBubble key={message._id} message={message} />
        ))}

        {/* Streaming content */}
        {isStreaming && streamingContent && (
          <div className="flex w-full gap-3 px-4 py-3 justify-start animate-in fade-in-0 duration-200">
            <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
              <AvatarFallback className="bg-saffron text-white text-xs font-bold">
                IG
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] min-w-0 items-start">
              <div className="bg-ai-bubble text-ai-bubble-foreground rounded-2xl rounded-tl-sm px-4 py-3 break-words">
                <MessageMarkdown content={streamingContent} />
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator when streaming just started but no content yet */}
        {isStreaming && !streamingContent && (
          <div className="flex w-full gap-3 px-4 py-3 justify-start animate-in fade-in-0 duration-200">
            <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
              <AvatarFallback className="bg-saffron text-white text-xs font-bold">
                IG
              </AvatarFallback>
            </Avatar>
            <div className="bg-ai-bubble rounded-2xl rounded-tl-sm px-4 py-2">
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-px" />
      </div>
    </ScrollArea>
  );
}
