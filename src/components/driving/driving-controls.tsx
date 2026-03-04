"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DrivingState = "idle" | "listening" | "speaking";

interface DrivingControlsProps {
  state: DrivingState;
  onTap: () => void;
  className?: string;
}

// Wave bars for listening animation
const WAVE_BARS = 24;
const waveBars = Array.from({ length: WAVE_BARS }, (_, i) => i);

export function DrivingControls({
  state,
  onTap,
  className,
}: DrivingControlsProps) {
  const stateConfig = {
    idle: {
      label: "Tap to speak",
      sublabel: "Touch anywhere below",
      bgClass: "bg-[#000040]/50",
      Icon: Mic,
      iconColor: "text-white/60",
    },
    listening: {
      label: "Listening...",
      sublabel: "Tap to stop",
      bgClass: "bg-red-950/40",
      Icon: Mic,
      iconColor: "text-red-400",
    },
    speaking: {
      label: "Speaking...",
      sublabel: "Tap to interrupt",
      bgClass: "bg-[#138808]/10",
      Icon: Volume2,
      iconColor: "text-[#138808]",
    },
  } as const;

  const config = stateConfig[state];
  const { Icon } = config;

  return (
    <motion.button
      onClick={onTap}
      className={cn(
        "relative w-full flex flex-col items-center justify-center",
        "min-h-[33vh] px-6 py-8",
        "border-t border-white/5",
        "transition-colors duration-500",
        "focus:outline-none active:bg-white/5",
        "select-none touch-manipulation",
        config.bgClass,
        className
      )}
      whileTap={{ scale: 0.98 }}
      aria-label={config.label}
    >
      {/* Listening wave animation - only visible when listening */}
      <AnimatePresence>
        {state === "listening" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-x-0 bottom-1/2 flex items-end justify-center gap-1 px-8 h-16 pointer-events-none"
          >
            {waveBars.map((i) => (
              <motion.div
                key={`dwave-${i}`}
                className="w-1 rounded-full bg-gradient-to-t from-red-500/60 to-red-400/30"
                animate={{
                  height: [6, 20 + Math.random() * 28, 6],
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  delay: i * 0.04,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        key={state}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative mb-4"
      >
        {state === "listening" && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/20"
            animate={{
              scale: [1, 2.5, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
            style={{
              width: 64,
              height: 64,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            state === "idle" && "bg-white/10",
            state === "listening" && "bg-red-500/30",
            state === "speaking" && "bg-[#138808]/20"
          )}
        >
          <Icon className={cn("w-8 h-8", config.iconColor)} />
        </div>
      </motion.div>

      {/* Label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={config.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-1"
        >
          <p
            className={cn(
              "text-2xl md:text-3xl font-medium",
              state === "idle" && "text-white/50",
              state === "listening" && "text-red-400",
              state === "speaking" && "text-[#138808]"
            )}
          >
            {config.label}
          </p>
          <p className="text-sm text-white/30">{config.sublabel}</p>
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
