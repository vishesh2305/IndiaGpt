/**
 * Client-side file processing utilities.
 *
 * Handles converting user-attached files into formats the AI
 * can consume: base64 data-URLs for images (compressed) and
 * plain text for text files.
 */

import {
  MAX_IMAGE_DIMENSION,
  IMAGE_UPLOAD_QUALITY,
  SUPPORTED_IMAGE_TYPES,
} from "@/lib/constants";
import type { Attachment } from "@/types/chat";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProcessedFiles {
  /** Base64 data-URLs of compressed images (for vision model) */
  imageDataUrls: string[];
  /** Text file contents extracted on the client */
  textContents: { name: string; content: string }[];
  /** Attachment metadata for display in the message bubble */
  attachments: Attachment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Image compression
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compress an image File to a JPEG data-URL, resizing if it exceeds
 * MAX_IMAGE_DIMENSION on either axis.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");

        let { width, height } = img;
        const maxDim = MAX_IMAGE_DIMENSION;

        // Scale down if necessary
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not create canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG data URL
        const dataUrl = canvas.toDataURL("image/jpeg", IMAGE_UPLOAD_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Read a text file as a UTF-8 string.
 */
function readTextFile(file: File): Promise<string> {
  return file.text();
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

function isImageFile(file: File): boolean {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

function isTextFile(file: File): boolean {
  return file.type === "text/plain";
}

/**
 * Process an array of user-attached Files into LLM-ready formats.
 *
 * - Images are compressed and converted to base64 data-URLs
 * - Text files are read as plain text
 * - Other files (PDF, Word) are acknowledged but content is not extracted
 */
export async function processFiles(files: File[]): Promise<ProcessedFiles> {
  const imageDataUrls: string[] = [];
  const textContents: { name: string; content: string }[] = [];
  const attachments: Attachment[] = [];

  const tasks = files.map(async (file) => {
    if (isImageFile(file)) {
      try {
        const dataUrl = await compressImage(file);
        imageDataUrls.push(dataUrl);
        attachments.push({
          url: dataUrl,
          type: "image",
          name: file.name,
          size: file.size,
        });
      } catch (err) {
        console.error(`[FileUtils] Failed to compress image ${file.name}:`, err);
      }
    } else if (isTextFile(file)) {
      try {
        const content = await readTextFile(file);
        // Cap text file content at 10 000 chars to avoid huge payloads
        const trimmed =
          content.length > 10_000
            ? content.slice(0, 10_000) + "\n\n[... file truncated at 10,000 characters]"
            : content;
        textContents.push({ name: file.name, content: trimmed });
        attachments.push({
          url: "",
          type: "document",
          name: file.name,
          size: file.size,
        });
      } catch (err) {
        console.error(`[FileUtils] Failed to read text file ${file.name}:`, err);
      }
    } else {
      // PDF / Word — acknowledge but can't extract client-side
      attachments.push({
        url: "",
        type: file.type.includes("pdf") ? "pdf" : "document",
        name: file.name,
        size: file.size,
      });
    }
  });

  await Promise.all(tasks);

  return { imageDataUrls, textContents, attachments };
}
