"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VoiceInterface } from "@/components/voice/voice-interface";
import { useVoiceStore } from "@/store/voice-store";
import { useLanguageStore } from "@/store/language-store";
import { useLocationStore } from "@/store/location-store";
import { useUIStore } from "@/store/ui-store";
import { getLanguageByCode } from "@/config/languages";
import { buildVoicePrompt } from "@/lib/prompts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a SpeechRecognition instance if available in the browser.
 * Uses the standard or webkit-prefixed constructor.
 */
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

/**
 * Speak text aloud using the Web Speech Synthesis API.
 * Returns a promise that resolves when speech finishes.
 */
function speakText(text: string, lang: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Try to pick a good voice for this language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      // "interrupted" is expected when user taps again
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

export default function VoicePage() {
  const router = useRouter();

  // Stores
  const { selectedLanguage, setLanguage } = useLanguageStore();
  const { city, state: locationState } = useLocationStore();
  const { setActiveMode } = useUIStore();
  const voiceStore = useVoiceStore();

  // Local state
  const [aiResponse, setAiResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Set active mode on mount
  useEffect(() => {
    setActiveMode("voice");
    return () => {
      // Cleanup on unmount
      stopEverything();
      setActiveMode("chat");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load voices (Chrome needs this event)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // ── Stop everything ──────────────────────────────────────────
  const stopEverything = useCallback(() => {
    // Stop recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    // Cancel streaming
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    // Stop TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    voiceStore.reset();
    setIsStreaming(false);
    setIsProcessing(false);
  }, [voiceStore]);

  // ── Send transcript to AI ────────────────────────────────────
  const sendToAI = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsProcessing(true);
      setAiResponse("");

      const langObj = getLanguageByCode(selectedLanguage);
      const systemPrompt = buildVoicePrompt({
        language: selectedLanguage,
        languageName: langObj?.name ?? "English",
        city: city ?? undefined,
        state: locationState ?? undefined,
        mode: "voice",
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

            // Parse SSE data lines
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
                  // If it's not JSON, treat the whole data as text content
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

        // Speak the full response via TTS
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

        // If in continuous mode, auto-restart listening
        if (voiceStore.mode === "continuous") {
          startListening();
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled - ignore
          return;
        }
        voiceStore.setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        setIsProcessing(false);
        setIsStreaming(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLanguage, city, locationState, voiceStore.mode]
  );

  // ── Start speech recognition ─────────────────────────────────
  const startListening = useCallback(() => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      voiceStore.setError(
        "Speech recognition is not supported in this browser. Please use Chrome."
      );
      return;
    }

    const langObj = getLanguageByCode(selectedLanguage);
    recognition.lang = langObj?.bcp47 ?? "en-IN";
    recognition.continuous = voiceStore.mode === "continuous";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Stop any ongoing TTS when user starts speaking
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    voiceStore.setIsSpeaking(false);

    let finalTranscript = "";

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
    };

    recognition.onend = () => {
      voiceStore.setIsListening(false);
      recognitionRef.current = null;

      // Send the accumulated transcript to AI
      const textToSend = finalTranscript.trim();
      if (textToSend) {
        sendToAI(textToSend);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        // Expected errors - just stop listening
        voiceStore.setIsListening(false);
        return;
      }
      voiceStore.setError(`Speech recognition error: ${event.error}`);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [selectedLanguage, voiceStore, sendToAI]);

  // ── Stop speech recognition ──────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // ── Toggle listening ─────────────────────────────────────────
  const handleToggleListening = useCallback(() => {
    if (voiceStore.isSpeaking) return;

    if (voiceStore.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceStore.isListening, voiceStore.isSpeaking, startListening, stopListening]);

  // ── Exit voice mode ──────────────────────────────────────────
  const handleExit = useCallback(() => {
    stopEverything();
    router.push("/");
  }, [stopEverything, router]);

  // ── Handle language change ───────────────────────────────────
  const handleLanguageChange = useCallback(
    (code: string) => {
      setLanguage(code);
      // Restart recognition with new language if currently listening
      if (voiceStore.isListening) {
        stopListening();
        // Small delay to let the previous recognition fully stop
        setTimeout(() => startListening(), 200);
      }
    },
    [setLanguage, voiceStore.isListening, stopListening, startListening]
  );

  return (
    <VoiceInterface
      response={aiResponse}
      isStreaming={isStreaming}
      isProcessing={isProcessing}
      selectedLanguage={selectedLanguage}
      onToggleListening={handleToggleListening}
      onLanguageChange={handleLanguageChange}
      onExit={handleExit}
    />
  );
}
