"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

async function sendTelegramAlert(error: Error & { digest?: string }) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const msg = [
      "🔴 *SRP HRMS — CRITICAL Error (Root)*",
      `*Error:* ${error.message || "Unknown error"}`,
      `*URL:* ${typeof window !== "undefined" ? window.location.href : "Unknown"}`,
      `*Time:* ${new Date().toISOString()}`,
      error.digest ? `*Digest:* ${error.digest}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: "Markdown",
      }),
    });
  } catch {
    // Non-critical
  }
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[Root Error Boundary]", error);
    sendTelegramAlert(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive text-xl font-bold text-destructive-foreground">
          !
        </div>
        <p className="text-sm font-medium text-destructive">Something went wrong</p>
        <h1 className="text-3xl font-bold tracking-tight">We hit an unexpected issue</h1>
        <p className="text-sm text-muted-foreground">
          Try the action again or return to the SRP HRMS dashboard.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
        )}
        <div className="flex justify-center gap-3">
          <button onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Try again
          </button>
          <a href="/dashboard" className="rounded-md border px-4 py-2 text-sm font-medium">
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

