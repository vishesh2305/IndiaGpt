import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import groq from "@/lib/groq";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import {
  GROQ_MODEL,
  GROQ_MODEL_FAST,
  MAX_MESSAGES_PER_REQUEST,
  MAX_HISTORY_MESSAGE_CHARS,
  MAX_RESPONSE_TOKENS,
  MAX_RESPONSE_TOKENS_FAST,
} from "@/lib/constants";
import { buildSystemPrompt, buildCompactSystemPrompt, isSimpleQuery } from "@/lib/prompts";
import { getLanguageName } from "@/config/languages";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Truncate a message to `MAX_HISTORY_MESSAGE_CHARS` characters.
 * If truncated, appends an ellipsis so the model knows content was cut.
 */
function truncateContent(content: string): string {
  if (content.length <= MAX_HISTORY_MESSAGE_CHARS) return content;
  return content.slice(0, MAX_HISTORY_MESSAGE_CHARS) + "…";
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/stream — Core streaming AI endpoint
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate ──────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 2. Parse body ────────────────────────────────────────────────────
    const body = await req.json();
    const {
      chatId,
      message,
      language = "en",
      location,
      attachments = [],
    } = body;

    if (!chatId || !message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "chatId and message are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ── 3. Connect to database ───────────────────────────────────────────
    await connectDB();

    // ── 4. Verify chat ownership ─────────────────────────────────────────
    const chat = await Chat.findOne({
      _id: chatId,
      userId: session.user.id,
    });

    if (!chat) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 5. Fetch conversation history (last N messages) ──────────────────
    const historyMessages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(MAX_MESSAGES_PER_REQUEST)
      .lean();

    // Reverse to get chronological order
    historyMessages.reverse();

    const hasHistory = historyMessages.length > 0;

    // ── 6. Build system prompt ───────────────────────────────────────────
    // On the first message we send the full Indian context (~2 000 tokens).
    // For follow-ups the context is already established in history, so we
    // use the compact prompt (~300 tokens) — saving ~1 700 tokens/request.
    const languageName = getLanguageName(language);
    const promptParams = {
      language,
      languageName,
      city: location?.city,
      state: location?.state,
      mode: "chat" as const,
      hasAttachments: attachments.length > 0,
    };

    const systemPrompt = hasHistory
      ? buildCompactSystemPrompt(promptParams)
      : buildSystemPrompt(promptParams);

    // ── 7. Select model based on query complexity ────────────────────────
    // Simple queries (greetings, yes/no, acknowledgements) use the fast 8B
    // model which is ~80% cheaper and faster. Everything else uses 70B.
    const useSimple = isSimpleQuery(message) && hasHistory;
    const selectedModel = useSimple ? GROQ_MODEL_FAST : GROQ_MODEL;
    const maxTokens = useSimple ? MAX_RESPONSE_TOKENS_FAST : MAX_RESPONSE_TOKENS;

    // ── 8. Save the user message to MongoDB ──────────────────────────────
    await Message.create({
      chatId,
      role: "user",
      content: message,
      attachments: attachments || [],
      metadata: {
        language,
        location: location
          ? { city: location.city || "", state: location.state || "" }
          : undefined,
      },
    });

    // Update chat metadata
    await Chat.findByIdAndUpdate(chatId, {
      lastMessagePreview: message.slice(0, 300),
      $inc: { messageCount: 1 },
    });

    // ── 9. Build the messages array for Groq ─────────────────────────────
    // History messages are truncated to MAX_HISTORY_MESSAGE_CHARS to keep
    // context usage predictable and avoid blowing the context window on
    // conversations with very long messages.
    const groqMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: systemPrompt },
      ...historyMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: truncateContent(msg.content),
      })),
      { role: "user" as const, content: message },
    ];

    // ── 10. Call Groq streaming API ──────────────────────────────────────
    const startTime = Date.now();

    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages: groqMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    // ── 11. Stream the response as SSE ───────────────────────────────────
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        let inputTokens = 0;
        let outputTokens = 0;
        let closed = false;

        const safeEnqueue = (data: Uint8Array) => {
          if (!closed) controller.enqueue(data);
        };
        const safeClose = () => {
          if (!closed) {
            closed = true;
            controller.close();
          }
        };

        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";

            if (content) {
              fullContent += content;
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            }

            // Capture usage info from the last chunk if available
            if (chunk.x_groq?.usage) {
              inputTokens = chunk.x_groq.usage.prompt_tokens || 0;
              outputTokens = chunk.x_groq.usage.completion_tokens || 0;
            }
          }

          // ── 12. Send done signal first, then save to DB ────────────
          safeEnqueue(encoder.encode("data: [DONE]\n\n"));
          safeClose();

          // Save assistant message to MongoDB (after stream is closed)
          const latencyMs = Date.now() - startTime;

          await Message.create({
            chatId,
            role: "assistant",
            content: fullContent,
            metadata: {
              language,
              model: selectedModel,
              tokens: {
                input: inputTokens,
                output: outputTokens,
              },
              latencyMs,
            },
          });

          await Chat.findByIdAndUpdate(chatId, {
            lastMessagePreview: fullContent.slice(0, 300),
            $inc: { messageCount: 1 },
          });
        } catch (error) {
          console.error("[AI Stream] Error during streaming:", error);

          // Try to save whatever content we got so far
          if (fullContent.length > 0) {
            try {
              await Message.create({
                chatId,
                role: "assistant",
                content: fullContent,
                metadata: {
                  language,
                  model: selectedModel,
                  latencyMs: Date.now() - startTime,
                },
              });
              await Chat.findByIdAndUpdate(chatId, {
                lastMessagePreview: fullContent.slice(0, 300),
                $inc: { messageCount: 1 },
              });
            } catch (saveError) {
              console.error(
                "[AI Stream] Failed to save partial response:",
                saveError
              );
            }
          }

          safeEnqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`
            )
          );
          safeEnqueue(encoder.encode("data: [DONE]\n\n"));
          safeClose();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[API] POST /api/ai/stream error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
