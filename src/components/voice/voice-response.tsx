"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceResponseProps {
  /** Fully completed AI response text */
  response: string;
  /** Whether the response is still streaming in */
  isStreaming: boolean;
  className?: string;
}

/**
 * Strips basic markdown formatting for clean spoken-text display.
 * Removes **, ##, -, *, ``` and similar markers while preserving content.
 */
function stripMarkdown(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```\w*\n?/g, "").replace(/```/g, "")
    )
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove link syntax, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove bullet markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    // Remove numbered list markers but keep text
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Collapse multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function VoiceResponse({
  response,
  isStreaming,
  className,
}: VoiceResponseProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as streaming content grows
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response]);

  const cleanText = stripMarkdown(response);

  return (
    <AnimatePresence>
      {cleanText.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={cn(
            "w-full max-w-xl mx-auto px-4",
            className
          )}
        >
          <div className="relative rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg shadow-black/5 border border-gray-100 px-6 py-5">
            {/* Subtle tricolor top accent */}
            <div className="absolute top-0 left-6 right-6 h-0.5 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
            </div>

            {/* Scrollable response area */}
            <div
              ref={scrollRef}
              className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-2"
            >
              <p className="text-xl leading-relaxed text-gray-800 whitespace-pre-wrap">
                {cleanText}

                {/* Typing cursor while streaming */}
                {isStreaming && (
                  <motion.span
                    className="inline-block ml-1 w-0.5 h-5 bg-[#FF9933] align-text-bottom"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
