"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import GoogleLoginButton from "@/components/GoogleLoginButton";

const IS_DEV = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SHOW_DEMO === "true";

const DEMO_ACCOUNTS = {
  superadmin: { email: "superadmin@srpailabs.com", password: "SrpAdmin@2026!", label: "Super Admin" },
  owner: { email: "hr@acme.com", password: "Admin@1234", label: "HR Manager" },
  employee: { email: "alice@acme.com", password: "Employee@1234", label: "Employee" },
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function applyDemoAccount(type: keyof typeof DEMO_ACCOUNTS) {
    setEmail(DEMO_ACCOUNTS[type].email);
    setPassword(DEMO_ACCOUNTS[type].password);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosErr = err as any;
      const detail = axiosErr?.response?.data?.detail;
      const message =
        (typeof detail === "string" ? detail : null) ||
        axiosErr?.response?.data?.message ||
        (axiosErr?.message === "Network Error"
          ? "Unable to reach the server. Please try again."
          : axiosErr?.message || "Invalid credentials");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-slate-200/80 shadow-xl dark:border-slate-800">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
          S
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />AI-ready</Badge>
          <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" />Secure</Badge>
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your SRP HRMS workspace</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {IS_DEV && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 dark:border-blue-900 dark:bg-blue-950/20">
            <p className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">Quick demo access</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(DEMO_ACCOUNTS).map(([key, account]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyDemoAccount(key as keyof typeof DEMO_ACCOUNTS)}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-left text-xs transition hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-950/40"
                >
                  <p className="font-medium text-foreground">{account.label}</p>
                  <p className="text-muted-foreground">{account.email}</p>
                </button>
              ))}
            </div>
          </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <GoogleLoginButton callbackUrl="/dashboard" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
