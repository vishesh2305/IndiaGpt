"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, X, Radio, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANGUAGES, getLanguageByCode } from "@/config/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VoiceMode = "push-to-talk" | "continuous";

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  mode: VoiceMode;
  selectedLanguage: string;
  onToggleListening: () => void;
  onModeChange: (mode: VoiceMode) => void;
  onLanguageChange: (code: string) => void;
  onExit: () => void;
  className?: string;
}

export function VoiceControls({
  isListening,
  isSpeaking,
  mode,
  selectedLanguage,
  onToggleListening,
  onModeChange,
  onLanguageChange,
  onExit,
  className,
}: VoiceControlsProps) {
  const currentLang = getLanguageByCode(selectedLanguage);
  const langLabel = currentLang?.code.toUpperCase() ?? "EN";

  // Status text below the mic button
  const statusText = isSpeaking
    ? "AI is speaking..."
    : isListening
      ? "Listening..."
      : mode === "push-to-talk"
        ? "Tap to speak"
        : "Tap to start";

  return (
    <div className={cn("relative w-full px-4 pb-6", className)}>
      {/* ── Exit button (top-right corner) ──────────────────────── */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onExit}
        className="absolute -top-12 right-4 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        aria-label="Exit voice mode"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* ── Main controls row ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-8">
        {/* Left: Mode toggle pill */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative flex items-center bg-gray-100 rounded-full p-0.5 border border-gray-200">
            {/* Sliding background indicator */}
            <motion.div
              className="absolute top-0.5 bottom-0.5 rounded-full bg-white shadow-sm"
              initial={false}
              animate={{
                left: mode === "push-to-talk" ? "2px" : "50%",
                right: mode === "push-to-talk" ? "50%" : "2px",
              }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />

            <button
              onClick={() => onModeChange("push-to-talk")}
              className={cn(
                "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                mode === "push-to-talk"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-label="Push to talk mode"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>PTT</span>
            </button>

            <button
              onClick={() => onModeChange("continuous")}
              className={cn(
                "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                mode === "continuous"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-label="Continuous listening mode"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            Mode
          </span>
        </div>

        {/* Center: Large mic button */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={onToggleListening}
            disabled={isSpeaking}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "relative w-20 h-20 rounded-full flex items-center justify-center",
              "transition-colors duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isListening
                ? "bg-red-500 shadow-xl shadow-red-500/30 focus-visible:ring-red-300"
                : "bg-gradient-to-br from-[#FF9933] to-[#FF9933]/85 shadow-xl shadow-[#FF9933]/25 focus-visible:ring-[#FF9933]/40"
            )}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {/* Animated ring when listening */}
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-red-400"
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}

            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </motion.button>

          {/* Status text */}
          <motion.p
            key={statusText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-sm font-medium",
              isListening ? "text-red-500" : isSpeaking ? "text-[#138808]" : "text-gray-500"
            )}
          >
            {statusText}
          </motion.p>
        </div>

        {/* Right: Language selector */}
        <div className="flex flex-col items-center gap-1.5">
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger
              className="w-[72px] h-9 rounded-full border-gray-200 bg-gray-50 text-xs font-bold text-gray-700 focus:ring-[#FF9933]/30"
              aria-label="Select language"
            >
              <SelectValue>{langLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="text-sm">
                  <span className="font-medium">{lang.code.toUpperCase()}</span>
                  <span className="ml-2 text-gray-500">{lang.nativeName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            Language
          </span>
        </div>
      </div>
    </div>
  );
}
