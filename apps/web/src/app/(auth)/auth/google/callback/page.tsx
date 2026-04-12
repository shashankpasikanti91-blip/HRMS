"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState("");

  useEffect(() => {
    // First check for direct token params (legacy flow)
    if (searchParams) {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(errorParam);
        setTimeout(() => router.replace("/login"), 3000);
        return;
      }

      if (accessToken && refreshToken) {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        useAuthStore.getState().loadUser().then(() => {
          router.replace("/dashboard");
        });
        return;
      }
    }

    // NextAuth session flow - extract backend tokens from session
    if (status === "authenticated" && session) {
      const sess = session as Record<string, unknown>;
      const accessToken = sess.access_token as string | undefined;
      const refreshToken = sess.refresh_token as string | undefined;

      if (accessToken && refreshToken) {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        useAuthStore.getState().loadUser().then(() => {
          router.replace("/dashboard");
        });
      } else {
        // Session exists but no backend tokens - try loading user directly
        useAuthStore.getState().loadUser().then(() => {
          const isAuth = useAuthStore.getState().isAuthenticated;
          if (isAuth) {
            router.replace("/dashboard");
          } else {
            setError("Google sign-in succeeded but backend authentication failed. Please try again.");
            setTimeout(() => router.replace("/login"), 3000);
          }
        });
      }
    } else if (status === "unauthenticated") {
      setError("Authentication failed. Please try again.");
      setTimeout(() => router.replace("/login"), 3000);
    }
  }, [searchParams, router, session, status]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive max-w-md text-center">
          {error}
        </div>
        <p className="text-sm text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Completing sign in...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
