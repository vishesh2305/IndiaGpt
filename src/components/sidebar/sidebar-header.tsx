"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IndiaLogo } from "@/components/shared/india-logo";

interface SidebarHeaderProps {
  onNewChat?: () => void;
}

export function SidebarHeader({ onNewChat }: SidebarHeaderProps) {
  const router = useRouter();

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <IndiaLogo size="md" />
      <Button
        onClick={handleNewChat}
        className="w-full gap-2 bg-saffron text-white hover:bg-saffron-600"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </Button>
    </div>
  );
}
