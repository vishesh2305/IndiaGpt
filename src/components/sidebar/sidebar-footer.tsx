"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SidebarFooter() {
  const { data: session } = useSession();
  const router = useRouter();

  const user = session?.user;

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="mt-auto">
      <Separator />
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-9 w-9">
          {user.image && (
            <AvatarImage src={user.image} alt={user.name || "User"} />
          )}
          <AvatarFallback className="text-xs">
            {getInitials(user.name || user.email || "U")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium leading-tight">
            {user.name || "User"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/settings")}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
