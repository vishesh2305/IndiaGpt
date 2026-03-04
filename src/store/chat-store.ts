import { create } from "zustand";
import type { Message, Attachment } from "@/types/chat";

interface ChatStore {
  // Active conversation
  activeChatId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;

  // Input state
  inputText: string;
  attachedFiles: File[];

  // Actions
  setActiveChat: (chatId: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: (fullContent: string, metadata?: Message["metadata"]) => void;
  setIsStreaming: (streaming: boolean) => void;
  setInputText: (text: string) => void;
  addAttachedFile: (file: File) => void;
  removeAttachedFile: (index: number) => void;
  clearAttachedFiles: () => void;
  clearInput: () => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────
  activeChatId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",

  inputText: "",
  attachedFiles: [],

  // ── Actions ────────────────────────────────────────────────────────────

  setActiveChat: (chatId) =>
    set({
      activeChatId: chatId,
      // Reset transient state when switching chats
      messages: [],
      isStreaming: false,
      streamingContent: "",
      inputText: "",
      attachedFiles: [],
    }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== messageId),
    })),

  appendStreamChunk: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),

  finalizeStream: (fullContent, metadata) => {
    const { activeChatId } = get();

    const assistantMessage: Message = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      chatId: activeChatId ?? "",
      role: "assistant",
      content: fullContent,
      metadata,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, assistantMessage],
      streamingContent: "",
      isStreaming: false,
    }));
  },

  setIsStreaming: (streaming) =>
    set({
      isStreaming: streaming,
      // Clear streaming buffer when starting a new stream
      ...(streaming ? { streamingContent: "" } : {}),
    }),

  setInputText: (text) => set({ inputText: text }),

  addAttachedFile: (file) =>
    set((state) => ({
      attachedFiles: [...state.attachedFiles, file],
    })),

  removeAttachedFile: (index) =>
    set((state) => ({
      attachedFiles: state.attachedFiles.filter((_, i) => i !== index),
    })),

  clearAttachedFiles: () => set({ attachedFiles: [] }),

  clearInput: () => set({ inputText: "", attachedFiles: [] }),

  clearChat: () =>
    set({
      activeChatId: null,
      messages: [],
      isStreaming: false,
      streamingContent: "",
      inputText: "",
      attachedFiles: [],
    }),
}));
