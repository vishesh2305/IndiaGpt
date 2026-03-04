import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Chat from "@/models/Chat";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chat — List all chats for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "30", 10))
    );
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      Chat.find({ userId: session.user.id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Chat.countDocuments({ userId: session.user.id }),
    ]);

    return NextResponse.json({
      chats: chats.map((chat) => ({
        ...chat,
        _id: chat._id.toString(),
        userId: chat.userId.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat — Create a new chat
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 200)
        : "New Chat";
    const language =
      typeof body.language === "string" && body.language.trim()
        ? body.language.trim()
        : "en";

    const chat = await Chat.create({
      userId: session.user.id,
      title,
      language,
      messageCount: 0,
      lastMessagePreview: "",
    });

    return NextResponse.json(
      {
        chat: {
          _id: chat._id.toString(),
          userId: chat.userId.toString(),
          title: chat.title,
          language: chat.language,
          messageCount: chat.messageCount,
          lastMessagePreview: chat.lastMessagePreview,
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
