"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, FileText, Calculator, TrendingUp, Loader2, Play, CheckCircle2, Eye, Download, Building2, User, X, Plus, Edit, Trash2 } from "lucide-react";
import { payrollService, salaryService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { PayrollRun, PayrollItem, PayslipDetail, SalaryStructure, SalaryComponent } from "@/types";

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
  const [payslipDetailOpen, setPayslipDetailOpen] = useState(false);
  const [payslipDetail, setPayslipDetail] = useState<PayslipDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [payslipDetailError, setPayslipDetailError] = useState<string | null>(null);
  const [lastPayslipItem, setLastPayslipItem] = useState<PayrollItem | null>(null);

  // Salary structures state
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [structureForm, setStructureForm] = useState({ name: "", code: "", description: "", currency: "INR", payroll_cycle: "monthly", is_default: false });
  const [savingStructure, setSavingStructure] = useState(false);
  const [expandedStructure, setExpandedStructure] = useState<string | null>(null);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [componentForm, setComponentForm] = useState({ name: "", code: "", component_type: "earning", calculation_type: "fixed", amount: 0, percentage: 0, is_taxable: true, is_mandatory: false, priority: 100, description: "" });
  const [savingComponent, setSavingComponent] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [runsResult] = await Promise.allSettled([
        payrollService.listRuns(),
      ]);
      if (runsResult.status === "fulfilled") {
        const data = runsResult.value;
        const runs: PayrollRun[] = Array.isArray(data) ? data : data?.data || [];
        setPayrollRuns(runs);
        // Compute summary stats from the latest processed/approved run
        const activeRun = runs.find((r) => r.status === "approved" || r.status === "processed") || runs[0];
        if (activeRun) {
          setStats({
            totalGross: runs.reduce((sum, r) => sum + (r.total_gross || 0), 0),
            totalDeductions: runs.reduce((sum, r) => sum + (r.total_deductions || 0), 0),
            totalNet: runs.reduce((sum, r) => sum + (r.total_net || 0), 0),
            employeeCount: activeRun.total_employees || 0,
          });
        }
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
      const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg = axErr?.response?.data?.detail || axErr?.response?.data?.message || "Failed to initiate payroll";
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
      const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg = axErr?.response?.data?.detail || axErr?.response?.data?.message || "Failed to process payroll";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  async function handleApproveRun(run: PayrollRun) {
    setProcessing(true);
    try {
      await payrollService.approveRun(run.business_id);
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

  async function viewPayslipDetail(ps: PayrollItem) {
    setLoadingDetail(true);
    setPayslipDetailOpen(true);
    setPayslipDetailError(null);
    setLastPayslipItem(ps);
    try {
      if (!ps.business_id) {
        throw new Error("Payslip ID is missing");
      }
      const detail = await payrollService.getItemDetail(ps.business_id);
      setPayslipDetail(detail);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || (err as Error)?.message
        || "Failed to load payslip details";
      setPayslipDetailError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
      setPayslipDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  // ── Salary Structures ────────────────────────────────────────
  const loadStructures = useCallback(async () => {
    setLoadingStructures(true);
    try {
      const res = await salaryService.listStructures();
      const data = Array.isArray(res) ? res : res?.data || [];
      setSalaryStructures(data);
    } catch {
      toast({ title: "Error", description: "Failed to load salary structures", variant: "destructive" });
    } finally {
      setLoadingStructures(false);
    }
  }, [toast]);

  async function loadComponents(structureId: string) {
    setLoadingComponents(true);
    try {
      // Components are already embedded in the structure from the API
      const s = salaryStructures.find((st) => st.business_id === structureId);
      setComponents(s?.components || []);
    } catch {
      setComponents([]);
    } finally {
      setLoadingComponents(false);
    }
  }

  function openStructureDialog(s?: SalaryStructure) {
    if (s) {
      setEditingStructure(s);
      setStructureForm({ name: s.name, code: s.code || "", description: s.description || "", currency: s.currency, payroll_cycle: s.payroll_cycle, is_default: s.is_default });
    } else {
      setEditingStructure(null);
      setStructureForm({ name: "", code: "", description: "", currency: "INR", payroll_cycle: "monthly", is_default: false });
    }
    setStructureDialogOpen(true);
  }

  async function handleSaveStructure() {
    setSavingStructure(true);
    try {
      if (editingStructure) {
        await salaryService.updateStructure(editingStructure.business_id, structureForm);
      } else {
        await salaryService.createStructure(structureForm);
      }
      toast({ title: editingStructure ? "Updated" : "Created", description: `Salary structure ${structureForm.name} saved`, variant: "success" });
      setStructureDialogOpen(false);
      loadStructures();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save structure";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingStructure(false);
    }
  }

  async function handleDeleteStructure(id: string) {
    if (!confirm("Delete this salary structure?")) return;
    try {
      await salaryService.deleteStructure(id);
      toast({ title: "Deleted", variant: "success" });
      loadStructures();
    } catch {
      toast({ title: "Error", description: "Failed to delete structure", variant: "destructive" });
    }
  }

  function toggleExpandStructure(id: string) {
    if (expandedStructure === id) {
      setExpandedStructure(null);
    } else {
      setExpandedStructure(id);
      loadComponents(id);
    }
  }

  function openComponentDialog(structureId: string) {
    setComponentForm({ name: "", code: "", component_type: "earning", calculation_type: "fixed", amount: 0, percentage: 0, is_taxable: true, is_mandatory: false, priority: 100, description: "" });
    setExpandedStructure(structureId);
    setComponentDialogOpen(true);
  }

  async function handleSaveComponent() {
    if (!expandedStructure) return;
    setSavingComponent(true);
    try {
      await salaryService.createComponent({ ...componentForm, salary_structure_id: expandedStructure });
      toast({ title: "Component Added", variant: "success" });
      setComponentDialogOpen(false);
      // Reload structures to get updated components
      await loadStructures();
      loadComponents(expandedStructure);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save component";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingComponent(false);
    }
  }

  async function handleDeleteComponent(id: string) {
    if (!confirm("Delete this component?")) return;
    try {
      await salaryService.deleteComponent(id);
      toast({ title: "Deleted", variant: "success" });
      // Reload structures to get updated components
      await loadStructures();
      if (expandedStructure) loadComponents(expandedStructure);
    } catch {
      toast({ title: "Error", description: "Failed to delete component", variant: "destructive" });
    }
  }

  const statusColors: Record<string, "warning" | "success" | "default" | "secondary"> = {
    draft: "warning", processing: "default", processed: "secondary", completed: "success", approved: "success",
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

      <Tabs defaultValue="runs" onValueChange={(v) => { if (v === "salary" && !salaryStructures.length) loadStructures(); }}>
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
                            {(run.status === "processing" || run.status === "processed" || run.status === "completed") && (
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

        <TabsContent value="salary" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Salary Structures</h3>
              <p className="text-sm text-muted-foreground">Define salary components and calculation rules</p>
            </div>
            <Button onClick={() => { openStructureDialog(); if (!salaryStructures.length) loadStructures(); }}>
              <Plus className="mr-2 h-4 w-4" />New Structure
            </Button>
          </div>

          {loadingStructures ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : salaryStructures.length > 0 ? (
            <div className="space-y-3">
              {salaryStructures.map((s) => (
                <Card key={s.business_id}>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleExpandStructure(s.business_id)}>
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.code || "—"} · {s.currency} · {s.payroll_cycle}</p>
                        </div>
                        {s.is_default && <Badge variant="secondary">Default</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openStructureDialog(s); }}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteStructure(s.business_id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>

                    {expandedStructure === s.business_id && (
                      <div className="border-t px-4 py-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium">Components</p>
                          <Button size="sm" variant="outline" onClick={() => openComponentDialog(s.business_id)}>
                            <Plus className="mr-1 h-3 w-3" />Add Component
                          </Button>
                        </div>
                        {loadingComponents ? (
                          <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                        ) : components.length > 0 ? (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="p-2 text-left font-medium">Name</th>
                                <th className="p-2 text-left font-medium">Code</th>
                                <th className="p-2 text-left font-medium">Type</th>
                                <th className="p-2 text-left font-medium">Calc</th>
                                <th className="p-2 text-right font-medium">Amount / %</th>
                                <th className="p-2 text-center font-medium">Taxable</th>
                                <th className="p-2 text-center font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {components.sort((a, b) => a.priority - b.priority).map((c) => (
                                <tr key={c.business_id} className="border-b last:border-0">
                                  <td className="p-2">{c.name}</td>
                                  <td className="p-2 font-mono text-xs">{c.code}</td>
                                  <td className="p-2"><Badge variant={c.component_type === "earning" ? "success" : c.component_type === "deduction" ? "destructive" : "secondary"}>{c.component_type}</Badge></td>
                                  <td className="p-2 text-xs">{c.calculation_type}</td>
                                  <td className="p-2 text-right">{c.calculation_type === "fixed" ? formatCurrency(c.amount || 0) : `${c.percentage || 0}%`}</td>
                                  <td className="p-2 text-center">{c.is_taxable ? "Yes" : "No"}</td>
                                  <td className="p-2 text-center">
                                    <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => handleDeleteComponent(c.business_id)}><Trash2 className="h-3 w-3" /></Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="py-3 text-center text-xs text-muted-foreground">No components defined. Click &quot;Add Component&quot; to begin.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <DollarSign className="mx-auto mb-2 h-8 w-8" />
                <p>No salary structures yet.</p>
                <p className="text-xs">Create a structure to define salary components like Basic, HRA, PF, etc.</p>
              </CardContent>
            </Card>
          )}
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
                  <th className="p-2 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((ps) => (
                  <tr key={ps.id} className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => viewPayslipDetail(ps)}>
                    <td className="p-2">{ps.employee_name || ps.employee_id}</td>
                    <td className="p-2 text-right">{formatCurrency(ps.basic_salary || 0)}</td>
                    <td className="p-2 text-right">{formatCurrency(ps.gross_salary || 0)}</td>
                    <td className="p-2 text-right">{formatCurrency(ps.total_deductions || 0)}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(ps.net_salary || 0)}</td>
                    <td className="p-2 text-center">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); viewPayslipDetail(ps); }}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-4 text-center text-muted-foreground">No payslips found for this run</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Payslip Detail Dialog - Company Template */}
      <Dialog open={payslipDetailOpen} onOpenChange={setPayslipDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : payslipDetail ? (
            <div className="space-y-0" id="payslip-template">
              {/* Company Header */}
              <div className="border-b-2 border-primary pb-4 text-center">
                {payslipDetail.company?.logo_url && (
                  <img src={payslipDetail.company.logo_url} alt="Logo" className="mx-auto mb-2 h-12" />
                )}
                <h2 className="text-xl font-bold text-primary">
                  {payslipDetail.company?.legal_name || payslipDetail.company?.name || "Company"}
                </h2>
                {payslipDetail.company?.address && (
                  <p className="text-xs text-muted-foreground">
                    {[payslipDetail.company.address, payslipDetail.company.city, payslipDetail.company.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {payslipDetail.company?.email && (
                  <p className="text-xs text-muted-foreground">{payslipDetail.company.email} | {payslipDetail.company.phone || ""}</p>
                )}
                <div className="mt-3 rounded-lg bg-primary/5 py-2">
                  <h3 className="text-lg font-semibold">Pay Slip</h3>
                  {payslipDetail.payroll_run && (
                    <p className="text-sm text-muted-foreground">
                      {monthNames[(payslipDetail.payroll_run.period_month || 1) - 1]} {payslipDetail.payroll_run.period_year}
                    </p>
                  )}
                </div>
              </div>

              {/* Employee Info */}
              {payslipDetail.employee && (
                <div className="grid grid-cols-2 gap-4 border-b py-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Employee Details</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-sm"><strong>Name:</strong> {payslipDetail.employee.full_name}</p>
                      <p className="text-sm"><strong>Code:</strong> {payslipDetail.employee.employee_code || "—"}</p>
                      <p className="text-sm"><strong>Email:</strong> {payslipDetail.employee.work_email || "—"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Position Details</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-sm"><strong>Department:</strong> {payslipDetail.employee.department_name || "—"}</p>
                      <p className="text-sm"><strong>Designation:</strong> {payslipDetail.employee.designation || "—"}</p>
                      <p className="text-sm"><strong>Join Date:</strong> {payslipDetail.employee.joining_date ? new Date(payslipDetail.employee.joining_date).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary Breakdown */}
              <div className="py-4 space-y-3">
                <h4 className="text-sm font-semibold">Salary Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <div className="border-b pb-2">
                    <p className="text-xs font-semibold text-green-700 mb-1">Earnings</p>
                    <div className="flex justify-between text-sm">
                      <span>Gross Salary</span>
                      <span className="font-medium">{formatCurrency(payslipDetail.payslip.gross_salary || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Allowances</span>
                      <span className="font-medium">{formatCurrency(payslipDetail.payslip.allowances || 0)}</span>
                    </div>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-xs font-semibold text-red-700 mb-1">Deductions</p>
                    <div className="flex justify-between text-sm">
                      <span>Deductions</span>
                      <span className="font-medium">{formatCurrency(payslipDetail.payslip.deductions || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span className="font-medium">{formatCurrency(payslipDetail.payslip.tax_amount || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Net Pay</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(payslipDetail.payslip.net_salary || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {payslipDetail.payslip.currency || "INR"} | Status: {payslipDetail.payslip.payment_status || "pending"}
                    {payslipDetail.payslip.payment_date && ` | Paid: ${new Date(payslipDetail.payslip.payment_date).toLocaleDateString()}`}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-3 text-center">
                <p className="text-xs text-muted-foreground">This is a computer-generated payslip and does not require a signature.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Payslip ID: {payslipDetail.payslip.business_id}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground space-y-3">
              <FileText className="mx-auto h-8 w-8 opacity-50" />
              <p className="font-medium">{payslipDetailError || "Failed to load payslip details"}</p>
              {lastPayslipItem && (
                <Button variant="outline" size="sm" onClick={() => viewPayslipDetail(lastPayslipItem)}>
                  <Loader2 className="mr-2 h-3 w-3" />Retry
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Salary Structure Dialog */}
      <Dialog open={structureDialogOpen} onOpenChange={setStructureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStructure ? "Edit" : "New"} Salary Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={structureForm.name} onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })} placeholder="e.g. India CTC Structure" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={structureForm.code} onChange={(e) => setStructureForm({ ...structureForm, code: e.target.value })} placeholder="e.g. IN-CTC" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={structureForm.currency} onValueChange={(v) => setStructureForm({ ...structureForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["INR", "USD", "GBP", "AED", "SGD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payroll Cycle</Label>
                <Select value={structureForm.payroll_cycle} onValueChange={(v) => setStructureForm({ ...structureForm, payroll_cycle: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input type="checkbox" id="is-default" checked={structureForm.is_default} onChange={(e) => setStructureForm({ ...structureForm, is_default: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="is-default">Default Structure</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={structureForm.description} onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStructureDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStructure} disabled={savingStructure || !structureForm.name}>
              {savingStructure && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingStructure ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Component Dialog */}
      <Dialog open={componentDialogOpen} onOpenChange={setComponentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Salary Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={componentForm.name} onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })} placeholder="e.g. Basic Salary" />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input value={componentForm.code} onChange={(e) => setComponentForm({ ...componentForm, code: e.target.value })} placeholder="e.g. BASIC" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Component Type</Label>
                <Select value={componentForm.component_type} onValueChange={(v) => setComponentForm({ ...componentForm, component_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Earning</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                    <SelectItem value="employer_contribution">Employer Contribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calculation Type</Label>
                <Select value={componentForm.calculation_type} onValueChange={(v) => setComponentForm({ ...componentForm, calculation_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage_of_basic">% of Basic</SelectItem>
                    <SelectItem value="percentage_of_ctc">% of CTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {componentForm.calculation_type === "fixed" ? (
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" min={0} value={componentForm.amount} onChange={(e) => setComponentForm({ ...componentForm, amount: parseFloat(e.target.value) || 0 })} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Percentage</Label>
                  <Input type="number" min={0} max={100} value={componentForm.percentage} onChange={(e) => setComponentForm({ ...componentForm, percentage: parseFloat(e.target.value) || 0 })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Priority (sort order)</Label>
                <Input type="number" min={1} value={componentForm.priority} onChange={(e) => setComponentForm({ ...componentForm, priority: parseInt(e.target.value) || 100 })} />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="comp-taxable" checked={componentForm.is_taxable} onChange={(e) => setComponentForm({ ...componentForm, is_taxable: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="comp-taxable">Taxable</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="comp-mandatory" checked={componentForm.is_mandatory} onChange={(e) => setComponentForm({ ...componentForm, is_mandatory: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="comp-mandatory">Mandatory</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComponentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveComponent} disabled={savingComponent || !componentForm.name || !componentForm.code}>
              {savingComponent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
