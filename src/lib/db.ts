import mongoose from "mongoose";

function getMongoURI(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }
  return uri;
}

/**
 * Global type declaration for caching the Mongoose connection across
 * hot reloads in development. In production, this is not necessary
 * but does no harm.
 */
declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

/**
 * Cached connection reference. In development, Next.js clears the Node.js
 * module cache on every edit, so a global variable is used to preserve
 * the connection across hot reloads and prevent connection leaks.
 */
const cached = global.mongooseConnection || { conn: null, promise: null };

if (!global.mongooseConnection) {
  global.mongooseConnection = cached;
}

/**
 * Connects to MongoDB using Mongoose with a singleton pattern.
 * Re-uses an existing connection if available, otherwise creates
 * a new one. Safe to call repeatedly from API routes and server
 * components.
 *
 * @returns The Mongoose instance once connected
 */
async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(getMongoURI(), opts)
      .then((mongooseInstance) => {
        console.log("[MongoDB] Connected successfully");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }

  return cached.conn;
}

export default connectDB;
