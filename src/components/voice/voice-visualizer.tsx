"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceVisualizerProps {
  state: VoiceState;
  className?: string;
}

// ---------------------------------------------------------------------------
// Concentric ring configs for listening state
// ---------------------------------------------------------------------------
const RING_COUNT = 4;
const rings = Array.from({ length: RING_COUNT }, (_, i) => i);

// ---------------------------------------------------------------------------
// Wave bar configs for speaking state
// ---------------------------------------------------------------------------
const WAVE_BAR_COUNT = 12;
const waveBars = Array.from({ length: WAVE_BAR_COUNT }, (_, i) => i);

export function VoiceVisualizer({ state, className }: VoiceVisualizerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "w-[200px] h-[200px]",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {/* ── Idle State ─────────────────────────────────────────── */}
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-center justify-center"
          >
            {/* Subtle static outer ring */}
            <div className="absolute w-24 h-24 rounded-full border-2 border-[#FF9933]/20" />
            {/* Inner circle */}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#FF9933]/10 to-[#FF9933]/5 flex items-center justify-center shadow-lg shadow-[#FF9933]/10">
              <Mic className="w-7 h-7 text-[#FF9933]" />
            </div>
          </motion.div>
        )}

        {/* ── Listening State ────────────────────────────────────── */}
        {state === "listening" && (
          <motion.div
            key="listening"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-center justify-center"
          >
            {/* Concentric pulsing rings */}
            {rings.map((i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute rounded-full border-2 border-[#FF9933]"
                initial={{ width: 48, height: 48, opacity: 0.6 }}
                animate={{
                  width: [48, 80 + i * 32, 48],
                  height: [48, 80 + i * 32, 48],
                  opacity: [0.5 - i * 0.1, 0.15, 0.5 - i * 0.1],
                  borderColor: [
                    "rgba(255, 153, 51, 0.6)",
                    "rgba(255, 153, 51, 0.15)",
                    "rgba(255, 153, 51, 0.6)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.35,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Core circle with mic */}
            <motion.div
              className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FF9933]/80 flex items-center justify-center shadow-xl shadow-[#FF9933]/30"
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  "0 0 20px rgba(255, 153, 51, 0.3)",
                  "0 0 40px rgba(255, 153, 51, 0.5)",
                  "0 0 20px rgba(255, 153, 51, 0.3)",
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Mic className="w-7 h-7 text-white" />
            </motion.div>
          </motion.div>
        )}

        {/* ── Processing State ───────────────────────────────────── */}
        {state === "processing" && (
          <motion.div
            key="processing"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-center justify-center"
          >
            {/* Spinning outer ring */}
            <motion.div
              className="absolute w-28 h-28 rounded-full"
              style={{
                border: "3px solid transparent",
                borderTopColor: "#FF9933",
                borderRightColor: "#138808",
                borderBottomColor: "#000080",
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Second spinning ring (counter-direction) */}
            <motion.div
              className="absolute w-20 h-20 rounded-full"
              style={{
                border: "2px solid transparent",
                borderTopColor: "#138808",
                borderLeftColor: "#FF9933",
              }}
              animate={{ rotate: -360 }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Center */}
            <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9933]/10 to-[#138808]/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#FF9933] animate-spin" />
            </div>
          </motion.div>
        )}

        {/* ── Speaking State ─────────────────────────────────────── */}
        {state === "speaking" && (
          <motion.div
            key="speaking"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-center justify-center"
          >
            {/* Wave bars arranged in a circle */}
            <div className="absolute flex items-center justify-center">
              {waveBars.map((i) => {
                const angle = (i / WAVE_BAR_COUNT) * 360;
                const radians = (angle * Math.PI) / 180;
                const radius = 60;
                const x = Math.cos(radians) * radius;
                const y = Math.sin(radians) * radius;

                return (
                  <motion.div
                    key={`wave-${i}`}
                    className="absolute w-1 rounded-full bg-gradient-to-t from-[#138808] to-[#FF9933]"
                    style={{
                      left: `calc(50% + ${x}px - 2px)`,
                      top: `calc(50% + ${y}px - 8px)`,
                      transformOrigin: "center",
                      transform: `rotate(${angle}deg)`,
                    }}
                    animate={{
                      height: [12, 28 + Math.random() * 12, 12],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.6 + Math.random() * 0.4,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </div>

            {/* Center icon */}
            <motion.div
              className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-[#138808] to-[#138808]/80 flex items-center justify-center shadow-xl shadow-[#138808]/20"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Volume2 className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
