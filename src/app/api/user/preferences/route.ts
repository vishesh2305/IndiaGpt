import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id).select(
      "language preferences location"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        language: user.language,
        voiceMode: user.preferences?.voiceMode || "push-to-talk",
        autoTTS: user.preferences?.autoTTS || false,
        locationEnabled: user.preferences?.locationEnabled ?? true,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("[Preferences GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { language, voiceMode, autoTTS, locationEnabled } = body;

    await connectDB();

    const updateData: Record<string, unknown> = {};
    if (language !== undefined) updateData.language = language;
    if (voiceMode !== undefined) updateData["preferences.voiceMode"] = voiceMode;
    if (autoTTS !== undefined) updateData["preferences.autoTTS"] = autoTTS;
    if (locationEnabled !== undefined)
      updateData["preferences.locationEnabled"] = locationEnabled;

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("language preferences location");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        language: user.language,
        voiceMode: user.preferences?.voiceMode,
        autoTTS: user.preferences?.autoTTS,
        locationEnabled: user.preferences?.locationEnabled,
      },
    });
  } catch (error) {
    console.error("[Preferences PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
