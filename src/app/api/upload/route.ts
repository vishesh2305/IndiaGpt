import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import {
  validateFile as validateFileUtil,
  generateUploadPath,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "@/lib/upload";

/**
 * POST /api/upload
 *
 * Handles multipart file uploads. Authenticates the user, validates
 * the file type and size, then persists it to the local filesystem
 * under `public/uploads/{userId}/{timestamp}-{filename}`.
 *
 * In production this would be replaced by an S3 / Cloudinary upload,
 * but local storage works for development and prototyping.
 *
 * Returns:
 *   { url: string, type: string, name: string, size: number }
 */
export async function POST(request: Request) {
  try {
    // ── Authentication ──────────────────────────────────────────────────
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ── Parse multipart form data ───────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid form data. Expected multipart/form-data." },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Attach a file with the field name 'file'." },
        { status: 400 }
      );
    }

    // ── Server-side validation ──────────────────────────────────────────

    // Check MIME type
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${file.type}". Accepted: images (JPG, PNG, WebP, GIF), PDF, and text files.`,
        },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the ${MAX_FILE_SIZE_LABEL} limit.`,
        },
        { status: 400 }
      );
    }

    // Check for empty files
    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty." },
        { status: 400 }
      );
    }

    // ── Generate upload path ────────────────────────────────────────────
    const relativePath = generateUploadPath(userId, file.name);

    // Resolve to absolute path inside `public/`
    const publicDir = path.join(process.cwd(), "public");
    const absolutePath = path.join(publicDir, relativePath);
    const directoryPath = path.dirname(absolutePath);

    // Create the directory if it doesn't exist
    if (!existsSync(directoryPath)) {
      await mkdir(directoryPath, { recursive: true });
    }

    // ── Write the file ──────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    // The public URL is relative to the `public/` directory
    const fileUrl = `/${relativePath}`;

    // ── Response ────────────────────────────────────────────────────────
    return NextResponse.json({
      url: fileUrl,
      type: file.type,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("[Upload] Unexpected error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during upload." },
      { status: 500 }
    );
  }
}

/**
 * Reject non-POST methods with a 405 status.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to upload files." },
    { status: 405 }
  );
}
