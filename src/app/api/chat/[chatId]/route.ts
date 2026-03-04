import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Chat from "@/models/Chat";
import Message from "@/models/Message";

type RouteContext = { params: Promise<{ chatId: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chat/[chatId] — Get a single chat by ID (verify ownership)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await context.params;

    await connectDB();

    const chat = await Chat.findOne({
      _id: chatId,
      userId: session.user.id,
    }).lean();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({
      chat: {
        ...chat,
        _id: chat._id.toString(),
        userId: chat.userId.toString(),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/chat/[chatId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/chat/[chatId] — Update chat (title, language)
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await context.params;

    await connectDB();

    // Verify ownership
    const chat = await Chat.findOne({
      _id: chatId,
      userId: session.user.id,
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim().slice(0, 200);
    }
    if (typeof body.language === "string" && body.language.trim()) {
      updates.language = body.language.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedChat = await Chat.findByIdAndUpdate(chatId, updates, {
      new: true,
      runValidators: true,
    }).lean();

    return NextResponse.json({
      chat: {
        ...updatedChat,
        _id: updatedChat!._id.toString(),
        userId: updatedChat!.userId.toString(),
      },
    });
  } catch (error) {
    console.error("[API] PATCH /api/chat/[chatId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/chat/[chatId] — Delete a chat and all its messages
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await context.params;

    await connectDB();

    // Verify ownership before deleting
    const chat = await Chat.findOne({
      _id: chatId,
      userId: session.user.id,
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Delete all messages belonging to this chat, then the chat itself
    await Promise.all([
      Message.deleteMany({ chatId }),
      Chat.findByIdAndDelete(chatId),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/chat/[chatId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
