import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Allowed roles for a message in a chat conversation.
 */
type MessageRole = "user" | "assistant" | "system";

/**
 * Allowed attachment types that can accompany a user message.
 */
type AttachmentType = "image" | "pdf" | "document";

/**
 * File or media attached to a message (images, PDFs, documents).
 */
interface IAttachment {
  /** Public or signed URL to the file */
  url: string;
  /** MIME-category of the attachment */
  type: AttachmentType;
  /** Original file name */
  name: string;
  /** File size in bytes */
  size: number;
  /** AI-generated analysis or description of the attachment */
  analysis?: string;
}

/**
 * Metadata captured alongside the message for analytics,
 * debugging, and contextual replay.
 */
interface IMessageMetadata {
  /** Language code the message was composed in */
  language?: string;
  /** User location at the time the message was sent */
  location?: {
    city?: string;
    state?: string;
  };
  /** LLM model identifier used for this response */
  model?: string;
  /** Token counts for input (prompt) and output (completion) */
  tokens?: {
    input: number;
    output: number;
  };
  /** Round-trip latency for the AI response in milliseconds */
  latencyMs?: number;
}

/**
 * Message document interface. Each message belongs to a Chat and
 * stores a single turn (user, assistant, or system) along with
 * optional attachments and generation metadata.
 */
export interface IMessage extends Document {
  chatId: Types.ObjectId;
  role: MessageRole;
  content: string;
  attachments: IAttachment[];
  metadata: IMessageMetadata;
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    url: {
      type: String,
      required: [true, "Attachment URL is required"],
    },
    type: {
      type: String,
      enum: ["image", "pdf", "document"],
      required: [true, "Attachment type is required"],
    },
    name: {
      type: String,
      required: [true, "Attachment name is required"],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, "Attachment size is required"],
      min: 0,
    },
    analysis: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const MessageMetadataSchema = new Schema<IMessageMetadata>(
  {
    language: { type: String, default: "" },
    location: {
      city: { type: String, default: "" },
      state: { type: String, default: "" },
    },
    model: { type: String, default: "" },
    tokens: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
    },
    latencyMs: { type: Number, default: 0 },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat ID is required"],
      index: true,
    },
    role: {
      type: String,
      enum: {
        values: ["user", "assistant", "system"],
        message: "Role must be user, assistant, or system",
      },
      required: [true, "Message role is required"],
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    metadata: {
      type: MessageMetadataSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ------------------------------------------------------------------
// Indexes
// ------------------------------------------------------------------

// Compound index for retrieving messages in chronological order
// within a chat. This is the primary access pattern.
MessageSchema.index({ chatId: 1, createdAt: 1 });

// Index for counting or aggregating messages by role within a chat.
MessageSchema.index({ chatId: 1, role: 1 });

/**
 * Mongoose Message model. Uses the conditional-export pattern to
 * prevent OverwriteModelError during Next.js hot-module reloading.
 */
const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
