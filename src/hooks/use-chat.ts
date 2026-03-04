"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  Chat,
  Message,
  ChatCreateRequest,
  ChatMessageRequest,
} from "@/types/chat";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

// ── API helpers ────────────────────────────────────────────────────────────

async function fetchChats(): Promise<Chat[]> {
  const res = await fetch("/api/chat");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch chats");
  }
  const json: ApiResponse<Chat[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch chats");
  return json.data ?? [];
}

async function fetchMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`/api/chat/${chatId}/messages`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch messages");
  }
  const json: ApiResponse<Message[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch messages");
  return json.data ?? [];
}

async function createChat(data: ChatCreateRequest): Promise<Chat> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create chat");
  }
  const json: ApiResponse<Chat> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to create chat");
  return json.data!;
}

async function deleteChat(chatId: string): Promise<void> {
  const res = await fetch(`/api/chat/${chatId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete chat");
  }
}

async function sendMessage(
  chatId: string,
  data: ChatMessageRequest
): Promise<Message> {
  const res = await fetch(`/api/chat/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to send message");
  }
  const json: ApiResponse<Message> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to send message");
  return json.data!;
}

// ── Query keys ─────────────────────────────────────────────────────────────

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  list: () => [...chatKeys.lists()] as const,
  details: () => [...chatKeys.all, "detail"] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (chatId: string) =>
    [...chatKeys.detail(chatId), "messages"] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Fetch the list of all chats for the authenticated user.
 */
export function useChats() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: fetchChats,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch all messages for a specific chat.
 * Automatically disabled when chatId is empty/null.
 */
export function useChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(chatId ?? ""),
    queryFn: () => fetchMessages(chatId!),
    enabled: !!chatId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Mutation to create a new chat.
 * Invalidates the chat list on success.
 */
export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

/**
 * Mutation to delete a chat by ID.
 * Removes the chat from the cache optimistically and invalidates the list.
 */
export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChat,
    onMutate: async (chatId: string) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: chatKeys.lists() });

      // Snapshot the previous value
      const previousChats = queryClient.getQueryData<Chat[]>(chatKeys.list());

      // Optimistically remove the chat from the list
      if (previousChats) {
        queryClient.setQueryData<Chat[]>(
          chatKeys.list(),
          previousChats.filter((chat) => chat._id !== chatId)
        );
      }

      return { previousChats };
    },
    onError: (_err, _chatId, context) => {
      // Roll back to the previous value if the mutation fails
      if (context?.previousChats) {
        queryClient.setQueryData(chatKeys.list(), context.previousChats);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

/**
 * Mutation to send a message within a chat.
 * Invalidates the chat messages and the chat list (for updated preview) on success.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      data,
    }: {
      chatId: string;
      data: ChatMessageRequest;
    }) => sendMessage(chatId, data),
    onSuccess: (_data, variables) => {
      // Refresh messages for this chat
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.chatId),
      });
      // Refresh the chat list to update lastMessagePreview / updatedAt
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}
