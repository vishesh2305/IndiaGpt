"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceTranscriptProps {
  transcript: string;
  interimTranscript: string;
  className?: string;
}

export function VoiceTranscript({
  transcript,
  interimTranscript,
  className,
}: VoiceTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest text
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  const hasContent = transcript.length > 0 || interimTranscript.length > 0;

  return (
    <div
      className={cn(
        "w-full max-w-lg mx-auto px-4",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {!hasContent ? (
          <motion.p
            key="placeholder"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-center text-base text-gray-400 italic select-none"
          >
            Say something...
          </motion.p>
        ) : (
          <motion.div
            key="content"
            ref={scrollRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
          >
            <p className="text-center text-lg leading-relaxed">
              {/* Final / committed transcript */}
              {transcript && (
                <span className="text-gray-800 font-medium">
                  {transcript}
                </span>
              )}

              {/* Spacer between final and interim */}
              {transcript && interimTranscript && " "}

              {/* Interim / still-being-recognised text */}
              {interimTranscript && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-400"
                >
                  {interimTranscript}
                  {/* Blinking cursor */}
                  <motion.span
                    className="inline-block ml-0.5 w-0.5 h-5 bg-[#FF9933] align-text-bottom"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
