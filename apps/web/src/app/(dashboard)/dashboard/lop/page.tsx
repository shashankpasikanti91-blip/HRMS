"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  MinusCircle, CheckCircle2, Loader2, RefreshCw, Calculator,
  AlertCircle, Users, Download, Settings2, FileClock,
} from "lucide-react";
import { lopService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LOPRecord {
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
  approved_at?: string;
  notes?: string;
}

interface LOPOverride {
  business_id: string;
  employee_id: string;
  employee_name?: string;
  year: number;
  month: number;
  original_lop_days: number;
  adjusted_lop_days: number;
  reason: string;
  status: string;
  approved_at?: string;
}

interface LOPPolicy {
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const statusColors: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  approved: "success",
  pending: "warning",
  draft: "secondary",
  rejected: "destructive",
};

function fmt(n?: number | null, decimals = 2) {
  if (n == null) return "—";
  return Number(n).toFixed(decimals);
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LOPPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const role = user?.role || "employee";
  const isAdmin = ["super_admin", "company_admin", "hr_manager", "payroll_admin"].includes(role);
  const isPayroll = isAdmin || role === "finance";

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  // Records
  const [records, setRecords] = useState<LOPRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Overrides
  const [overrides, setOverrides] = useState<LOPOverride[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);

  // Policy
  const [policy, setPolicy] = useState<LOPPolicy | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState<LOPPolicy>({
    working_days_per_month: 26,
    use_calendar_days: false,
    late_grace_count: 3,
    lates_per_half_day: 3,
    apply_lop_on_absent: true,
    round_to_half_day: true,
    max_lop_days_per_month: undefined,
    description: "",
    is_active: true,
  });

  // Calculate dialog
  const [calcDialogOpen, setCalcDialogOpen] = useState(false);
  const [calcEmployeeId, setCalcEmployeeId] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [bulkCalculating, setBulkCalculating] = useState(false);

  // Override dialog
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    employee_id: "", year: now.getFullYear(), month: now.getMonth() + 1,
    original_lop_days: 0, adjusted_lop_days: 0, reason: "",
  });
  const [savingOverride, setSavingOverride] = useState(false);

  // Approve
  const [approving, setApproving] = useState<string | null>(null);

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const data = await lopService.listRecords({ year: filterYear, month: filterMonth, page_size: 100 });
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setRecords(rows);
    } catch {
      toast({ title: "Error", description: "Failed to load LOP records", variant: "destructive" });
    } finally {
      setLoadingRecords(false);
    }
  }, [filterYear, filterMonth, toast]);

  const loadOverrides = useCallback(async () => {
    setLoadingOverrides(true);
    try {
      const data = await lopService.listOverrides({ year: filterYear, month: filterMonth, page_size: 100 });
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setOverrides(rows);
    } catch {
      /* overrides may be empty */
    } finally {
      setLoadingOverrides(false);
    }
  }, [filterYear, filterMonth]);

  const loadPolicy = useCallback(async () => {
    setLoadingPolicy(true);
    try {
      const data = await lopService.getPolicy();
      setPolicy(data);
      setPolicyForm({
        working_days_per_month: data.working_days_per_month ?? 26,
        use_calendar_days: data.use_calendar_days ?? false,
        late_grace_count: data.late_grace_count ?? 3,
        lates_per_half_day: data.lates_per_half_day ?? 3,
        apply_lop_on_absent: data.apply_lop_on_absent ?? true,
        round_to_half_day: data.round_to_half_day ?? true,
        max_lop_days_per_month: data.max_lop_days_per_month,
        description: data.description ?? "",
        is_active: data.is_active ?? true,
      });
    } catch {
      /* policy may not exist yet */
    } finally {
      setLoadingPolicy(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    if (isPayroll) {
      loadOverrides();
      loadPolicy();
    }
  }, [loadRecords, loadOverrides, loadPolicy, isPayroll]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  async function handleCalculate() {
    if (!calcEmployeeId.trim()) {
      toast({ title: "Missing", description: "Enter an employee business ID", variant: "destructive" });
      return;
    }
    setCalculating(true);
    try {
      await lopService.calculateRecord(calcEmployeeId, filterYear, filterMonth);
      toast({ title: "Calculated", description: "LOP record calculated successfully", variant: "success" });
      setCalcDialogOpen(false);
      loadRecords();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Calculation failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  }

  async function handleBulkCalculate() {
    setBulkCalculating(true);
    try {
      const result = await lopService.bulkCalculate(filterYear, filterMonth);
      const count = result?.calculated ?? result?.count ?? "all";
      toast({ title: "Bulk Calculated", description: `LOP calculated for ${count} employees`, variant: "success" });
      loadRecords();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Bulk calculation failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBulkCalculating(false);
    }
  }

  async function handleApproveRecord(businessId: string) {
    setApproving(businessId);
    try {
      await lopService.approveRecord(businessId);
      toast({ title: "Approved", description: "LOP record approved", variant: "success" });
      loadRecords();
    } catch {
      toast({ title: "Error", description: "Failed to approve record", variant: "destructive" });
    } finally {
      setApproving(null);
    }
  }

  async function handleSavePolicy() {
    setSavingPolicy(true);
    try {
      await lopService.updatePolicy(policyForm);
      toast({ title: "Saved", description: "LOP policy updated successfully", variant: "success" });
      loadPolicy();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save policy";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingPolicy(false);
    }
  }

  async function handleCreateOverride() {
    if (!overrideForm.employee_id.trim() || !overrideForm.reason.trim()) {
      toast({ title: "Missing", description: "Employee ID and reason are required", variant: "destructive" });
      return;
    }
    setSavingOverride(true);
    try {
      await lopService.createOverride(overrideForm);
      toast({ title: "Override Created", description: "LOP override submitted for approval", variant: "success" });
      setOverrideDialogOpen(false);
      loadOverrides();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to create override";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingOverride(false);
    }
  }

  async function handleApproveOverride(businessId: string) {
    setApproving(businessId);
    try {
      await lopService.approveOverride(businessId);
      toast({ title: "Approved", description: "Override approved", variant: "success" });
      loadOverrides();
    } catch {
      toast({ title: "Error", description: "Failed to approve override", variant: "destructive" });
    } finally {
      setApproving(null);
    }
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  const totalLOPDays = records.reduce((s, r) => s + Number(r.final_lop_days || 0), 0);
  const totalLOPAmount = records.reduce((s, r) => s + Number(r.total_lop_amount || 0), 0);
  const pendingCount = records.filter((r) => r.status === "pending" || r.status === "draft").length;
  const approvedCount = records.filter((r) => r.status === "approved").length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loss of Pay (LOP)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage monthly LOP calculations, overrides, and policy.
          </p>
        </div>
        {isPayroll && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCalcDialogOpen(true)}>
              <Calculator className="mr-2 h-4 w-4" />
              Calculate
            </Button>
            <Button
              size="sm"
              onClick={handleBulkCalculate}
              disabled={bulkCalculating}
            >
              {bulkCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Bulk Calculate
            </Button>
          </div>
        )}
      </div>

      {/* Month / Year filter */}
      <div className="flex items-center gap-3">
        <Select value={String(filterMonth)} onValueChange={(v) => setFilterMonth(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => { loadRecords(); if (isPayroll) loadOverrides(); }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <MinusCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total LOP Days</p>
                <p className="text-2xl font-bold">{fmt(totalLOPDays, 1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <Download className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total LOP Amount</p>
                <p className="text-2xl font-bold">₹{Math.round(totalLOPAmount).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">
            <FileClock className="mr-2 h-4 w-4" />
            Records
          </TabsTrigger>
          {isPayroll && (
            <TabsTrigger value="overrides">
              <RefreshCw className="mr-2 h-4 w-4" />
              Overrides
            </TabsTrigger>
          )}
          {isPayroll && (
            <TabsTrigger value="policy">
              <Settings2 className="mr-2 h-4 w-4" />
              Policy
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Records Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">LOP Records — {MONTHS[filterMonth - 1]} {filterYear}</CardTitle>
              <CardDescription>
                Per-employee LOP calculation for the selected month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecords ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                  <MinusCircle className="h-10 w-10 mb-3 opacity-30" />
                  <p className="font-medium">No LOP records for this period</p>
                  {isPayroll && (
                    <p className="text-sm mt-1">Use &ldquo;Bulk Calculate&rdquo; to generate records for all employees.</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                        <th className="text-left py-2 pr-4 font-medium">Employee</th>
                        <th className="text-right py-2 pr-4 font-medium">Present</th>
                        <th className="text-right py-2 pr-4 font-medium">Absent</th>
                        <th className="text-right py-2 pr-4 font-medium">Late</th>
                        <th className="text-right py-2 pr-4 font-medium">LOP Days</th>
                        <th className="text-right py-2 pr-4 font-medium">LOP Amount</th>
                        <th className="text-left py-2 pr-4 font-medium">Status</th>
                        {isPayroll && <th className="py-2 font-medium">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.business_id} className="border-b hover:bg-muted/40 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="font-medium">{r.employee_name || r.employee_id}</div>
                            {r.employee_code && (
                              <div className="text-xs text-muted-foreground">{r.employee_code}</div>
                            )}
                          </td>
                          <td className="text-right py-3 pr-4">{r.days_present}</td>
                          <td className="text-right py-3 pr-4">{r.days_absent}</td>
                          <td className="text-right py-3 pr-4">{r.late_count}</td>
                          <td className="text-right py-3 pr-4 font-semibold text-orange-600">
                            {fmt(r.final_lop_days, 1)}
                          </td>
                          <td className="text-right py-3 pr-4">
                            {r.total_lop_amount != null
                              ? `₹${Number(r.total_lop_amount).toLocaleString("en-IN")}`
                              : "—"}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={statusColors[r.status] ?? "secondary"}>
                              {r.status}
                            </Badge>
                          </td>
                          {isPayroll && (
                            <td className="py-3">
                              {r.status !== "approved" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  disabled={approving === r.business_id}
                                  onClick={() => handleApproveRecord(r.business_id)}
                                >
                                  {approving === r.business_id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <CheckCircle2 className="h-4 w-4" />}
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

        {/* ── Overrides Tab ───────────────────────────────────────────────── */}
        {isPayroll && (
          <TabsContent value="overrides" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">LOP Overrides</CardTitle>
                  <CardDescription>Manual adjustments to computed LOP days requiring approval.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setOverrideDialogOpen(true)}>
                  Create Override
                </Button>
              </CardHeader>
              <CardContent>
                {loadingOverrides ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : overrides.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                    <RefreshCw className="h-8 w-8 mb-2 opacity-30" />
                    <p>No overrides for this period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                          <th className="text-left py-2 pr-4 font-medium">Employee</th>
                          <th className="text-right py-2 pr-4 font-medium">Original Days</th>
                          <th className="text-right py-2 pr-4 font-medium">Adjusted Days</th>
                          <th className="text-left py-2 pr-4 font-medium">Reason</th>
                          <th className="text-left py-2 pr-4 font-medium">Status</th>
                          <th className="py-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overrides.map((o) => (
                          <tr key={o.business_id} className="border-b hover:bg-muted/40 transition-colors">
                            <td className="py-3 pr-4 font-medium">{o.employee_name || o.employee_id}</td>
                            <td className="text-right py-3 pr-4">{fmt(o.original_lop_days, 1)}</td>
                            <td className="text-right py-3 pr-4 font-semibold text-blue-600">{fmt(o.adjusted_lop_days, 1)}</td>
                            <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">{o.reason}</td>
                            <td className="py-3 pr-4">
                              <Badge variant={statusColors[o.status] ?? "secondary"}>{o.status}</Badge>
                            </td>
                            <td className="py-3">
                              {o.status !== "approved" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  disabled={approving === o.business_id}
                                  onClick={() => handleApproveOverride(o.business_id)}
                                >
                                  {approving === o.business_id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <CheckCircle2 className="h-4 w-4" />}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Policy Tab ──────────────────────────────────────────────────── */}
        {isPayroll && (
          <TabsContent value="policy" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">LOP Policy</CardTitle>
                <CardDescription>Configure how Loss of Pay is computed for your organization.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPolicy ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Working Days / Month</Label>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={policyForm.working_days_per_month}
                          onChange={(e) => setPolicyForm({ ...policyForm, working_days_per_month: Number(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">Used to compute per-day salary (default: 26)</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Max LOP Days / Month</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="No cap"
                          value={policyForm.max_lop_days_per_month ?? ""}
                          onChange={(e) => setPolicyForm({
                            ...policyForm,
                            max_lop_days_per_month: e.target.value ? Number(e.target.value) : undefined,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Late Grace Count</Label>
                        <Input
                          type="number"
                          min={0}
                          value={policyForm.late_grace_count}
                          onChange={(e) => setPolicyForm({ ...policyForm, late_grace_count: Number(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">Lates before LOP starts</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Lates per Half-Day LOP</Label>
                        <Input
                          type="number"
                          min={1}
                          value={policyForm.lates_per_half_day}
                          onChange={(e) => setPolicyForm({ ...policyForm, lates_per_half_day: Number(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">N additional lates = 0.5 LOP day</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium text-sm">Use Calendar Days</p>
                          <p className="text-xs text-muted-foreground">Use calendar days instead of working days for LOP period</p>
                        </div>
                        <Switch
                          checked={policyForm.use_calendar_days}
                          onCheckedChange={(v) => setPolicyForm({ ...policyForm, use_calendar_days: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium text-sm">Apply LOP on Unauthorised Absence</p>
                          <p className="text-xs text-muted-foreground">Absent without approved leave = 1 full LOP day</p>
                        </div>
                        <Switch
                          checked={policyForm.apply_lop_on_absent}
                          onCheckedChange={(v) => setPolicyForm({ ...policyForm, apply_lop_on_absent: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium text-sm">Round to Half-Day</p>
                          <p className="text-xs text-muted-foreground">Round final LOP days to nearest 0.5</p>
                        </div>
                        <Switch
                          checked={policyForm.round_to_half_day}
                          onCheckedChange={(v) => setPolicyForm({ ...policyForm, round_to_half_day: v })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description / Notes</Label>
                      <Textarea
                        value={policyForm.description ?? ""}
                        onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                        rows={2}
                        placeholder="Internal notes about this policy..."
                      />
                    </div>

                    <div className="pt-2">
                      <Button onClick={handleSavePolicy} disabled={savingPolicy}>
                        {savingPolicy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Policy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ── Calculate Dialog ───────────────────────────────────────────────── */}
      <Dialog open={calcDialogOpen} onOpenChange={setCalcDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculate LOP for Employee</DialogTitle>
            <DialogDescription>
              Compute LOP for a specific employee for {MONTHS[filterMonth - 1]} {filterYear}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Employee Business ID</Label>
              <Input
                placeholder="e.g. EMP-2024-0001"
                value={calcEmployeeId}
                onChange={(e) => setCalcEmployeeId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For the selected period: {MONTHS[filterMonth - 1]} {filterYear}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalcDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCalculate} disabled={calculating}>
              {calculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Calculate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Override Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create LOP Override</DialogTitle>
            <DialogDescription>
              Manually adjust an employee&apos;s LOP days. Requires approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Employee Business ID *</Label>
              <Input
                value={overrideForm.employee_id}
                onChange={(e) => setOverrideForm({ ...overrideForm, employee_id: e.target.value })}
                placeholder="e.g. EMP-2024-0001"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select
                  value={String(overrideForm.month)}
                  onValueChange={(v) => setOverrideForm({ ...overrideForm, month: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={overrideForm.year}
                  onChange={(e) => setOverrideForm({ ...overrideForm, year: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Original LOP Days</Label>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={overrideForm.original_lop_days}
                  onChange={(e) => setOverrideForm({ ...overrideForm, original_lop_days: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Adjusted LOP Days *</Label>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={overrideForm.adjusted_lop_days}
                  onChange={(e) => setOverrideForm({ ...overrideForm, adjusted_lop_days: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                placeholder="Explain why the LOP days are being adjusted..."
                rows={3}
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
