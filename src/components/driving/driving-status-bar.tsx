"use client";

import { motion } from "framer-motion";
import { X, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrivingStatusBarProps {
  isConnected: boolean;
  isListening: boolean;
  onExit: () => void;
  className?: string;
}

export function DrivingStatusBar({
  isConnected,
  isListening,
  onExit,
  className,
}: DrivingStatusBarProps) {
  const statusLabel = isListening ? "Listening" : isConnected ? "Connected" : "Offline";

  return (
    <div
      className={cn(
        "relative z-10 flex items-center justify-between",
        "h-10 px-4",
        "bg-[#000020]/60 backdrop-blur-md",
        className
      )}
    >
      {/* Left: Driving mode label */}
      <div className="flex items-center gap-2">
        <Car className="w-4 h-4 text-[#FF9933]" />
        <span className="text-sm font-semibold text-[#FF9933] tracking-wide">
          Driving Mode
        </span>
      </div>

      {/* Center: Status indicator */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <motion.div
          className={cn(
            "w-2 h-2 rounded-full",
            isListening
              ? "bg-red-400"
              : isConnected
                ? "bg-emerald-400"
                : "bg-gray-500"
          )}
          animate={
            isListening
              ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }
              : isConnected
                ? { opacity: [1, 0.5, 1] }
                : {}
          }
          transition={{
            duration: isListening ? 0.8 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <span className="text-xs text-gray-400 font-medium">{statusLabel}</span>
      </div>

      {/* Right: Exit button */}
      <button
        onClick={onExit}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9933]"
        aria-label="Exit driving mode"
      >
        <X className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
      </button>
    </div>
  );
}
