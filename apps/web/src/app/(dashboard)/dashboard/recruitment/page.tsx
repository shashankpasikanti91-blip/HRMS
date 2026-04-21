"use client";

import { ArrowRight, Briefcase, ExternalLink, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * Recruitment is a separate paid product — not part of core SRP AI HRMS.
 * This page acts as an informational gate rather than exposing recruitment UI.
 */
export default function RecruitmentPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
          <Briefcase className="h-8 w-8 text-primary" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Recruitment</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The Recruitment module is a separate product from SRP AI HRMS. It is not
            included in the core HR operating system to keep the platform focused,
            fast, and purpose-built for HR operations.
          </p>
        </div>

        {/* Info card */}
        <Card className="text-left">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Not included in this plan</p>
                <p className="text-xs text-muted-foreground">
                  Recruitment is available as an add-on or standalone product.
                  Contact your account manager to activate it for your organization.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">What you get here instead</p>
                <p className="text-xs text-muted-foreground">
                  Once a candidate is hired externally and you receive their joining details,
                  add them directly as an employee and start the onboarding workflow from
                  the Employees module.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => router.push("/dashboard/employees")}>
            Go to Employees
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:sales@srpailabs.com" target="_blank" rel="noreferrer">
              Inquire about Recruitment
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}