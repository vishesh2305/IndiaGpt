import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import groq from "@/lib/groq";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import {
  GROQ_MODEL,
  GROQ_MODEL_FAST,
  GROQ_MODEL_VISION,
  MAX_MESSAGES_PER_REQUEST,
  MAX_HISTORY_MESSAGE_CHARS,
  MAX_RESPONSE_TOKENS,
  MAX_RESPONSE_TOKENS_FAST,
} from "@/lib/constants";
import { buildSystemPrompt, buildCompactSystemPrompt, isSimpleQuery } from "@/lib/prompts";
import { getLanguageName } from "@/config/languages";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type ContentPart = TextPart | ImagePart;

type GroqMessage =
  | { role: "system"; content: string }
  | { role: "user" | "assistant"; content: string }
  | { role: "user"; content: ContentPart[] };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
      imageDataUrls = [],
      textContents = [],
    } = body;

    if (!chatId || !message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "chatId and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasImages = Array.isArray(imageDataUrls) && imageDataUrls.length > 0;
    const hasTextFiles = Array.isArray(textContents) && textContents.length > 0;

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

    // ── 5. Fetch conversation history ────────────────────────────────────
    const historyMessages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(MAX_MESSAGES_PER_REQUEST)
      .lean();

    historyMessages.reverse();
    const hasHistory = historyMessages.length > 0;

    // ── 6. Build system prompt ───────────────────────────────────────────
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

    // ── 7. Select model ──────────────────────────────────────────────────
    let selectedModel: string = GROQ_MODEL;
    let maxTokens = MAX_RESPONSE_TOKENS;

    if (hasImages) {
      selectedModel = GROQ_MODEL_VISION;
    } else if (isSimpleQuery(message) && hasHistory) {
      selectedModel = GROQ_MODEL_FAST;
      maxTokens = MAX_RESPONSE_TOKENS_FAST;
    }

    // ── 8. Save user message to MongoDB ──────────────────────────────────
    await Message.create({
      chatId,
      role: "user",
      content: message,
      attachments: Array.isArray(attachments)
        ? attachments.map((a: { name: string; type: string; size?: number }) => ({
            url: "",
            type: a.type,
            name: a.name,
            size: a.size,
          }))
        : [],
      metadata: {
        language,
        location: location
          ? { city: location.city || "", state: location.state || "" }
          : undefined,
      },
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessagePreview: message.slice(0, 300),
      $inc: { messageCount: 1 },
    });

    // ── 9. Build messages array for Groq ─────────────────────────────────
    const groqMessages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      ...historyMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: truncateContent(msg.content),
      })),
    ];

    // Build the current user message — multimodal if images are attached
    if (hasImages) {
      const contentParts: ContentPart[] = [];

      // Add text file contents as context
      if (hasTextFiles) {
        const fileContext = textContents
          .map((f: { name: string; content: string }) =>
            `--- Contents of ${f.name} ---\n${f.content}\n--- End of ${f.name} ---`
          )
          .join("\n\n");
        contentParts.push({ type: "text", text: fileContext });
      }

      contentParts.push({ type: "text", text: message });

      for (const dataUrl of imageDataUrls) {
        contentParts.push({
          type: "image_url",
          image_url: { url: dataUrl },
        });
      }

      groqMessages.push({ role: "user", content: contentParts });
    } else {
      // Text-only — append file contents as context if present
      let fullMessage = message;

      if (hasTextFiles) {
        const fileContext = textContents
          .map((f: { name: string; content: string }) =>
            `--- Contents of ${f.name} ---\n${f.content}\n--- End of ${f.name} ---`
          )
          .join("\n\n");
        fullMessage = `${fileContext}\n\n${message}`;
      }

      groqMessages.push({ role: "user" as const, content: fullMessage });
    }

    // ── 10. Call Groq streaming API ──────────────────────────────────────
    const startTime = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages: groqMessages as any,
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

            if (chunk.x_groq?.usage) {
              inputTokens = chunk.x_groq.usage.prompt_tokens || 0;
              outputTokens = chunk.x_groq.usage.completion_tokens || 0;
            }
          }

          safeEnqueue(encoder.encode("data: [DONE]\n\n"));
          safeClose();

          const latencyMs = Date.now() - startTime;

          await Message.create({
            chatId,
            role: "assistant",
            content: fullContent,
            metadata: {
              language,
              model: selectedModel,
              tokens: { input: inputTokens, output: outputTokens },
              latencyMs,
            },
          });

          await Chat.findByIdAndUpdate(chatId, {
            lastMessagePreview: fullContent.slice(0, 300),
            $inc: { messageCount: 1 },
          });
        } catch (error) {
          console.error("[AI Stream] Error during streaming:", error);

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
              console.error("[AI Stream] Failed to save partial response:", saveError);
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
