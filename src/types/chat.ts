export interface Message {
  _id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
  createdAt: string;
}

export interface Attachment {
  url: string;
  type: "image" | "pdf" | "document";
  name: string;
  size?: number;
  analysis?: string;
}

export interface MessageMetadata {
  language?: string;
  location?: { city: string; state: string };
  model?: string;
  tokens?: { input: number; output: number };
  latencyMs?: number;
}

export interface Chat {
  _id: string;
  userId: string;
  title: string;
  language: string;
  messageCount: number;
  lastMessagePreview: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatCreateRequest {
  title?: string;
  language?: string;
}

export interface ChatMessageRequest {
  content: string;
  attachments?: Attachment[];
  language?: string;
  location?: { lat: number; lng: number; city?: string; state?: string };
}
