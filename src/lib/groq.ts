import Groq from "groq-sdk";

/**
 * Global type declaration for caching the Groq client across hot reloads
 * in development.
 */
declare global {
  // eslint-disable-next-line no-var
  var groqClient: Groq | undefined;
}

/**
 * Returns the singleton Groq SDK client instance, creating it on first use.
 * Lazy initialization prevents build-time errors when env vars aren't set.
 */
function getGroqClient(): Groq {
  if (global.groqClient) return global.groqClient;

  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "Please define the GROQ_API_KEY environment variable inside .env.local"
    );
  }

  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  if (process.env.NODE_ENV !== "production") {
    global.groqClient = client;
  }

  return client;
}

/**
 * Proxy that lazily initializes the Groq client on first property access.
 * This avoids throwing during module evaluation at build time.
 */
const groq = new Proxy({} as Groq, {
  get(_target, prop, receiver) {
    const client = getGroqClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export default groq;
