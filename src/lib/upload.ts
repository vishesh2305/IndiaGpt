/**
 * Upload Utilities
 *
 * Shared helpers for validating, categorising, and formatting
 * uploaded files throughout the IndiaGPT application.
 */

// ── Supported MIME types ────────────────────────────────────────────────────

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const SUPPORTED_MIME_TYPES: readonly string[] = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_DOCUMENT_TYPES,
];

/**
 * Accepted file extensions mapped from the supported MIME types.
 * Useful for file input `accept` attributes.
 */
export const ACCEPTED_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "text/markdown": [".md"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

/**
 * Comma-separated string of accepted MIME types and extensions for
 * HTML file input `accept` attribute.
 */
export const ACCEPT_STRING = [
  ...SUPPORTED_MIME_TYPES,
  ...Object.values(ACCEPTED_EXTENSIONS).flat(),
].join(",");

/** Maximum file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Maximum file size as a human-readable label. */
export const MAX_FILE_SIZE_LABEL = "10 MB";

// ── File type classification ────────────────────────────────────────────────

export type FileCategory = "image" | "pdf" | "document";

/**
 * Classifies a MIME type string into one of three categories.
 *
 * @param mimeType - The MIME type string (e.g. "image/png")
 * @returns The file category
 */
export function getFileType(mimeType: string): FileCategory {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "document";
}

/**
 * Infers a file category from a file extension when the MIME type
 * is not available.
 *
 * @param filename - The file name or path
 * @returns The inferred file category
 */
export function getFileTypeFromExtension(filename: string): FileCategory {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
  if (imageExtensions.includes(ext)) return "image";

  if (ext === "pdf") return "pdf";

  return "document";
}

// ── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file against the supported MIME types and maximum size.
 *
 * @param file - The File object to validate
 * @returns A result indicating whether the file is acceptable
 */
export function validateFile(file: File): ValidationResult {
  // Check MIME type
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allExtensions = Object.values(ACCEPTED_EXTENSIONS).flat();
    const extWithDot = `.${ext}`;

    // Fallback: allow if extension matches even when MIME is blank/generic
    if (!allExtensions.includes(extWithDot)) {
      return {
        valid: false,
        error: `Unsupported file type "${file.type || ext}". Accepted: images (JPG, PNG, WebP, GIF), PDF, and text files.`,
      };
    }
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the ${MAX_FILE_SIZE_LABEL} limit.`,
    };
  }

  // Check for empty files
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty.",
    };
  }

  return { valid: true };
}

// ── Formatting ──────────────────────────────────────────────────────────────

/**
 * Formats a byte count into a human-readable string.
 *
 * @param bytes - The number of bytes
 * @returns Formatted string, e.g. "2.5 MB"
 *
 * @example
 * formatFileSize(1024)      // "1 KB"
 * formatFileSize(2621440)   // "2.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"] as const;
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, units.length - 1);
  const value = bytes / Math.pow(k, index);

  // Use up to 1 decimal place; drop the decimal if it's .0
  return `${parseFloat(value.toFixed(1))} ${units[index]}`;
}

// ── Path generation ─────────────────────────────────────────────────────────

/**
 * Generates a unique upload path for a file.
 *
 * Format: `uploads/{userId}/{timestamp}-{sanitisedFilename}`
 *
 * @param userId   - The authenticated user's ID
 * @param filename - The original file name
 * @returns The relative path to store the file at
 */
export function generateUploadPath(userId: string, filename: string): string {
  // Sanitise the filename: keep only alphanumeric, hyphens, underscores, and dots
  const sanitised = filename
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();

  const timestamp = Date.now();

  return `uploads/${userId}/${timestamp}-${sanitised}`;
}
