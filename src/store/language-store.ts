import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LanguageStore {
  selectedLanguage: string;
  setLanguage: (code: string) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      selectedLanguage: "en",

      setLanguage: (code) => set({ selectedLanguage: code }),
    }),
    {
      name: "india-gpt-language",
    }
  )
);
