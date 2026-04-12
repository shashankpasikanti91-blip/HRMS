import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
          S
        </div>
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you requested is unavailable or has moved. Return to the SRP HRMS workspace to continue.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Go to home
          </Link>
          <Link href="/login" className="rounded-md border px-4 py-2 text-sm font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
