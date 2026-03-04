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

/** Maximum number of history messages sent to the LLM per request */
export const MAX_MESSAGES_PER_REQUEST = 10;

/** Maximum characters per history message sent to the LLM (longer messages are truncated) */
export const MAX_HISTORY_MESSAGE_CHARS = 500;

/** Maximum tokens the LLM may generate in a single response */
export const MAX_RESPONSE_TOKENS = 2048;

/** Default Groq LLM model identifier (used for complex / substantive queries) */
export const GROQ_MODEL = "llama-3.3-70b-versatile" as const;

/** Lightweight Groq model for simple queries (greetings, acknowledgements, yes/no) */
export const GROQ_MODEL_FAST = "llama-3.1-8b-instant" as const;

/** Max tokens for the fast model (shorter responses for simple queries) */
export const MAX_RESPONSE_TOKENS_FAST = 512;
