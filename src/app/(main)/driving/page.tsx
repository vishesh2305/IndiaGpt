"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DrivingInterface } from "@/components/driving/driving-interface";
import { DrivingSafetyOverlay } from "@/components/driving/driving-safety-overlay";
import { useDrivingMode } from "@/hooks/use-driving-mode";
import { useVoiceStore } from "@/store/voice-store";
import { useLanguageStore } from "@/store/language-store";
import { useLocationStore } from "@/store/location-store";
import { useUIStore } from "@/store/ui-store";
import { getLanguageByCode } from "@/config/languages";
import { buildDrivingPrompt } from "@/lib/prompts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognitionCtor =
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition })
      .SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
      .webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) return null;
  return new SpeechRecognitionCtor();
}

function speakText(text: string, lang: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for driving clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        resolve();
      } else {
        reject(e);
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DrivingPage() {
  const router = useRouter();

  // Stores
  const { selectedLanguage } = useLanguageStore();
  const { city, state: locationState } = useLocationStore();
  const { setActiveMode } = useUIStore();
  const voiceStore = useVoiceStore();

  // Driving mode hook
  const {
    isActive,
    safetyAccepted,
    acceptSafety,
    startDrivingMode,
    stopDrivingMode,
  } = useDrivingMode();

  // Local state
  const [aiResponse, setAiResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoRestartRef = useRef(true);

  // Set active mode on mount
  useEffect(() => {
    setActiveMode("driving");
    return () => {
      stopEverything();
      setActiveMode("chat");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Auto-start listening when driving mode becomes active
  useEffect(() => {
    if (isActive && !voiceStore.isListening && !voiceStore.isSpeaking && !isProcessing && !isStreaming) {
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // ── Stop everything ──────────────────────────────────────────
  const stopEverything = useCallback(() => {
    autoRestartRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    voiceStore.reset();
    stopDrivingMode();
    setIsStreaming(false);
    setIsProcessing(false);
  }, [voiceStore, stopDrivingMode]);

  // ── Send transcript to AI with driving prompt ────────────────
  const sendToAI = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsProcessing(true);
      setAiResponse("");

      const langObj = getLanguageByCode(selectedLanguage);
      const systemPrompt = buildDrivingPrompt({
        language: selectedLanguage,
        languageName: langObj?.name ?? "English",
        city: city ?? undefined,
        state: locationState ?? undefined,
        mode: "driving",
      });

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch("/api/chat/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            systemPrompt,
            language: selectedLanguage,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to get AI response");
        }

        setIsProcessing(false);
        setIsStreaming(true);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") break;
                try {
                  const parsed = JSON.parse(data);
                  const token =
                    parsed.choices?.[0]?.delta?.content ?? parsed.content ?? "";
                  if (token) {
                    fullText += token;
                    setAiResponse(fullText);
                  }
                } catch {
                  if (data && data !== "[DONE]") {
                    fullText += data;
                    setAiResponse(fullText);
                  }
                }
              }
            }
          }
        }

        setIsStreaming(false);

        // Auto-TTS for every response in driving mode
        if (fullText.trim()) {
          voiceStore.setIsSpeaking(true);
          const bcp47 = langObj?.bcp47 ?? "en-IN";
          try {
            await speakText(fullText, bcp47);
          } catch {
            // TTS error is non-fatal
          }
          voiceStore.setIsSpeaking(false);
        }

        // Auto-restart listening in driving mode (continuous)
        if (autoRestartRef.current && isActive) {
          setTimeout(() => {
            startListening();
          }, 300);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        voiceStore.setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        setIsProcessing(false);
        setIsStreaming(false);

        // Restart listening even after error in driving mode
        if (autoRestartRef.current && isActive) {
          setTimeout(() => startListening(), 1000);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLanguage, city, locationState, isActive]
  );

  // ── Start speech recognition (continuous for driving) ────────
  const startListening = useCallback(() => {
    if (recognitionRef.current) return; // Already listening

    const recognition = getSpeechRecognition();
    if (!recognition) {
      voiceStore.setError(
        "Speech recognition is not supported in this browser. Please use Chrome."
      );
      return;
    }

    const langObj = getLanguageByCode(selectedLanguage);
    recognition.lang = langObj?.bcp47 ?? "en-IN";
    recognition.continuous = true; // Always continuous in driving mode
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Stop any ongoing TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    voiceStore.setIsSpeaking(false);

    let finalTranscript = "";
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    recognition.onstart = () => {
      voiceStore.setIsListening(true);
      voiceStore.clearTranscript();
      finalTranscript = "";
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          voiceStore.setConfidence(result[0].confidence);
        } else {
          interim += result[0].transcript;
        }
      }
      voiceStore.setTranscript(finalTranscript);
      voiceStore.setInterimTranscript(interim);

      // In driving mode: if we have a final transcript, wait 1.5s of
      // silence before sending to AI (user might still be speaking)
      if (finalTranscript.trim()) {
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          // Stop recognition and send
          recognition.stop();
        }, 1500);
      }
    };

    recognition.onend = () => {
      voiceStore.setIsListening(false);
      recognitionRef.current = null;

      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }

      const textToSend = finalTranscript.trim();
      if (textToSend) {
        sendToAI(textToSend);
      } else if (autoRestartRef.current && isActive) {
        // No speech detected - restart listening
        setTimeout(() => startListening(), 300);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        voiceStore.setIsListening(false);
        recognitionRef.current = null;

        // Auto-restart after no-speech in driving mode
        if (event.error === "no-speech" && autoRestartRef.current && isActive) {
          setTimeout(() => startListening(), 500);
        }
        return;
      }
      voiceStore.setError(`Speech recognition error: ${event.error}`);
      recognitionRef.current = null;

      // Attempt restart after error
      if (autoRestartRef.current && isActive) {
        setTimeout(() => startListening(), 1000);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [selectedLanguage, voiceStore, sendToAI, isActive]);

  // ── Stop listening ───────────────────────────────────────────
  const stopListening = useCallback(() => {
    autoRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // ── Handle tap on control area ───────────────────────────────
  const handleTap = useCallback(() => {
    if (voiceStore.isSpeaking) {
      // Interrupt TTS
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      voiceStore.setIsSpeaking(false);
      // Restart listening
      autoRestartRef.current = true;
      setTimeout(() => startListening(), 200);
      return;
    }

    if (voiceStore.isListening) {
      stopListening();
    } else {
      autoRestartRef.current = true;
      startListening();
    }
  }, [voiceStore, startListening, stopListening]);

  // ── Accept safety disclaimer ─────────────────────────────────
  const handleAcceptSafety = useCallback(async () => {
    acceptSafety();
    autoRestartRef.current = true;
    await startDrivingMode();
  }, [acceptSafety, startDrivingMode]);

  // ── Exit driving mode ────────────────────────────────────────
  const handleExit = useCallback(() => {
    stopEverything();
    router.push("/");
  }, [stopEverything, router]);

  // ── Cancel (from safety overlay) ─────────────────────────────
  const handleCancel = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <>
      {/* Safety overlay - shown if not yet accepted */}
      <DrivingSafetyOverlay
        visible={!safetyAccepted}
        onAccept={handleAcceptSafety}
        onCancel={handleCancel}
      />

      {/* Driving interface - shown after safety acceptance */}
      {safetyAccepted && (
        <DrivingInterface
          response={aiResponse}
          isStreaming={isStreaming}
          isProcessing={isProcessing}
          onTap={handleTap}
          onExit={handleExit}
        />
      )}
    </>
  );
}
