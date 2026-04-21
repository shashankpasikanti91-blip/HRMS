"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Landmark, Globe, Info, ChevronRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

interface TaxRule {
  name: string;
  rate: string;
  basis: string;
  notes: string;
}

interface CountryTax {
  flag: string;
  country: string;
  code: string;
  currency: string;
  status: "configured" | "default" | "not-setup";
  rules: TaxRule[];
}

const COUNTRY_TAX_DEFAULTS: CountryTax[] = [
  {
    flag: "🇮🇳",
    country: "India",
    code: "IN",
    currency: "INR",
    status: "default",
    rules: [
      { name: "Income Tax (TDS)", rate: "Per slab", basis: "Annual CTC", notes: "Old vs New regime, slab-based deduction" },
      { name: "Provident Fund (PF/EPF)", rate: "12% employee + 12% employer", basis: "Basic salary (max ₹15,000)", notes: "Mandatory for eligible employees" },
      { name: "Professional Tax", rate: "Up to ₹2,500/year", basis: "Gross salary", notes: "State-specific; configured per state" },
      { name: "ESIC", rate: "0.75% employee + 3.25% employer", basis: "Gross salary ≤ ₹21,000/mo", notes: "Health insurance scheme" },
    ],
  },
  {
    flag: "🇲🇾",
    country: "Malaysia",
    code: "MY",
    currency: "MYR",
    status: "default",
    rules: [
      { name: "EPF (Employee Provident Fund)", rate: "11% employee + 12–13% employer", basis: "Monthly salary", notes: "Below age 60; rates differ for PR/citizen" },
      { name: "SOCSO (Perkeso)", rate: "0.5% employee + 1.75% employer", basis: "Monthly salary (cap ~RM4,000)", notes: "Social insurance for employment injury/invalidity" },
      { name: "EIS (Employment Insurance System)", rate: "0.2% employee + 0.2% employer", basis: "Monthly salary (cap ~RM4,000)", notes: "For retrenchment/job loss scenarios" },
      { name: "PCB / Income Tax (MTD)", rate: "Per slab (0–30%)", basis: "Annual chargeable income", notes: "Monthly Tax Deduction (MTD) at source" },
      { name: "HRD Levy", rate: "0.5–1% employer", basis: "Monthly salary", notes: "Mandatory for companies with ≥10 Malaysian employees" },
    ],
  },
  {
    flag: "🇸🇬",
    country: "Singapore",
    code: "SG",
    currency: "SGD",
    status: "default",
    rules: [
      { name: "CPF (Employee)", rate: "20% (age ≤ 35)", basis: "Ordinary + Additional wages", notes: "Rate reduces with age; PR has reduced rates for first 2 years" },
      { name: "CPF (Employer)", rate: "17% (age ≤ 35)", basis: "Ordinary + Additional wages", notes: "Capped at ordinary wage ceiling (SGD 6,800/mo from 2025)" },
      { name: "SDL (Skills Development Levy)", rate: "0.25% or min SGD 2", basis: "Monthly gross salary", notes: "Capped at SGD 11.25; all employees including foreigners" },
      { name: "Personal Income Tax", rate: "0–22% (resident slab)", basis: "Annual chargeable income", notes: "Not deducted at source — filed annually. IRAS auto-calculates" },
    ],
  },
  {
    flag: "🇦🇪",
    country: "UAE",
    code: "AE",
    currency: "AED",
    status: "default",
    rules: [
      { name: "Personal Income Tax", rate: "0%", basis: "N/A", notes: "UAE has no personal income tax for employees" },
      { name: "GPSSA (UAE Nationals only)", rate: "5% employee + 12.5–15% employer", basis: "Basic salary", notes: "Social security only applies to UAE nationals and GCC citizens" },
      { name: "End of Service Gratuity (EOSG)", rate: "21 days base pay per year (≤5 yrs)", basis: "Last drawn basic salary", notes: "Mandatory on termination/resignation after 1 year; 30 days/year beyond 5 yrs" },
      { name: "WPS (Wage Protection System)", rate: "—", basis: "Full salary", notes: "All private sector employees; payment compliance tracked by MOHRE" },
    ],
  },
];

const statusBadge: Record<CountryTax["status"], { label: string; variant: "success" | "secondary" | "warning" }> = {
  configured: { label: "Configured", variant: "success" },
  default:    { label: "Default Rules", variant: "secondary" },
  "not-setup":{ label: "Not Set Up", variant: "warning" },
};

export default function TaxationPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = ["super_admin", "company_admin", "hr_manager", "finance"].includes(user?.role || "");

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">Taxation settings are only accessible to HR Admins and Finance roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Taxation</h1>
          <p className="text-muted-foreground">Country tax rules, statutory contributions, and payroll deduction settings</p>
        </div>
        <Badge variant="secondary" className="mt-1">
          <Info className="mr-1 h-3 w-3" />Phase 5 — Full rules engine coming soon
        </Badge>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-4 pb-4">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Default tax rules are loaded per country</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
              In Phase 5, admins will be able to customize rates, add effective-date versions, override rules for specific employee groups, and preview payroll calculations per country. Historical payroll runs are always locked to the rules in effect at that time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Country Tabs */}
      <Tabs defaultValue="IN">
        <TabsList className="w-full md:w-auto">
          {COUNTRY_TAX_DEFAULTS.map((c) => (
            <TabsTrigger key={c.code} value={c.code}>
              <span className="mr-1.5">{c.flag}</span>{c.country}
            </TabsTrigger>
          ))}
        </TabsList>

        {COUNTRY_TAX_DEFAULTS.map((country) => (
          <TabsContent key={country.code} value={country.code} className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
                  {country.flag}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{country.country}</h2>
                  <p className="text-sm text-muted-foreground">Currency: {country.currency}</p>
                </div>
                <Badge variant={statusBadge[country.status].variant}>
                  {statusBadge[country.status].label}
                </Badge>
              </div>
              <Button variant="outline" disabled className="gap-2">
                <Landmark className="h-4 w-4" />
                Customize Rules
                <span className="text-xs text-muted-foreground ml-1">(Phase 5)</span>
              </Button>
            </div>

            <div className="grid gap-3">
              {country.rules.map((rule, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold">{rule.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{rule.notes}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-medium text-foreground">{rule.rate}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">on {rule.basis}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {country.code === "IN" && (
              <Card className="mt-4 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">State-Level Professional Tax</CardTitle>
                  <CardDescription>Professional tax rates vary by Indian state. Full state configuration is available in Phase 5.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { state: "Maharashtra", rate: "₹200/mo (≥₹10,000/mo)" },
                      { state: "Karnataka", rate: "₹200/mo (≥₹15,000/mo)" },
                      { state: "Tamil Nadu", rate: "₹156/mo (₹10,001–20,000)" },
                      { state: "West Bengal", rate: "₹150/mo (₹15,001–25,000)" },
                      { state: "Andhra Pradesh", rate: "₹150–200/mo" },
                      { state: "Telangana", rate: "₹150–200/mo" },
                      { state: "Gujarat", rate: "₹200/mo (≥₹12,000/mo)" },
                      { state: "Delhi / Others", rate: "Not applicable" },
                    ].map((s) => (
                      <div key={s.state} className="rounded-md border px-3 py-2">
                        <p className="font-medium text-xs">{s.state}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.rate}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {country.code === "SG" && (
              <Card className="mt-4 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">CPF Age-Based Contribution Rates (2025)</CardTitle>
                  <CardDescription>CPF rates decrease as employees get older. PR rates differ in first two years.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-muted-foreground font-medium">Age Group</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Employee</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Employer</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { age: "≤ 35", emp: "20%", er: "17%", total: "37%" },
                          { age: "35–45", emp: "20%", er: "17%", total: "37%" },
                          { age: "45–50", emp: "20%", er: "17%", total: "37%" },
                          { age: "50–55", emp: "20%", er: "17%", total: "37%" },
                          { age: "55–60", emp: "15%", er: "15%", total: "30%" },
                          { age: "60–65", emp: "9.5%", er: "11.5%", total: "21%" },
                          { age: "> 65", emp: "7.5%", er: "9%", total: "16.5%" },
                        ].map((row) => (
                          <tr key={row.age} className="border-b last:border-0">
                            <td className="py-2">{row.age}</td>
                            <td className="py-2 text-right font-mono">{row.emp}</td>
                            <td className="py-2 text-right font-mono">{row.er}</td>
                            <td className="py-2 text-right font-mono font-medium">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Payroll Settings Link */}
      <Card>
        <CardContent className="flex items-center justify-between pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Organization Country & Payroll Settings</p>
              <p className="text-xs text-muted-foreground">Set your company&apos;s operating countries, default currency, and payroll frequency.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard/settings")}>
            Go to Settings<ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
