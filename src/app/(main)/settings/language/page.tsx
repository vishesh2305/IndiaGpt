"use client";

import { useRouter } from "next/navigation";
import { LanguageSelectorModal } from "@/components/language/language-selector-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LanguageSettingsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold">Language Settings</h1>
      </div>
      <LanguageSelectorModal
        onSelect={() => router.push("/settings")}
      />
    </div>
  );
}
