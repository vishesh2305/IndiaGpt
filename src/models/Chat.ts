import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Chat document interface. Each chat belongs to a single user and
 * contains an ordered sequence of messages (stored in the Message
 * collection). The chat document itself holds metadata like title,
 * language, and a preview of the last message for sidebar rendering.
 */
export interface IChat extends Document {
  userId: Types.ObjectId;
  title: string;
  language: string;
  messageCount: number;
  lastMessagePreview: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
      maxlength: [200, "Chat title cannot exceed 200 characters"],
    },
    language: {
      type: String,
      default: "en",
      trim: true,
    },
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMessagePreview: {
      type: String,
      default: "",
      maxlength: [300, "Preview cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
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

// Compound index for efficient chat listing: fetch all chats for a
// user sorted by most-recently-updated first.
ChatSchema.index({ userId: 1, updatedAt: -1 });

// Secondary index for pagination by creation date.
ChatSchema.index({ userId: 1, createdAt: -1 });

/**
 * Mongoose Chat model. Uses the conditional-export pattern to
 * prevent OverwriteModelError during Next.js hot-module reloading.
 */
const Chat: Model<IChat> =
  (mongoose.models.Chat as Model<IChat>) ||
  mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;
