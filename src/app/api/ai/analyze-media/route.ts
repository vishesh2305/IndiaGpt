import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFileType, type FileCategory } from "@/lib/upload";

/**
 * POST /api/ai/analyze-media
 *
 * Analyses an uploaded media file and returns a description or
 * acknowledgement. Currently implemented as a placeholder that will
 * be enhanced once a vision-capable model is integrated.
 *
 * Request body:
 *   {
 *     url: string;       // Public URL of the uploaded file
 *     mimeType: string;  // MIME type of the file
 *     name: string;      // Original file name
 *   }
 *
 * Returns:
 *   {
 *     analysis: string;  // Description or acknowledgement
 *     type: FileCategory; // Classified file type
 *   }
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

    // ── Parse request body ──────────────────────────────────────────────
    let body: { url?: string; mimeType?: string; name?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { url, mimeType, name } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' field." },
        { status: 400 }
      );
    }

    if (!mimeType || typeof mimeType !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'mimeType' field." },
        { status: 400 }
      );
    }

    const fileName = name || "unknown file";
    const fileType = getFileType(mimeType);

    // ── Analyse based on file type ──────────────────────────────────────

    let analysis: string;

    switch (fileType) {
      case "image": {
        // In production, this would send the image to a vision model
        // (e.g. Groq with llama-3.2-90b-vision-preview, or GPT-4V)
        // For now, construct a descriptive acknowledgement.
        analysis = buildImageAnalysis(fileName, mimeType, url);
        break;
      }

      case "pdf": {
        analysis = buildPdfAnalysis(fileName);
        break;
      }

      case "document":
      default: {
        analysis = buildDocumentAnalysis(fileName, mimeType);
        break;
      }
    }

    return NextResponse.json({
      analysis,
      type: fileType,
    });
  } catch (error) {
    console.error("[Analyze Media] Unexpected error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during analysis." },
      { status: 500 }
    );
  }
}

// ── Analysis builders ─────────────────────────────────────────────────────

function buildImageAnalysis(
  name: string,
  mimeType: string,
  url: string
): string {
  const format = mimeType.split("/")[1]?.toUpperCase() ?? "unknown format";

  return [
    `Image received: **${name}** (${format})`,
    "",
    "I can see you've uploaded an image. Once vision capabilities are fully integrated, I'll be able to:",
    "- Describe the contents of the image in detail",
    "- Identify objects, people, text, and landmarks",
    "- Answer questions about what's shown in the image",
    "- Extract any visible text (OCR)",
    "",
    "For now, please describe what you'd like to know about this image, and I'll do my best to help based on context.",
  ].join("\n");
}

function buildPdfAnalysis(name: string): string {
  return [
    `PDF received: **${name}**`,
    "",
    "Your PDF has been uploaded successfully. Once document processing is fully integrated, I'll be able to:",
    "- Extract and summarise the text content",
    "- Answer questions about the document",
    "- Identify key information and data",
    "",
    "For now, please share any specific questions about this document, and I'll assist based on the context you provide.",
  ].join("\n");
}

function buildDocumentAnalysis(name: string, mimeType: string): string {
  return [
    `Document received: **${name}** (${mimeType})`,
    "",
    "Your file has been uploaded successfully. Please let me know what you'd like to do with this document, and I'll do my best to help.",
  ].join("\n");
}
