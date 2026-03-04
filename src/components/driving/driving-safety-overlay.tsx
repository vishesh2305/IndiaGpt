"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Eye, Mic, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DrivingSafetyOverlayProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const safetyPoints = [
  {
    icon: Eye,
    text: "Keep your eyes on the road",
  },
  {
    icon: Mic,
    text: "Use voice commands only",
  },
  {
    icon: Car,
    text: "Pull over for complex tasks",
  },
] as const;

export function DrivingSafetyOverlay({
  visible,
  onAccept,
  onCancel,
}: DrivingSafetyOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "w-full max-w-md",
              "rounded-3xl overflow-hidden",
              "bg-gradient-to-b from-[#0a0a2e] to-[#060618]",
              "border border-white/10",
              "shadow-2xl shadow-black/50"
            )}
          >
            {/* Top tricolor accent */}
            <div className="h-1 flex">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#138808]" />
            </div>

            <div className="px-8 py-8">
              {/* Warning icon */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#FF9933]/20"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative w-16 h-16 rounded-full bg-[#FF9933]/15 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-[#FF9933]" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-center text-2xl font-bold text-white mb-2">
                Driving Mode
              </h2>

              {/* Description */}
              <p className="text-center text-sm text-gray-400 leading-relaxed mb-6">
                This mode is designed for hands-free use while driving. Please
                keep your eyes on the road at all times. IndiaGPT will listen to
                your voice and respond with audio.
              </p>

              {/* Safety points */}
              <div className="space-y-3 mb-8">
                {safetyPoints.map((point, idx) => {
                  const Icon = point.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.1 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#FF9933]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#FF9933]" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">
                        {point.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  onClick={onAccept}
                  className={cn(
                    "w-full h-12 rounded-xl text-base font-semibold",
                    "bg-gradient-to-r from-[#FF9933] to-[#FF9933]/85",
                    "hover:from-[#FF9933]/90 hover:to-[#FF9933]/75",
                    "text-white shadow-lg shadow-[#FF9933]/20",
                    "transition-all duration-200"
                  )}
                >
                  I understand, start driving mode
                </Button>

                <Button
                  variant="ghost"
                  onClick={onCancel}
                  className="w-full h-10 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
