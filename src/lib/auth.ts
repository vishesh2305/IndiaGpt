import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import connectDB from "@/lib/db";
import User from "@/models/User";

// ---------------------------------------------------------------------------
// MongoDB native client for the NextAuth adapter.
// The adapter needs a raw MongoClient (not Mongoose) to manage its own
// collections (accounts, sessions, verification-tokens, etc.).
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (global._mongoClientPromise) return global._mongoClientPromise;

  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/indiagpt";

  const client = new MongoClient(uri);
  const promise = client.connect();

  if (process.env.NODE_ENV !== "production") {
    global._mongoClientPromise = promise;
  }

  return promise;
}

// ---------------------------------------------------------------------------
// NextAuth v5 configuration
// ---------------------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use the MongoDB adapter for persisting accounts, sessions, etc.
  adapter: MongoDBAdapter(getClientPromise()),

  // Use JWT-based sessions so we don't need a session collection and
  // can read the session on the edge (middleware).
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Custom pages
  pages: {
    signIn: "/login",
  },

  // -------------------------------------------------------------------
  // Providers
  // -------------------------------------------------------------------
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        // Explicitly select password since it is excluded by default
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        }).select("+password");

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.password) {
          throw new Error(
            "This account uses social login. Please sign in with Google."
          );
        }

        // Basic password comparison. Replace with bcrypt.compare()
        // once bcrypt / bcryptjs is installed:
        //   const isValid = await bcrypt.compare(credentials.password, user.password);
        const isValid = credentials.password === user.password;

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || "",
        };
      },
    }),
  ],

  // -------------------------------------------------------------------
  // Callbacks
  // -------------------------------------------------------------------
  callbacks: {
    /**
     * Called when a sign-in attempt is made. We use this hook to
     * ensure every OAuth user also has a document in our Mongoose
     * User collection (the adapter writes to its own "users"
     * collection which may differ from our schema).
     */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();

          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            await User.create({
              name: user.name ?? "",
              email: user.email ?? "",
              image: user.image ?? "",
              emailVerified: new Date(),
            });
          } else {
            // Update avatar and name in case they changed on Google
            await User.updateOne(
              { email: user.email ?? "" },
              {
                $set: {
                  name: user.name ?? "",
                  image: user.image ?? "",
                },
              }
            );
          }
        } catch (error) {
          console.error("[Auth] Error syncing user to Mongoose:", error);
          // Don't block sign-in if the sync fails
        }
      }

      return true;
    },

    /**
     * Persist the user's database ID inside the JWT so it is
     * available in the session callback without an extra DB query.
     */
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: attach the user ID
      if (user) {
        // For credentials, user.id comes from authorize().
        // For OAuth, user.id comes from the adapter.
        token.sub = user.id;

        // Also look up the Mongoose user to get the canonical _id
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.sub = dbUser._id.toString();
          }
        } catch {
          // Fallback to the adapter-provided ID
        }
      }

      // Allow session updates (e.g. language change) to propagate
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.picture = session.image ?? token.picture;
      }

      return token;
    },

    /**
     * Expose the user ID on the client-side session object.
     */
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    /**
     * Control route protection. Unauthenticated users are
     * redirected to the login page for protected routes. Already
     * authenticated users are redirected away from auth pages.
     */
    authorized({ auth: sessionAuth, request: { nextUrl } }) {
      const isLoggedIn = !!sessionAuth?.user;
      const { pathname } = nextUrl;

      // Public paths that don't require authentication
      const publicPaths = ["/login", "/register"];
      const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
      const isAuthApi = pathname.startsWith("/api/auth");

      // Always allow auth API routes
      if (isAuthApi) {
        return true;
      }

      // Redirect authenticated users away from login/register
      if (isLoggedIn && isPublicPath) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Redirect unauthenticated users to login for protected routes
      if (!isLoggedIn && !isPublicPath) {
        const callbackUrl = encodeURIComponent(pathname);
        return Response.redirect(
          new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
        );
      }

      return true;
    },
  },

  // -------------------------------------------------------------------
  // Events (optional logging / side-effects)
  // -------------------------------------------------------------------
  events: {
    async signIn({ user }) {
      console.log(`[Auth] User signed in: ${user.email}`);
    },
  },

  // Trust the host header (required for deployments behind a reverse proxy)
  trustHost: true,
});
