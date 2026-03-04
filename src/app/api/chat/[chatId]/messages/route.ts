import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Chat from "@/models/Chat";
import Message from "@/models/Message";

type RouteContext = { params: Promise<{ chatId: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chat/[chatId]/messages — Get messages for a chat
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await context.params;
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
    );
    const skip = (page - 1) * limit;

    await connectDB();

    // Verify the chat belongs to the authenticated user
    const chat = await Chat.findOne({
      _id: chatId,
      userId: session.user.id,
    }).lean();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const [messages, total] = await Promise.all([
      Message.find({ chatId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ chatId }),
    ]);

    return NextResponse.json({
      messages: messages.map((msg) => ({
        _id: msg._id.toString(),
        chatId: msg.chatId.toString(),
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments || [],
        metadata: msg.metadata || {},
        createdAt: msg.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/chat/[chatId]/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat/[chatId]/messages — Add a new message to a chat
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await context.params;

    await connectDB();

    // Verify the chat belongs to the authenticated user
    const chat = await Chat.findOne({
      _id: chatId,
      userId: session.user.id,
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const validRoles = ["user", "assistant", "system"];
    const role = validRoles.includes(body.role) ? body.role : "user";

    // Create the message
    const message = await Message.create({
      chatId,
      role,
      content: body.content,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      metadata: body.metadata || {},
    });

    // Update the chat with the last message preview and increment count
    const preview = body.content.slice(0, 300);
    await Chat.findByIdAndUpdate(chatId, {
      lastMessagePreview: preview,
      $inc: { messageCount: 1 },
    });

    return NextResponse.json(
      {
        message: {
          _id: message._id.toString(),
          chatId: message.chatId.toString(),
          role: message.role,
          content: message.content,
          attachments: message.attachments,
          metadata: message.metadata,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/chat/[chatId]/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
