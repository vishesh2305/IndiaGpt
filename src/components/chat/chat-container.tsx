"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { useChatStore } from "@/store/chat-store";
import { useLanguageStore } from "@/store/language-store";
import { useLocationStore } from "@/store/location-store";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";

interface ChatContainerProps {
  chatId?: string | null;
  className?: string;
}

export function ChatContainer({ chatId = null, className }: ChatContainerProps) {
  const router = useRouter();

  const messages = useChatStore((s) => s.messages);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const appendStreamChunk = useChatStore((s) => s.appendStreamChunk);
  const finalizeStream = useChatStore((s) => s.finalizeStream);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const city = useLocationStore((s) => s.city);
  const state = useLocationStore((s) => s.state);

  const chatTitleRef = useRef("New Chat");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set active chat on mount / chatId change
  useEffect(() => {
    if (chatId !== activeChatId) {
      setActiveChat(chatId);
    }
  }, [chatId, activeChatId, setActiveChat]);

  // Fetch existing messages when a chatId is provided
  useEffect(() => {
    if (!chatId) return;

    let cancelled = false;

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat/${chatId}/messages?limit=50`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("[ChatContainer] Failed to fetch messages:", error);
      }
    }

    async function fetchChatInfo() {
      try {
        const res = await fetch(`/api/chat/${chatId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.chat?.title) {
          chatTitleRef.current = data.chat.title;
        }
      } catch (error) {
        console.error("[ChatContainer] Failed to fetch chat info:", error);
      }
    }

    fetchMessages();
    fetchChatInfo();

    return () => {
      cancelled = true;
    };
  }, [chatId, setMessages]);

  // Handle sending a message
  const handleSend = useCallback(
    async (text: string, files: File[]) => {
      if (!text.trim() && files.length === 0) return;

      let currentChatId = chatId || activeChatId;

      // If there is no existing chat, create one first
      if (!currentChatId) {
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: text.slice(0, 100),
              language: selectedLanguage,
            }),
          });

          if (!res.ok) {
            console.error("[ChatContainer] Failed to create chat");
            return;
          }

          const data = await res.json();
          currentChatId = data.chat._id;
          chatTitleRef.current = data.chat.title;

          // Navigate to the new chat URL
          router.push(`/chat/${currentChatId}`);
        } catch (error) {
          console.error("[ChatContainer] Error creating chat:", error);
          return;
        }
      }

      // Create the user message object locally
      const userMessage: Message = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        chatId: currentChatId!,
        role: "user",
        content: text,
        attachments: [],
        createdAt: new Date().toISOString(),
      };

      addMessage(userMessage);

      // Start streaming
      setIsStreaming(true);

      try {
        // Abort any existing stream
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const res = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: currentChatId,
            message: text,
            language: selectedLanguage,
            location: city && state ? { city, state } : undefined,
            attachments: [],
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("[ChatContainer] Stream error:", errorData);
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);

            if (data === "[DONE]") {
              // Stream complete
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                appendStreamChunk(content);
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        // Finalize the stream
        finalizeStream(fullContent);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was aborted intentionally
          return;
        }
        console.error("[ChatContainer] Streaming error:", error);
        setIsStreaming(false);
      }
    },
    [
      chatId,
      activeChatId,
      selectedLanguage,
      city,
      state,
      router,
      addMessage,
      setIsStreaming,
      appendStreamChunk,
      finalizeStream,
    ]
  );

  // Handle title change
  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      if (!chatId) return;
      chatTitleRef.current = newTitle;

      try {
        await fetch(`/api/chat/${chatId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
      } catch (error) {
        console.error("[ChatContainer] Failed to update title:", error);
      }
    },
    [chatId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const showEmptyState = messages.length === 0 && !isStreaming;

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      <ChatHeader
        title={chatTitleRef.current}
        chatId={chatId}
        onTitleChange={handleTitleChange}
      />

      {showEmptyState ? (
        <ChatEmptyState />
      ) : (
        <MessageList className="flex-1" />
      )}

      <ChatInput onSend={handleSend} />
    </div>
  );
}
