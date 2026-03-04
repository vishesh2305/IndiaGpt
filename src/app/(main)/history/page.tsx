"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MessageSquare,
  Trash2,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Chat } from "@/types/chat";
import { toast } from "sonner";

export default function HistoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: chats, isLoading } = useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await fetch("/api/chat");
      if (!res.ok) throw new Error("Failed to fetch chats");
      const data = await res.json();
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chat");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat deleted");
    },
    onError: () => {
      toast.error("Failed to delete chat");
    },
  });

  const filteredChats = chats?.filter(
    (chat) =>
      chat.title.toLowerCase().includes(search.toLowerCase()) ||
      chat.lastMessagePreview.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chat History</h1>
            <p className="text-sm text-muted-foreground">
              {chats?.length || 0} conversations
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats && filteredChats.length > 0 ? (
          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <div
                key={chat._id}
                className="group flex items-start gap-3 p-4 rounded-xl border hover:border-saffron/50 hover:bg-saffron-50/50 transition-all cursor-pointer"
                onClick={() => router.push(`/chat/${chat._id}`)}
              >
                <div className="h-10 w-10 rounded-xl bg-saffron-50 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-saffron" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium truncate">{chat.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(chat.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {chat.lastMessagePreview || "No messages yet"}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {chat.messageCount} messages
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(chat._id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {search ? "No results found" : "No conversations yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? `No conversations match "${search}"`
                : "Start a new chat to see your history here"}
            </p>
            {!search && (
              <Button
                className="mt-4"
                onClick={() => router.push("/")}
              >
                Start a new chat
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
