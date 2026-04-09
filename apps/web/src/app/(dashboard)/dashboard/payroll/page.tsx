"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, FileText, Calculator, TrendingUp, Loader2, Play, CheckCircle2, Eye } from "lucide-react";
import { payrollService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { PayrollRun, PayrollItem } from "@/types";

export default function PayrollPage() {
  const { toast } = useToast();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [processing, setProcessing] = useState(false);
  const [runMonth, setRunMonth] = useState(String(new Date().getMonth() + 1));
  const [runYear, setRunYear] = useState(String(new Date().getFullYear()));
  const [stats, setStats] = useState({ totalGross: 0, totalDeductions: 0, totalNet: 0, employeeCount: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [runsResult] = await Promise.allSettled([
        payrollService.listRuns(),
      ]);
      if (runsResult.status === "fulfilled") {
        const data = runsResult.value;
        setPayrollRuns(Array.isArray(data) ? data : data?.data || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load payroll data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleInitiatePayroll() {
    setProcessing(true);
    try {
      await payrollService.createRun({ period_month: parseInt(runMonth), period_year: parseInt(runYear) });
      toast({ title: "Payroll Initiated", description: `Payroll run created for ${runMonth}/${runYear}`, variant: "success" });
      setRunDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to initiate payroll";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  async function handleProcessRun(run: PayrollRun) {
    setProcessing(true);
    try {
      await payrollService.processRun(run.business_id);
      toast({ title: "Payroll Processing", description: "Payroll is being processed...", variant: "success" });
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to process payroll";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  async function handleApproveRun(run: PayrollRun) {
    setProcessing(true);
    try {
      await payrollService.processRun(run.business_id);
      toast({ title: "Payroll Approved", variant: "success" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to approve payroll", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  async function viewPayslips(run: PayrollRun) {
    setSelectedRun(run);
    try {
      const result = await payrollService.getItems(run.business_id);
      setPayslips(Array.isArray(result) ? result : result?.data || []);
    } catch {
      setPayslips([]);
    }
    setPayslipDialogOpen(true);
  }

  const statusColors: Record<string, "warning" | "success" | "default" | "secondary"> = {
    draft: "warning", processing: "default", completed: "success", approved: "success",
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Process payroll, manage salaries, and generate payslips</p>
        </div>
        <Button onClick={() => setRunDialogOpen(true)}>
          <Calculator className="mr-2 h-4 w-4" />Run Payroll
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Monthly Payroll", value: formatCurrency(stats.totalNet || 0), icon: DollarSign, color: "text-green-600" },
          { label: "Total Deductions", value: formatCurrency(stats.totalDeductions || 0), icon: TrendingUp, color: "text-red-600" },
          { label: "Payslips Generated", value: stats.employeeCount || "—", icon: FileText, color: "text-blue-600" },
          { label: "Avg. Salary", value: stats.employeeCount ? formatCurrency(stats.totalNet / stats.employeeCount) : "—", icon: Calculator, color: "text-purple-600" },
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
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : payrollRuns.length > 0 ? (
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
                        <td className="p-3 text-sm font-medium">{monthNames[(run.period_month || 1) - 1]} {run.period_year}</td>
                        <td className="p-3 text-sm">{run.total_employees}</td>
                        <td className="p-3 text-sm">{formatCurrency(run.total_gross || 0)}</td>
                        <td className="p-3 text-sm">{formatCurrency(run.total_deductions || 0)}</td>
                        <td className="p-3 text-sm font-medium">{formatCurrency(run.total_net || 0)}</td>
                        <td className="p-3"><Badge variant={statusColors[run.status]}>{run.status}</Badge></td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => viewPayslips(run)}>
                              <Eye className="mr-1 h-3 w-3" />View
                            </Button>
                            {run.status === "draft" && (
                              <Button size="sm" disabled={processing} onClick={() => handleProcessRun(run)}>
                                <Play className="mr-1 h-3 w-3" />Process
                              </Button>
                            )}
                            {(run.status === "processing" || run.status === "completed") && (
                              <Button size="sm" variant="default" disabled={processing} onClick={() => handleApproveRun(run)}>
                                <CheckCircle2 className="mr-1 h-3 w-3" />Approve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8" />
                  <p>No payroll runs yet.</p>
                  <p className="text-xs">Click &quot;Run Payroll&quot; to initiate your first payroll.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Salary Structures</CardTitle>
              <CardDescription>Define salary components and structures</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Salary structures will be loaded from the payroll service.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Run Payroll Dialog */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Payroll Run</DialogTitle>
            <DialogDescription>Select the month and year to create a new payroll run</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={runMonth} onValueChange={setRunMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={runYear} onValueChange={setRunYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInitiatePayroll} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initiate Payroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslips Dialog */}
      <Dialog open={payslipDialogOpen} onOpenChange={setPayslipDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslips — {selectedRun ? `${monthNames[(selectedRun.period_month || 1) - 1]} ${selectedRun.period_year}` : ""}</DialogTitle>
            <DialogDescription>{payslips.length} payslips generated</DialogDescription>
          </DialogHeader>
          {payslips.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Employee</th>
                  <th className="p-2 text-right font-medium">Basic</th>
                  <th className="p-2 text-right font-medium">Gross</th>
                  <th className="p-2 text-right font-medium">Deductions</th>
                  <th className="p-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((ps) => (
                  <tr key={ps.id} className="border-b last:border-0">
                    <td className="p-2">{ps.employee_name || ps.employee_id}</td>
                    <td className="p-2 text-right">{formatCurrency(ps.basic_salary || 0)}</td>
                    <td className="p-2 text-right">{formatCurrency(ps.gross_salary || 0)}</td>
                    <td className="p-2 text-right">{formatCurrency(ps.total_deductions || 0)}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(ps.net_salary || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-4 text-center text-muted-foreground">No payslips found for this run</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
