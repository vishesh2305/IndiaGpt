"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseDrivingModeReturn {
  /** Whether driving mode is currently active (safety accepted + running) */
  isActive: boolean;
  /** Whether the user has accepted the safety disclaimer this session */
  safetyAccepted: boolean;
  /** Accept the safety disclaimer and activate driving mode */
  acceptSafety: () => void;
  /** Start driving mode (acquires wake lock, etc.) */
  startDrivingMode: () => Promise<void>;
  /** Stop driving mode (releases wake lock, etc.) */
  stopDrivingMode: () => void;
}

const SAFETY_SESSION_KEY = "india-gpt-driving-safety-accepted";

/**
 * Custom hook that manages driving mode lifecycle:
 * - Screen wake lock (prevents screen dimming)
 * - Safety disclaimer acceptance tracking
 * - Cleanup on unmount
 */
export function useDrivingMode(): UseDrivingModeReturn {
  const [isActive, setIsActive] = useState(false);
  const [safetyAccepted, setSafetyAccepted] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // ── Check session storage for prior acceptance ────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const accepted = sessionStorage.getItem(SAFETY_SESSION_KEY);
      if (accepted === "true") {
        setSafetyAccepted(true);
      }
    }
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-acquire wake lock on visibility change ─────────────────
  // The browser releases wake lock when the tab is backgrounded.
  // Re-acquire it when the tab becomes visible again.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isActive) {
        await acquireWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive]);

  // ── Wake lock helpers ─────────────────────────────────────────

  const acquireWakeLock = async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      // Wake Lock API not supported - driving mode still works, just
      // the screen may dim on some devices.
      return;
    }

    try {
      // Release existing lock if any
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
      }

      const sentinel = await navigator.wakeLock.request("screen");
      wakeLockRef.current = sentinel;

      // Listen for the lock being released externally
      sentinel.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch (err) {
      // Wake lock request can fail (e.g., low battery, background tab).
      // This is non-fatal - driving mode continues without it.
      console.warn("Wake Lock request failed:", err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {
        // Ignore release errors
      });
      wakeLockRef.current = null;
    }
  };

  // ── Public API ────────────────────────────────────────────────

  const acceptSafety = useCallback(() => {
    setSafetyAccepted(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SAFETY_SESSION_KEY, "true");
    }
  }, []);

  const startDrivingMode = useCallback(async () => {
    await acquireWakeLock();
    setIsActive(true);
  }, []);

  const stopDrivingMode = useCallback(() => {
    releaseWakeLock();
    setIsActive(false);
  }, []);

  return {
    isActive,
    safetyAccepted,
    acceptSafety,
    startDrivingMode,
    stopDrivingMode,
  };
}
