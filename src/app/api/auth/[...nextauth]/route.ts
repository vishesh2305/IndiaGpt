/**
 * NextAuth v5 API route handler.
 *
 * This catch-all route delegates all authentication requests
 * (sign-in, sign-out, callback, csrf, session, etc.) to the
 * centralized auth configuration in @/lib/auth.
 *
 * Supported endpoints (handled automatically):
 *   GET  /api/auth/signin
 *   POST /api/auth/signin/:provider
 *   GET  /api/auth/callback/:provider
 *   GET  /api/auth/signout
 *   POST /api/auth/signout
 *   GET  /api/auth/session
 *   GET  /api/auth/csrf
 *   GET  /api/auth/providers
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
