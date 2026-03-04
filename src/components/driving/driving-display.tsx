"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DrivingDisplayProps {
  /** Current AI response text (plain, no markdown) */
  response: string;
  /** Whether the response is still being streamed */
  isStreaming: boolean;
  className?: string;
}

/**
 * Strips markdown formatting for clean driving-mode display.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```\w*\n?/g, "").replace(/```/g, "")
    )
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function DrivingDisplay({
  response,
  isStreaming,
  className,
}: DrivingDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response]);

  const cleanText = stripMarkdown(response);
  const hasResponse = cleanText.length > 0;

  return (
    <div
      className={cn(
        "flex-1 flex items-center justify-center px-6 py-8",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {!hasResponse ? (
          /* ── No response yet: "Tap to speak" prompt ──────────── */
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-3xl md:text-5xl font-light text-white/20 text-center select-none leading-tight">
              Tap to speak
            </p>
            <p className="text-sm text-white/10 font-medium">
              IndiaGPT is ready to assist
            </p>
          </motion.div>
        ) : (
          /* ── AI Response ─────────────────────────────────────── */
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="w-full max-w-3xl"
          >
            <div
              ref={scrollRef}
              className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              <p className="text-3xl md:text-5xl font-light text-white leading-snug md:leading-snug text-center whitespace-pre-wrap">
                {cleanText}

                {/* Streaming cursor */}
                {isStreaming && (
                  <motion.span
                    className="inline-block ml-1.5 w-1 h-8 md:h-12 bg-[#FF9933] align-text-bottom rounded-full"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
