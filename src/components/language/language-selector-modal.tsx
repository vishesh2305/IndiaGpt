"use client";

import { useState } from "react";
import { useLanguageStore } from "@/store/language-store";
import { LANGUAGES } from "@/config/languages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorModalProps {
  onSelect?: () => void;
}

export function LanguageSelectorModal({ onSelect }: LanguageSelectorModalProps) {
  const { selectedLanguage, setLanguage } = useLanguageStore();
  const [search, setSearch] = useState("");

  const filteredLanguages = LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(search.toLowerCase()) ||
      lang.nativeName.includes(search) ||
      lang.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code: string) => {
    setLanguage(code);
    onSelect?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-2xl font-bold text-foreground">
          Choose your language
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a language for IndiaGPT to respond in
        </p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search languages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border text-left transition-all hover:border-saffron hover:bg-saffron-50",
                selectedLanguage === lang.code
                  ? "border-saffron bg-saffron-50 ring-2 ring-saffron/20"
                  : "border-border"
              )}
            >
              <div>
                <div className="font-semibold text-foreground">
                  {lang.nativeName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang.name} &middot; {lang.script}
                </div>
              </div>
              {selectedLanguage === lang.code && (
                <Check className="h-5 w-5 text-saffron shrink-0" />
              )}
            </button>
          ))}
        </div>

        {filteredLanguages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No languages found matching &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
