import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Augments the default Session type to include the user's database id.
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * Augments the default User type to include the database id.
   */
  interface User extends DefaultUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Augments the default JWT type to include the user's database id,
   * making it available in the jwt and session callbacks.
   */
  interface JWT extends DefaultJWT {
    id: string;
  }
}
