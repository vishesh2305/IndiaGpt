"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/store/voice-store";
import { VoiceVisualizer } from "./voice-visualizer";
import { VoiceTranscript } from "./voice-transcript";
import { VoiceResponse } from "./voice-response";
import { VoiceControls } from "./voice-controls";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceInterfaceProps {
  /** AI response text to display */
  response: string;
  /** Whether the AI response is actively streaming */
  isStreaming: boolean;
  /** Whether the system is processing (sent to AI, waiting for first token) */
  isProcessing: boolean;
  /** Selected language code */
  selectedLanguage: string;
  /** Called when user toggles listening on/off */
  onToggleListening: () => void;
  /** Called when language changes */
  onLanguageChange: (code: string) => void;
  /** Called when user wants to exit voice mode */
  onExit: () => void;
  className?: string;
}

export function VoiceInterface({
  response,
  isStreaming,
  isProcessing,
  selectedLanguage,
  onToggleListening,
  onLanguageChange,
  onExit,
  className,
}: VoiceInterfaceProps) {
  const {
    isListening,
    isSpeaking,
    mode,
    transcript,
    interimTranscript,
    setMode,
  } = useVoiceStore();

  // Derive the visual state for the visualizer
  const voiceState: VoiceState = useMemo(() => {
    if (isSpeaking) return "speaking";
    if (isProcessing || isStreaming) return "processing";
    if (isListening) return "listening";
    return "idle";
  }, [isSpeaking, isProcessing, isStreaming, isListening]);

  // State label shown above visualizer
  const stateLabel = useMemo(() => {
    switch (voiceState) {
      case "listening":
        return "Listening";
      case "processing":
        return "Thinking";
      case "speaking":
        return "Speaking";
      default:
        return "Ready";
    }
  }, [voiceState]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-between",
        "h-full w-full overflow-hidden",
        // Subtle saffron-to-white gradient background
        "bg-gradient-to-b from-[#FF9933]/[0.04] via-white to-white",
        className
      )}
    >
      {/* ── Top Section: AI Response ─────────────────────────────── */}
      <div className="flex-1 flex items-end w-full pt-6 pb-4 min-h-0">
        <VoiceResponse
          response={response}
          isStreaming={isStreaming}
        />
      </div>

      {/* ── Center Section: Visualizer + State Label ─────────────── */}
      <div className="flex flex-col items-center gap-4 py-6">
        {/* State label */}
        <AnimatePresence mode="wait">
          <motion.span
            key={stateLabel}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "text-sm font-semibold uppercase tracking-widest",
              voiceState === "listening" && "text-[#FF9933]",
              voiceState === "processing" && "text-[#000080]",
              voiceState === "speaking" && "text-[#138808]",
              voiceState === "idle" && "text-gray-400"
            )}
          >
            {stateLabel}
          </motion.span>
        </AnimatePresence>

        {/* Visualizer */}
        <VoiceVisualizer state={voiceState} />
      </div>

      {/* ── Below Visualizer: User Transcript ────────────────────── */}
      <div className="w-full py-3">
        <VoiceTranscript
          transcript={transcript}
          interimTranscript={interimTranscript}
        />
      </div>

      {/* ── Bottom Section: Controls ─────────────────────────────── */}
      <div className="w-full py-4">
        <VoiceControls
          isListening={isListening}
          isSpeaking={isSpeaking}
          mode={mode}
          selectedLanguage={selectedLanguage}
          onToggleListening={onToggleListening}
          onModeChange={setMode}
          onLanguageChange={onLanguageChange}
          onExit={onExit}
        />
      </div>

      {/* ── Decorative bottom tricolor line ──────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </div>
  );
}
