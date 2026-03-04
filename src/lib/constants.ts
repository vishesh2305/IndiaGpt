/** Application display name */
export const APP_NAME = "IndiaGPT" as const;

/** Application description used in meta tags and UI */
export const APP_DESCRIPTION =
  "AI Assistant for India - Powered by Indian Context" as const;

/** Default language code when no user preference is set */
export const DEFAULT_LANGUAGE = "en" as const;

/** Maximum allowed file upload size in bytes (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** MIME types accepted for image uploads */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** MIME types accepted for document uploads */
export const SUPPORTED_DOC_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
] as const;

/** Maximum number of messages allowed in a single API request */
export const MAX_MESSAGES_PER_REQUEST = 20;

/** Default Groq LLM model identifier */
export const GROQ_MODEL = "llama-3.3-70b-versatile" as const;
