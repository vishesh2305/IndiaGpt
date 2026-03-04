"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { cn } from "@/lib/utils";

interface MessageSkeletonProps {
  className?: string;
}

export function MessageSkeleton({ className }: MessageSkeletonProps) {
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", className)}>
      {/* AI avatar placeholder */}
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-saffron/20 flex items-center justify-center">
        <span className="text-xs font-bold text-saffron">IG</span>
      </div>

      {/* Message content */}
      <div className="flex flex-col gap-2 max-w-[75%]">
        <div className="bg-ai-bubble rounded-2xl rounded-tl-sm px-4 py-3">
          <TypingIndicator />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
