"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/store/voice-store";
import { DrivingStatusBar } from "./driving-status-bar";
import { DrivingDisplay } from "./driving-display";
import { DrivingControls } from "./driving-controls";

type DrivingState = "idle" | "listening" | "speaking";

interface DrivingInterfaceProps {
  /** AI response text to show in the center display */
  response: string;
  /** Whether the response is actively streaming */
  isStreaming: boolean;
  /** Whether processing (waiting for first token) */
  isProcessing: boolean;
  /** Called when the user taps the control area */
  onTap: () => void;
  /** Called when the user exits driving mode */
  onExit: () => void;
  className?: string;
}

export function DrivingInterface({
  response,
  isStreaming,
  isProcessing,
  onTap,
  onExit,
  className,
}: DrivingInterfaceProps) {
  const { isListening, isSpeaking } = useVoiceStore();

  // Derive the driving control state
  const drivingState: DrivingState = useMemo(() => {
    if (isSpeaking) return "speaking";
    if (isListening) return "listening";
    return "idle";
  }, [isSpeaking, isListening]);

  // Connection status: true if we're not in an error state
  const isConnected = true;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col",
        "bg-[#050520]",
        className
      )}
    >
      {/* Subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,128,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* ── Status Bar ─────────────────────────────────────────── */}
      <DrivingStatusBar
        isConnected={isConnected}
        isListening={isListening}
        onExit={onExit}
      />

      {/* ── Center Display ─────────────────────────────────────── */}
      <DrivingDisplay
        response={response}
        isStreaming={isStreaming || isProcessing}
      />

      {/* ── Bottom Controls ────────────────────────────────────── */}
      <DrivingControls
        state={drivingState}
        onTap={onTap}
      />

      {/* ── Bottom tricolor accent ─────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </div>
  );
}
