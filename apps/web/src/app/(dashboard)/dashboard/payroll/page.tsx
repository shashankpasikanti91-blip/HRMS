"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, FileText, Calculator, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function PayrollPage() {
  const payrollRuns = [
    { id: "1", month: "March 2025", status: "draft", employees: 248, gross: 1450000, deductions: 200000, net: 1250000 },
    { id: "2", month: "February 2025", status: "approved", employees: 245, gross: 1430000, deductions: 198000, net: 1232000 },
    { id: "3", month: "January 2025", status: "approved", employees: 242, gross: 1410000, deductions: 195000, net: 1215000 },
  ];

  const statusColors: Record<string, "warning" | "success" | "default"> = {
    draft: "warning",
    processing: "default",
    completed: "success",
    approved: "success",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Process payroll, manage salaries, and generate payslips</p>
        </div>
        <Button size="sm"><Calculator className="mr-2 h-4 w-4" />Run Payroll</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Monthly Payroll", value: formatCurrency(1250000), icon: DollarSign, color: "text-green-600" },
          { label: "Total Deductions", value: formatCurrency(200000), icon: TrendingUp, color: "text-red-600" },
          { label: "Payslips Generated", value: "248", icon: FileText, color: "text-blue-600" },
          { label: "Avg. Salary", value: formatCurrency(5040), icon: Calculator, color: "text-purple-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="salary">Salary Structures</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>View and manage monthly payroll runs</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Period</th>
                    <th className="p-3 text-left text-sm font-medium">Employees</th>
                    <th className="p-3 text-left text-sm font-medium">Gross</th>
                    <th className="p-3 text-left text-sm font-medium">Deductions</th>
                    <th className="p-3 text-left text-sm font-medium">Net</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRuns.map((run) => (
                    <tr key={run.id} className="border-b last:border-0">
                      <td className="p-3 text-sm font-medium">{run.month}</td>
                      <td className="p-3 text-sm">{run.employees}</td>
                      <td className="p-3 text-sm">{formatCurrency(run.gross)}</td>
                      <td className="p-3 text-sm">{formatCurrency(run.deductions)}</td>
                      <td className="p-3 text-sm font-medium">{formatCurrency(run.net)}</td>
                      <td className="p-3"><Badge variant={statusColors[run.status]}>{run.status}</Badge></td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          {run.status === "draft" && <Button size="sm">Process</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
