"use client";

import { useRef, useCallback } from "react";
import { useChatStore } from "@/store/chat-store";

interface StreamMessageParams {
  chatId: string;
  message: string;
  language: string;
  location?: { city: string; state: string };
  attachments?: Array<{
    url: string;
    type: "image" | "pdf" | "document";
    name: string;
    size?: number;
  }>;
}

interface StreamResult {
  content: string;
  aborted: boolean;
}

/**
 * Hook that sends a message to the AI streaming endpoint and processes
 * Server-Sent Events (SSE) chunks in real time.
 *
 * Features:
 * - AbortController support for cancellation
 * - Automatic cleanup on unmount
 * - Proper SSE parsing with multi-line buffer handling
 * - Error recovery with store state cleanup
 */
export function useChatStream() {
  const {
    setIsStreaming,
    appendStreamChunk,
    finalizeStream,
    addMessage,
  } = useChatStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Send a message and stream the AI response.
   * Returns the full content string when the stream completes.
   */
  const streamMessage = useCallback(
    async (params: StreamMessageParams): Promise<StreamResult> => {
      // Abort any in-flight stream before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Add the user message to the store immediately for optimistic UI
      addMessage({
        _id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        chatId: params.chatId,
        role: "user",
        content: params.message,
        attachments: params.attachments,
        metadata: {
          language: params.language,
          location: params.location,
        },
        createdAt: new Date().toISOString(),
      });

      setIsStreaming(true);

      let fullContent = "";

      try {
        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: params.chatId,
            message: params.message,
            language: params.language,
            location: params.location,
            attachments: params.attachments,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.error ?? `Stream request failed with status ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error("Response body is null — streaming not supported");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Append decoded text to the buffer for multi-chunk SSE lines
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines in the buffer
            const lines = buffer.split("\n");
            // Keep the last (potentially incomplete) line in the buffer
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();

              // Skip empty lines and SSE comments
              if (!trimmed || trimmed.startsWith(":")) continue;

              if (trimmed.startsWith("data: ")) {
                const data = trimmed.slice(6);

                // Stream completion signal
                if (data === "[DONE]") {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  // Handle standard OpenAI/Groq streaming format
                  const content =
                    parsed.choices?.[0]?.delta?.content ?? "";

                  if (content) {
                    fullContent += content;
                    appendStreamChunk(content);
                  }

                  // Handle error events from the server
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch (parseError) {
                  // Only throw if this is a real error, not a JSON parse issue
                  if (
                    parseError instanceof Error &&
                    parseError.message !== "Unexpected end of JSON input" &&
                    !data.startsWith("{")
                  ) {
                    // Non-JSON data line — skip silently
                    continue;
                  }
                  if (
                    parseError instanceof Error &&
                    parseError.message !== "Unexpected end of JSON input"
                  ) {
                    throw parseError;
                  }
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Process any remaining data in the buffer
        if (buffer.trim().startsWith("data: ")) {
          const data = buffer.trim().slice(6);
          if (data !== "[DONE]") {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content ?? "";
              if (content) {
                fullContent += content;
                appendStreamChunk(content);
              }
            } catch {
              // Ignore incomplete final chunk
            }
          }
        }

        // Finalize: move streaming content into a proper assistant message
        finalizeStream(fullContent);
        setIsStreaming(false);

        return { content: fullContent, aborted: false };
      } catch (error) {
        // Handle abort gracefully — not an error
        if (error instanceof DOMException && error.name === "AbortError") {
          setIsStreaming(false);
          return { content: fullContent, aborted: true };
        }

        // Clean up streaming state on error
        setIsStreaming(false);

        // If we received partial content, finalize it so it is not lost
        if (fullContent) {
          finalizeStream(fullContent);
        }

        throw error;
      } finally {
        // Clear the ref if this controller is still the active one
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [setIsStreaming, appendStreamChunk, finalizeStream, addMessage]
  );

  /**
   * Abort the currently active stream, if any.
   */
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { streamMessage, abortStream };
}
