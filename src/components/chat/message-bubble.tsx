"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CopyButton } from "@/components/chat/copy-button";
import { MessageMarkdown } from "@/components/chat/message-markdown";
import { cn } from "@/lib/utils";
import type { Message, Attachment } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  className?: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AttachmentThumbnail({ attachment }: { attachment: Attachment }) {
  if (attachment.type === "image") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="h-32 w-auto max-w-[200px] rounded-lg object-cover border border-border hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm"
    >
      <svg
        className="h-5 w-5 text-saffron-600 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <span className="truncate max-w-[150px]">{attachment.name}</span>
    </a>
  );
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const { data: session } = useSession();
  const isUser = message.role === "user";

  const relativeTime = useMemo(
    () => formatRelativeTime(message.createdAt),
    [message.createdAt]
  );

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-4 py-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-saffron text-white text-xs font-bold">
            IG
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[75%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "group relative px-4 py-3 break-words",
            isUser
              ? "bg-user-bubble text-user-bubble-foreground rounded-2xl rounded-tr-sm"
              : "bg-ai-bubble text-ai-bubble-foreground rounded-2xl rounded-tl-sm"
          )}
        >
          {/* Message text */}
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          ) : (
            <MessageMarkdown content={message.content} />
          )}

          {/* Copy button for AI messages (visible on hover) */}
          {!isUser && (
            <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
            </div>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.attachments.map((attachment, index) => (
              <AttachmentThumbnail key={index} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[11px] text-muted-foreground px-1">
          {relativeTime}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          {session?.user?.image && (
            <AvatarImage
              src={session.user.image}
              alt={session.user.name || "User"}
            />
          )}
          <AvatarFallback className="bg-saffron-100 text-saffron-700 text-xs font-bold">
            {getInitials(session?.user?.name)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
