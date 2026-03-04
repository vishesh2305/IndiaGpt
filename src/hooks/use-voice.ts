"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { useVoiceStore } from "@/store/voice-store";
import { LANGUAGES, getLanguageByCode } from "@/config/languages";

// ── Browser compatibility types ─────────────────────────────────────────────

// The Web Speech API types are not standardised across browsers, so we
// define the minimal interface we rely on.
type SpeechRecognitionInstance = InstanceType<
  typeof SpeechRecognition
> & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

/**
 * Returns the SpeechRecognition constructor, accounting for vendor prefixes.
 */
function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;

  const SR =
    (window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  return (SR as new () => SpeechRecognitionInstance) ?? null;
}

/**
 * Resolves a short language code (e.g. "hi") to a BCP 47 tag (e.g. "hi-IN")
 * using the LANGUAGES config, falling back to "en-IN".
 */
function toBcp47(languageCode: string): string {
  const lang = getLanguageByCode(languageCode);
  return lang?.bcp47 ?? "en-IN";
}

/**
 * Custom hook wrapping the Web Speech Recognition and Speech Synthesis APIs.
 *
 * - Handles the webkit prefix for Chrome and Safari
 * - Supports both push-to-talk and continuous recognition modes
 * - Manages full lifecycle: start, stop, results, errors
 * - Text-to-speech with language-aware voice selection
 * - Automatic cleanup on unmount
 */
export function useVoice() {
  const {
    isListening,
    mode,
    isSpeaking,
    setIsListening,
    setTranscript,
    setInterimTranscript,
    setIsSpeaking,
    setConfidence,
    setError,
    clearTranscript,
  } = useVoiceStore();

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /** Whether the browser supports SpeechRecognition at all. */
  const isRecognitionSupported = useMemo(
    () => getSpeechRecognitionConstructor() !== null,
    []
  );

  /** Whether the browser supports SpeechSynthesis. */
  const isSynthesisSupported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    []
  );

  const isSupported = isRecognitionSupported || isSynthesisSupported;

  // ── Speech Recognition ─────────────────────────────────────────────────

  const startListening = useCallback(
    (language: string = "en") => {
      const SRConstructor = getSpeechRecognitionConstructor();
      if (!SRConstructor) {
        setError("Speech recognition is not supported in this browser");
        return;
      }

      // Stop any existing recognition session before starting a new one
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped — safe to ignore
        }
        recognitionRef.current = null;
      }

      clearTranscript();

      const recognition = new SRConstructor();
      recognition.lang = toBcp47(language);
      recognition.continuous = mode === "continuous";
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            final += transcript;
            // Use the confidence of the last final result
            setConfidence(result[0].confidence);
          } else {
            interim += transcript;
          }
        }

        if (final) {
          setTranscript(final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // "aborted" and "no-speech" are not real errors — they happen during
        // normal usage (e.g. the user stops talking or the session is cancelled).
        const ignorable = ["aborted", "no-speech"];
        if (ignorable.includes(event.error)) {
          setIsListening(false);
          return;
        }

        let message: string;
        switch (event.error) {
          case "not-allowed":
            message = "Microphone permission denied";
            break;
          case "network":
            message = "Network error during speech recognition";
            break;
          case "audio-capture":
            message = "No microphone detected";
            break;
          case "language-not-supported":
            message = "The selected language is not supported for speech recognition";
            break;
          default:
            message = `Speech recognition error: ${event.error}`;
        }

        setError(message);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);

        // In continuous mode, restart automatically unless the user explicitly stopped
        if (
          mode === "continuous" &&
          recognitionRef.current === recognition
        ) {
          try {
            recognition.start();
          } catch {
            // May fail if the page has been hidden or the context is invalid
            recognitionRef.current = null;
          }
        } else {
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (err) {
        setError("Failed to start speech recognition");
        recognitionRef.current = null;
      }
    },
    [
      mode,
      setIsListening,
      setTranscript,
      setInterimTranscript,
      setConfidence,
      setError,
      clearTranscript,
    ]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Detach the continuous-restart handler so onend does not restart
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      try {
        ref.stop();
      } catch {
        // Already stopped
      }
    }
    setIsListening(false);
  }, [setIsListening]);

  // ── Speech Synthesis (TTS) ────────────────────────────────────────────

  const speak = useCallback(
    (text: string, language: string = "en") => {
      if (!isSynthesisSupported) {
        setError("Speech synthesis is not supported in this browser");
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = toBcp47(language);

      // Try to pick the best matching voice for this language
      const voices = window.speechSynthesis.getVoices();
      const bcp47 = toBcp47(language);

      // Prefer an exact match, then a prefix match
      const exactMatch = voices.find((v) => v.lang === bcp47);
      const prefixMatch = voices.find((v) =>
        v.lang.startsWith(language)
      );
      const selectedVoice = exactMatch ?? prefixMatch;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        synthUtteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        // "interrupted" and "cancelled" are expected when we call cancel()
        if (event.error === "interrupted" || event.error === "canceled") {
          setIsSpeaking(false);
          return;
        }
        setError(`Speech synthesis error: ${event.error}`);
        setIsSpeaking(false);
        synthUtteranceRef.current = null;
      };

      synthUtteranceRef.current = utterance;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [isSynthesisSupported, setIsSpeaking, setError]
  );

  const stopSpeaking = useCallback(() => {
    if (isSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    synthUtteranceRef.current = null;
  }, [isSynthesisSupported, setIsSpeaking]);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Stop recognition
      if (recognitionRef.current) {
        try {
          const ref = recognitionRef.current;
          recognitionRef.current = null;
          ref.abort();
        } catch {
          // Ignore cleanup errors
        }
      }

      // Stop synthesis
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
    isRecognitionSupported,
    isSynthesisSupported,
    isListening,
    isSpeaking,
  };
}
