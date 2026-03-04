import { create } from "zustand";

type VoiceMode = "push-to-talk" | "continuous";

interface VoiceStore {
  isListening: boolean;
  mode: VoiceMode;
  transcript: string;
  interimTranscript: string;
  isSpeaking: boolean;
  confidence: number;
  error: string | null;

  setIsListening: (listening: boolean) => void;
  setMode: (mode: VoiceMode) => void;
  setTranscript: (text: string) => void;
  setInterimTranscript: (text: string) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setConfidence: (confidence: number) => void;
  setError: (error: string | null) => void;
  clearTranscript: () => void;
  reset: () => void;
}

const initialState = {
  isListening: false,
  mode: "push-to-talk" as VoiceMode,
  transcript: "",
  interimTranscript: "",
  isSpeaking: false,
  confidence: 0,
  error: null as string | null,
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  ...initialState,

  // ── Actions ────────────────────────────────────────────────────────────

  setIsListening: (listening) =>
    set({
      isListening: listening,
      // Clear any previous error when starting to listen
      ...(listening ? { error: null } : {}),
    }),

  setMode: (mode) => set({ mode }),

  setTranscript: (text) => set({ transcript: text }),

  setInterimTranscript: (text) => set({ interimTranscript: text }),

  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

  setConfidence: (confidence) =>
    set({ confidence: Math.min(1, Math.max(0, confidence)) }),

  setError: (error) =>
    set({
      error,
      isListening: false,
    }),

  clearTranscript: () =>
    set({
      transcript: "",
      interimTranscript: "",
      confidence: 0,
    }),

  reset: () => set(initialState),
}));
