import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    /**
     * After Google authenticates the user, sync them with our FastAPI backend.
     * We store the FastAPI access/refresh tokens on the user object so the
     * jwt() callback can persist them into the NextAuth JWT.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          const resp = await fetch(`${BACKEND_URL}/api/v1/auth/google-sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Shared secret so the backend can verify source
              "x-nextauth-secret": process.env.NEXTAUTH_SECRET ?? "",
            },
            body: JSON.stringify({
              google_id: profile.sub,
              email: profile.email,
              name: profile.name,
              image: (profile as Record<string, unknown>).picture ?? null,
            }),
          });

          if (!resp.ok) {
            console.error("[NextAuth] google-sync failed:", resp.status, await resp.text());
            return false;
          }

          const data = await resp.json();
          // Attach tokens to user object for jwt() callback
          (user as Record<string, unknown>).access_token = data.access_token;
          (user as Record<string, unknown>).refresh_token = data.refresh_token;
          (user as Record<string, unknown>).backend_user = data.user;
          return true;
        } catch (err) {
          console.error("[NextAuth] google-sync error:", err);
          return false;
        }
      }
      return true;
    },

    /** Persist FastAPI tokens in the encrypted NextAuth JWT cookie. */
    async jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>;
        if (u.access_token) token.access_token = u.access_token as string;
        if (u.refresh_token) token.refresh_token = u.refresh_token as string;
        if (u.backend_user) token.backend_user = u.backend_user;
      }
      return token;
    },

    /** Expose FastAPI tokens on the client-accessible session object. */
    async session({ session, token }) {
      const s = session as Record<string, unknown>;
      s.access_token = token.access_token;
      s.refresh_token = token.refresh_token;
      s.backend_user = token.backend_user;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};
