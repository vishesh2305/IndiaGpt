import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Voice mode preference for the user.
 * - "push-to-talk": User presses and holds to speak
 * - "continuous": Microphone stays on and listens continuously
 */
type VoiceMode = "push-to-talk" | "continuous";

/**
 * User location represented as city and state within India.
 */
interface ILocation {
  city?: string;
  state?: string;
}

/**
 * User preferences controlling UI and interaction behavior.
 */
interface IUserPreferences {
  /** Voice input mode */
  voiceMode: VoiceMode;
  /** Whether to automatically read out AI responses via TTS */
  autoTTS: boolean;
  /** Whether location-aware features are enabled */
  locationEnabled: boolean;
}

/**
 * Core user document interface. Extends Mongoose Document for
 * type-safe access to fields and instance methods.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  language: string;
  location: ILocation;
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    city: { type: String, default: "" },
    state: { type: String, default: "" },
  },
  { _id: false }
);

const PreferencesSchema = new Schema<IUserPreferences>(
  {
    voiceMode: {
      type: String,
      enum: ["push-to-talk", "continuous"],
      default: "push-to-talk",
    },
    autoTTS: {
      type: Boolean,
      default: false,
    },
    locationEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      select: false, // Exclude password from queries by default
    },
    image: {
      type: String,
      default: "",
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    language: {
      type: String,
      default: "en",
      trim: true,
    },
    location: {
      type: LocationSchema,
      default: () => ({}),
    },
    preferences: {
      type: PreferencesSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// ------------------------------------------------------------------
// Indexes
// ------------------------------------------------------------------
UserSchema.index({ createdAt: -1 });

/**
 * Mongoose User model. Uses the conditional-export pattern
 * (`mongoose.models.User || mongoose.model(...)`) to prevent the
 * OverwriteModelError that occurs during Next.js hot-module reloading
 * in development.
 */
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
