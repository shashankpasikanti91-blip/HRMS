"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
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
