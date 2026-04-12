"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

/**
 * Bridges NextAuth sessions → localStorage tokens → Zustand auth store.
 * When a user signs in via NextAuth Google OAuth, their FastAPI tokens
 * from the backend are written to localStorage so the existing Axios
 * interceptor and Zustand store continue to work unchanged.
 */
function SessionSync() {
  const { data: session, status } = useSession();
  const { loadUser } = useAuthStore();
  const synced = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && session?.access_token && !synced.current) {
      synced.current = true;
      // Only overwrite if we don't already have a valid local token
      const existing = typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
      if (!existing) {
        localStorage.setItem("access_token", session.access_token);
        if (session.refresh_token) {
          localStorage.setItem("refresh_token", session.refresh_token);
        }
        loadUser();
      }
    }
  }, [status, session, loadUser]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
