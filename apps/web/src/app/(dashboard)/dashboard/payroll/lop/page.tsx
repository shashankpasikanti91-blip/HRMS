"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Loader2, RefreshCw, CheckCircle2, Clock, Settings,
  AlertTriangle, ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import { lopService, employeeService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LOPPolicy {
  id: string;
  business_id: string;
  working_days_per_month: number;
  use_calendar_days: boolean;
  late_grace_count: number;
  lates_per_half_day: number;
  apply_lop_on_absent: boolean;
  round_to_half_day: boolean;
  max_lop_days_per_month?: number;
  description?: string;
  is_active: boolean;
}

interface LOPRecord {
  id: string;
  business_id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  year: number;
  month: number;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  days_on_approved_leave: number;
  late_count: number;
  lop_from_absence: number;
  lop_from_lates: number;
  total_lop_days: number;
  final_lop_days: number;
  per_day_amount?: number;
  total_lop_amount?: number;
  currency: string;
  status: string;
  approved_by?: string;
  notes?: string;
  override_id?: string;
}

interface LOPOverride {
  id: string;
  business_id: string;
  employee_id: string;
  employee_name?: string;
  year: number;
  month: number;
  original_lop_days: number;
  adjusted_lop_days: number;
  reason: string;
  status: string;
  approved_by?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  draft: "secondary",
  reviewed: "default",
  approved: "success",
  applied: "success",
  pending: "warning",
  rejected: "destructive",
};

export default function LOPPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const canManage = ["super_admin", "company_admin", "hr_manager"].includes(user?.role || "");

  const [tab, setTab] = useState("records");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // Policy
  const [policy, setPolicy] = useState<LOPPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyForm, setPolicyForm] = useState<Partial<LOPPolicy>>({});
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Records
  const [records, setRecords] = useState<LOPRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [bulkCalculating, setBulkCalculating] = useState(false);

  // Overrides
  const [overrides, setOverrides] = useState<LOPOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LOPRecord | null>(null);
  const [overrideForm, setOverrideForm] = useState({ adjusted_lop_days: 0, reason: "" });
  const [savingOverride, setSavingOverride] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const data = await lopService.getPolicy();
      setPolicy(data);
      setPolicyForm(data);
    } catch {
      // Policy may not exist yet; it will be created on first save
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const data = await lopService.listRecords({ year, month, page_size: 200 });
      setRecords(data.data || data);
    } catch {
      toast({ title: "Error", description: "Failed to load LOP records", variant: "destructive" });
    } finally {
      setRecordsLoading(false);
    }
  }, [year, month, toast]);

  const loadOverrides = useCallback(async () => {
    setOverridesLoading(true);
    try {
      const data = await lopService.listOverrides({ year, month, page_size: 200 });
      setOverrides(data.data || data);
    } catch {
      toast({ title: "Error", description: "Failed to load LOP overrides", variant: "destructive" });
    } finally {
      setOverridesLoading(false);
    }
  }, [year, month, toast]);

  useEffect(() => { loadPolicy(); }, [loadPolicy]);
  useEffect(() => {
    if (tab === "records") loadRecords();
    if (tab === "overrides") loadOverrides();
  }, [tab, year, month, loadRecords, loadOverrides]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function savePolicy() {
    setSavingPolicy(true);
    try {
      const data = await lopService.updatePolicy(policyForm as Record<string, unknown>);
      setPolicy(data);
      setPolicyForm(data);
      toast({ title: "Policy saved", description: "LOP policy updated successfully.", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to save LOP policy", variant: "destructive" });
    } finally {
      setSavingPolicy(false);
    }
  }

  async function handleBulkCalculate() {
    setBulkCalculating(true);
    try {
      const results = await lopService.bulkCalculate(year, month, false);
      toast({ title: "Calculated", description: `LOP calculated for ${Array.isArray(results) ? results.length : 0} employees.`, variant: "success" });
      loadRecords();
    } catch {
      toast({ title: "Error", description: "Bulk calculation failed", variant: "destructive" });
    } finally {
      setBulkCalculating(false);
    }
  }

  async function handleApproveRecord(businessId: string) {
    try {
      await lopService.approveRecord(businessId);
      toast({ title: "Approved", description: "LOP record approved successfully.", variant: "success" });
      loadRecords();
    } catch {
      toast({ title: "Error", description: "Failed to approve LOP record", variant: "destructive" });
    }
  }

  async function handleCreateOverride() {
    if (!selectedRecord) return;
    if (!overrideForm.reason.trim()) {
      toast({ title: "Validation Error", description: "Reason is required", variant: "destructive" });
      return;
    }
    setSavingOverride(true);
    try {
      await lopService.createOverride({
        employee_id: selectedRecord.employee_id,
        year,
        month,
        original_lop_days: selectedRecord.final_lop_days,
        adjusted_lop_days: overrideForm.adjusted_lop_days,
        reason: overrideForm.reason,
      });
      toast({ title: "Override created", description: "LOP override submitted for approval.", variant: "success" });
      setOverrideDialogOpen(false);
      setOverrideForm({ adjusted_lop_days: 0, reason: "" });
      loadRecords();
      loadOverrides();
    } catch {
      toast({ title: "Error", description: "Failed to create override", variant: "destructive" });
    } finally {
      setSavingOverride(false);
    }
  }

  async function handleApproveOverride(businessId: string) {
    try {
      await lopService.approveOverride(businessId);
      toast({ title: "Override approved", description: "LOP adjusted per override.", variant: "success" });
      loadOverrides();
      loadRecords();
    } catch {
      toast({ title: "Error", description: "Failed to approve override", variant: "destructive" });
    }
  }

  function handleExportRecords() {
    const csv = ["Employee,Code,Present Days,Absent,Approved Leave,Lates,LOP (Absence),LOP (Lates),Total LOP,Final LOP,Status"]
      .concat(records.map((r) =>
        `"${r.employee_name || ""}","${r.employee_code || ""}",${r.days_present},${r.days_absent},${r.days_on_approved_leave},${r.late_count},${r.lop_from_absence},${r.lop_from_lates},${r.total_lop_days},${r.final_lop_days},${r.status}`
      ))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lop-${MONTHS[month - 1]}-${year}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/payroll")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Loss of Pay (LOP)</h1>
          <p className="text-muted-foreground text-sm">Manage LOP policy, calculate deductions, and handle overrides</p>
        </div>
      </div>

      {/* Month/Year navigation */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              if (month === 1) { setMonth(12); setYear(y => y - 1); }
              else setMonth(m => m - 1);
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[180px] text-center text-lg">
              {MONTHS[month - 1]} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={() => {
              if (month === 12) { setMonth(1); setYear(y => y + 1); }
              else setMonth(m => m + 1);
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-auto flex gap-2">
              {canManage && tab === "records" && (
                <Button variant="outline" size="sm" onClick={handleExportRecords} disabled={records.length === 0}>
                  <Download className="mr-2 h-4 w-4" />Export CSV
                </Button>
              )}
              {canManage && tab === "records" && (
                <Button size="sm" onClick={handleBulkCalculate} disabled={bulkCalculating}>
                  {bulkCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Calculate All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="records">Monthly Records</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
          <TabsTrigger value="policy"><Settings className="mr-1.5 h-4 w-4" />Policy</TabsTrigger>
        </TabsList>

        {/* ── Records Tab ──────────────────────────────────────────────── */}
        <TabsContent value="records" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {recordsLoading ? (
                <div className="flex items-center justify-center p-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No LOP records for {MONTHS[month - 1]} {year}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Run bulk calculation to generate LOP records for all active employees.
                  </p>
                  {canManage && (
                    <Button onClick={handleBulkCalculate} disabled={bulkCalculating}>
                      {bulkCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <RefreshCw className="mr-2 h-4 w-4" />Calculate All
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-4 text-left text-xs font-semibold uppercase text-muted-foreground">Employee</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">Present</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">Absent</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">Leave</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">Lates</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">LOP Days</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">Status</th>
                        {canManage && <th className="p-4 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-medium">{r.employee_name || "—"}</p>
                              {r.employee_code && (
                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{r.employee_code}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center text-sm text-green-600 font-medium">{r.days_present}</td>
                          <td className="p-4 text-center text-sm text-destructive font-medium">{r.days_absent}</td>
                          <td className="p-4 text-center text-sm text-muted-foreground">{r.days_on_approved_leave}</td>
                          <td className="p-4 text-center text-sm text-orange-600">{r.late_count}</td>
                          <td className="p-4 text-center">
                            <span className={`text-sm font-bold ${Number(r.final_lop_days) > 0 ? "text-destructive" : "text-green-600"}`}>
                              {Number(r.final_lop_days).toFixed(1)}
                            </span>
                            {r.override_id && (
                              <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">adj</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={statusColors[r.status] || "secondary"}>
                              {r.status}
                            </Badge>
                          </td>
                          {canManage && (
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1">
                                {(r.status === "draft" || r.status === "reviewed") && (
                                  <Button size="sm" variant="outline" onClick={() => handleApproveRecord(r.business_id)}>
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Approve
                                  </Button>
                                )}
                                {r.status !== "applied" && (
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setSelectedRecord(r);
                                    setOverrideForm({ adjusted_lop_days: Number(r.final_lop_days), reason: "" });
                                    setOverrideDialogOpen(true);
                                  }}>
                                    Override
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            {!recordsLoading && records.length > 0 && (
              <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                {records.length} employee record{records.length !== 1 ? "s" : ""} · {records.filter(r => r.status === "approved").length} approved · {records.filter(r => Number(r.final_lop_days) > 0).length} with LOP deductions
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Overrides Tab ─────────────────────────────────────────────── */}
        <TabsContent value="overrides" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {overridesLoading ? (
                <div className="flex items-center justify-center p-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : overrides.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No overrides for {MONTHS[month - 1]} {year}</h3>
                  <p className="text-sm text-muted-foreground">Overrides are created from the Monthly Records tab.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-4 text-left text-xs font-semibold uppercase text-muted-foreground">Employee</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">Original LOP</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">Adjusted LOP</th>
                        <th className="p-4 text-left text-xs font-semibold uppercase text-muted-foreground">Reason</th>
                        <th className="p-4 text-center text-xs font-semibold uppercase text-muted-foreground">Status</th>
                        {canManage && <th className="p-4 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {overrides.map((o) => (
                        <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-4 text-sm font-medium">{o.employee_name || "—"}</td>
                          <td className="p-4 text-center text-sm text-destructive font-medium">{Number(o.original_lop_days).toFixed(1)}</td>
                          <td className="p-4 text-center text-sm text-green-600 font-medium">{Number(o.adjusted_lop_days).toFixed(1)}</td>
                          <td className="p-4 text-sm text-muted-foreground max-w-[300px] truncate">{o.reason}</td>
                          <td className="p-4 text-center">
                            <Badge variant={statusColors[o.status] || "secondary"}>{o.status}</Badge>
                          </td>
                          {canManage && (
                            <td className="p-4 text-right">
                              {o.status === "pending" && (
                                <Button size="sm" variant="outline" onClick={() => handleApproveOverride(o.business_id)}>
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Approve
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Policy Tab ────────────────────────────────────────────────── */}
        <TabsContent value="policy" className="mt-4">
          {policyLoading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>LOP Calculation Rules</CardTitle>
                  <CardDescription>Define how Loss of Pay days are calculated each month.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="wdpm">Working Days / Month</Label>
                      <Input
                        id="wdpm"
                        type="number"
                        min={1} max={31}
                        value={policyForm.working_days_per_month ?? 26}
                        onChange={(e) => setPolicyForm({ ...policyForm, working_days_per_month: Number(e.target.value) })}
                        disabled={!canManage}
                      />
                      <p className="text-xs text-muted-foreground">Used to calculate per-day salary (e.g. 26 = MYR industry standard)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxlop">Max LOP Days / Month</Label>
                      <Input
                        id="maxlop"
                        type="number"
                        min={0}
                        placeholder="No cap"
                        value={policyForm.max_lop_days_per_month ?? ""}
                        onChange={(e) => setPolicyForm({ ...policyForm, max_lop_days_per_month: e.target.value ? Number(e.target.value) : undefined })}
                        disabled={!canManage}
                      />
                      <p className="text-xs text-muted-foreground">Leave blank for no maximum cap on LOP days</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-y">
                    <div>
                      <p className="text-sm font-medium">Apply LOP on Unauthorised Absence</p>
                      <p className="text-xs text-muted-foreground">Absent without approved leave = full LOP day</p>
                    </div>
                    <Switch
                      checked={policyForm.apply_lop_on_absent ?? true}
                      onCheckedChange={(v) => setPolicyForm({ ...policyForm, apply_lop_on_absent: v })}
                      disabled={!canManage}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="text-sm font-medium">Round LOP to Half-Day</p>
                      <p className="text-xs text-muted-foreground">Round final LOP days to nearest 0.5</p>
                    </div>
                    <Switch
                      checked={policyForm.round_to_half_day ?? true}
                      onCheckedChange={(v) => setPolicyForm({ ...policyForm, round_to_half_day: v })}
                      disabled={!canManage}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Late Arrival Rules</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grace">Monthly Grace Count</Label>
                        <Input
                          id="grace"
                          type="number"
                          min={0}
                          value={policyForm.late_grace_count ?? 3}
                          onChange={(e) => setPolicyForm({ ...policyForm, late_grace_count: Number(e.target.value) })}
                          disabled={!canManage}
                        />
                        <p className="text-xs text-muted-foreground">Lates allowed before LOP is triggered</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lph">Lates per Half-Day Deduction</Label>
                        <Input
                          id="lph"
                          type="number"
                          min={1}
                          value={policyForm.lates_per_half_day ?? 3}
                          onChange={(e) => setPolicyForm({ ...policyForm, lates_per_half_day: Number(e.target.value) })}
                          disabled={!canManage}
                        />
                        <p className="text-xs text-muted-foreground">Every N excess lates = 0.5 LOP day</p>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <Button onClick={savePolicy} disabled={savingPolicy}>
                      {savingPolicy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Policy
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Example calculation */}
              <Card>
                <CardHeader>
                  <CardTitle>How It Calculates</CardTitle>
                  <CardDescription>Example: Employee with 3 absences and 5 lates (grace = 3, lates_per_half_day = 3)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Absent without approved leave</span>
                    <span className="font-medium">3 days → 3.0 LOP</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Excess lates (5 − 3 grace = 2 excess)</span>
                    <span className="font-medium">2 ÷ 3 = 0 sets → 0.0 LOP</span>
                  </div>
                  <div className="flex justify-between py-1 font-semibold">
                    <span>Total LOP days</span>
                    <span className="text-destructive">3.0 days</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    Per-day deduction = CTC ÷ {policyForm.working_days_per_month ?? 26} working days
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create LOP Override</DialogTitle>
            <DialogDescription>
              Adjust the LOP days for <strong>{selectedRecord?.employee_name}</strong> for {MONTHS[month - 1]} {year}.
              This will require HR approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">System Calculated LOP</span>
              <span className="font-bold text-destructive">{Number(selectedRecord?.final_lop_days || 0).toFixed(1)} days</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjlop">Adjusted LOP Days</Label>
              <Input
                id="adjlop"
                type="number"
                min={0}
                step={0.5}
                value={overrideForm.adjusted_lop_days}
                onChange={(e) => setOverrideForm({ ...overrideForm, adjusted_lop_days: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Override *</Label>
              <textarea
                id="reason"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Explain why LOP is being adjusted..."
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOverride} disabled={savingOverride}>
              {savingOverride && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
