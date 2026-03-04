"use client";

import { useLanguageStore } from "@/store/language-store";
import { LANGUAGES } from "@/config/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({ compact = false, className }: LanguageSelectorProps) {
  const { selectedLanguage, setLanguage } = useLanguageStore();

  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage);

  return (
    <Select value={selectedLanguage} onValueChange={setLanguage}>
      <SelectTrigger
        className={cn(
          "border-none shadow-none focus:ring-0 focus:ring-offset-0",
          compact ? "w-auto gap-1 px-2" : "w-[200px]",
          className
        )}
      >
        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue>
          {compact
            ? currentLang?.code.toUpperCase()
            : currentLang?.nativeName || "English"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">
                {lang.name}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
