"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services/api-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function RegisterPage() {
  const router = useRouter();
  const { loadUser } = useAuthStore();
  const [form, setForm] = useState({
    companyName: "",
    adminFullName: "",
    companyEmail: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!form.companyName.trim()) {
      setError("Company name is required");
      return;
    }
    if (!form.adminFullName.trim()) {
      setError("Your full name is required");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.registerCompany({
        company_name: form.companyName.trim(),
        company_email: form.companyEmail.trim() || form.adminEmail.trim(),
        admin_full_name: form.adminFullName.trim(),
        admin_email: form.adminEmail.trim(),
        admin_password: form.password,
      });

      // Store tokens returned by the registration endpoint
      if (result.access_token) {
        localStorage.setItem("access_token", result.access_token);
      }
      if (result.refresh_token) {
        localStorage.setItem("refresh_token", result.refresh_token);
      }

      // Reload user state from token
      await loadUser();
      router.push("/dashboard");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosErr = err as any;
      const detail = axiosErr?.response?.data?.detail;
      const message =
        Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg || String(d)).join("; ")
          : typeof detail === "string"
          ? detail
          : axiosErr?.response?.data?.message ||
            axiosErr?.message ||
            "Registration failed. Please try again.";
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
          <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" />Company Setup</Badge>
          <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" />Secure</Badge>
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />AI-ready</Badge>
        </div>
        <CardTitle className="text-2xl">Start your free trial</CardTitle>
        <CardDescription>Set up your company workspace in under 2 minutes</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* Google sign-up */}
          <GoogleLoginButton callbackUrl="/dashboard" label="Continue with Google" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
            </div>
          </div>

          {/* Company name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name *</Label>
            <Input
              id="companyName"
              placeholder="Acme Corp"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              required
            />
          </div>

          {/* Admin full name */}
          <div className="space-y-2">
            <Label htmlFor="adminFullName">Your full name *</Label>
            <Input
              id="adminFullName"
              placeholder="John Smith"
              value={form.adminFullName}
              onChange={(e) => update("adminFullName", e.target.value)}
              required
            />
          </div>

          {/* Work email */}
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Work email *</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="john@acmecorp.com"
              value={form.adminEmail}
              onChange={(e) => {
                update("adminEmail", e.target.value);
                // Auto-fill company email if not manually set
                if (!form.companyEmail) update("companyEmail", e.target.value);
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              This becomes your admin login and company contact email.
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating workspace…" : "Create company workspace"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By registering you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
