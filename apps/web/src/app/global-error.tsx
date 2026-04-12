"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive text-xl font-bold text-destructive-foreground">
              !
            </div>
            <p className="text-sm font-medium text-destructive">SRP HRMS error</p>
            <h1 className="text-3xl font-bold tracking-tight">The page could not be loaded</h1>
            <p className="text-sm text-muted-foreground">
              Please retry or return to the sign-in page.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Retry
              </button>
              <a href="/login" className="rounded-md border px-4 py-2 text-sm font-medium">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
