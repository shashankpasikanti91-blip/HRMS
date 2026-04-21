"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Loader2, Umbrella, CheckCircle2, XCircle,
  Clock, Calendar, Filter, Users,
} from "lucide-react";
import { leaveService, employeeService, policyService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { LeaveRequest } from "@/types";

const statusColors: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  approved: "success",
  rejected: "destructive",
  pending: "warning",
  cancelled: "secondary",
};

const LEAVE_TYPES = [
  { value: "casual", label: "Casual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "annual", label: "Annual Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "other", label: "Other" },
];

export default function LeavePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const role = user?.role || "employee";
  const isAdmin = ["super_admin", "company_admin", "hr_manager"].includes(role);
  const isManager = isAdmin || role === "team_manager";

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("my-leaves");

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leave_type: "casual",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [applySubmitting, setApplySubmitting] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  type LeaveBalance = { leave_type_name: string; annual_quota: number; used_days: number; remaining_days: number };
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const loadBalances = useCallback(async () => {
    setLoadingBalances(true);
    try {
      const emp = await employeeService.getMe();
      if (emp?.business_id) {
        const balances = await policyService.getEmployeeLeaveBalances(emp.business_id);
        if (Array.isArray(balances)) setLeaveBalances(balances);
      }
    } catch {
      // leave balances may not be configured
    } finally {
      setLoadingBalances(false);
    }
  }, []);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const data = isAdmin && activeTab === "team-leaves"
        ? await leaveService.getRequests({ status: statusFilter !== "all" ? statusFilter : undefined })
        : await leaveService.getMyLeaves({ status: statusFilter !== "all" ? statusFilter : undefined });
      setLeaves(data);
    } catch {
      toast({ title: "Could not load leave requests", description: "Please refresh the page.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, isAdmin, toast]);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);
  useEffect(() => { loadBalances(); }, [loadBalances]);

  const filtered = leaves.filter((l) => {
    const matchSearch = search
      ? `${l.employee_name ?? ""} ${l.employee_code ?? ""} ${l.leave_type}`.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  async function handleApply() {
    if (!applyForm.start_date || !applyForm.end_date) {
      toast({ title: "Validation Error", description: "Start and end dates are required.", variant: "destructive" });
      return;
    }
    if (applyForm.end_date < applyForm.start_date) {
      toast({ title: "Validation Error", description: "End date cannot be before start date.", variant: "destructive" });
      return;
    }
    setApplySubmitting(true);
    try {
      await leaveService.apply(applyForm);
      toast({ title: "Leave Request Submitted", description: "Your leave request is pending approval.", variant: "success" });
      setApplyOpen(false);
      setApplyForm({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
      loadLeaves();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      const msg = axErr?.response?.data?.detail || "Failed to submit leave request.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setApplySubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await leaveService.approve(id);
      toast({ title: "Leave Approved", variant: "success" });
      loadLeaves();
    } catch {
      toast({ title: "Error", description: "Failed to approve leave.", variant: "destructive" });
    }
  }

  async function handleReject() {
    if (!rejectingId) return;
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    try {
      await leaveService.reject(rejectingId, rejectReason);
      toast({ title: "Leave Rejected" });
      setRejectOpen(false);
      setRejectingId(null);
      setRejectReason("");
      loadLeaves();
    } catch {
      toast({ title: "Error", description: "Failed to reject leave.", variant: "destructive" });
    }
  }

  function openReject(id: string) {
    setRejectingId(id);
    setRejectReason("");
    setRejectOpen(true);
  }

  const daysBetween = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave</h1>
          <p className="text-muted-foreground">Manage leave requests and approvals</p>
        </div>
        <Button onClick={() => setApplyOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Apply for Leave
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.all, icon: Calendar, color: "text-blue-600" },
          { label: "Pending", value: counts.pending, icon: Clock, color: "text-yellow-600" },
          { label: "Approved", value: counts.approved, icon: CheckCircle2, color: "text-green-600" },
          { label: "Rejected", value: counts.rejected, icon: XCircle, color: "text-red-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave Balance Cards */}
      {!loadingBalances && leaveBalances.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Umbrella className="h-4 w-4" />Leave Balance
            </CardTitle>
            <CardDescription>Remaining days available for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {leaveBalances.map((b) => {
                const pct = b.annual_quota > 0 ? Math.min(100, Math.round((b.used_days / b.annual_quota) * 100)) : 0;
                const color = b.remaining_days <= 0 ? "bg-destructive" : b.remaining_days <= 2 ? "bg-yellow-500" : "bg-primary";
                return (
                  <div key={b.leave_type_name} className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-medium capitalize">{b.leave_type_name.replace(/_/g, " ")}</p>
                    <p className="text-2xl font-bold">{b.remaining_days}<span className="text-xs text-muted-foreground font-normal ml-1">days left</span></p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{b.used_days} used / {b.annual_quota} total</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs (admin shows team view too) */}
      {isManager && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-leaves">
              <Umbrella className="mr-2 h-4 w-4" />My Leaves
            </TabsTrigger>
            <TabsTrigger value="team-leaves">
              <Users className="mr-2 h-4 w-4" />Team Leaves
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or type..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leave Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Umbrella className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                {search || statusFilter !== "all" ? "No leave requests match your filters" : "No leave requests yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filter."
                  : "Apply for leave when you need time off."}
              </p>
              {!search && statusFilter === "all" && (
                <Button onClick={() => setApplyOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Apply for Leave
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {isManager && activeTab === "team-leaves" && (
                      <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee</th>
                    )}
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Days</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                    {isManager && activeTab === "team-leaves" && (
                      <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((leave) => (
                    <tr key={leave.id} className="border-b last:border-0 hover:bg-muted/20">
                      {isManager && activeTab === "team-leaves" && (
                        <td className="p-4">
                          <p className="text-sm font-medium">{leave.employee_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{leave.employee_code || ""}</p>
                        </td>
                      )}
                      <td className="p-4">
                        <span className="text-sm font-medium capitalize">
                          {leave.leave_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(leave.start_date)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(leave.end_date)}</td>
                      <td className="p-4 text-sm">
                        <span className="font-mono font-medium">
                          {leave.total_days ?? daysBetween(leave.start_date, leave.end_date)}d
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                        {leave.reason || "—"}
                      </td>
                      <td className="p-4">
                        <Badge variant={statusColors[leave.status] || "secondary"}>
                          {leave.status}
                        </Badge>
                        {leave.rejection_reason && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {leave.rejection_reason}
                          </p>
                        )}
                      </td>
                      {isManager && activeTab === "team-leaves" && (
                        <td className="p-4 text-right">
                          {leave.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(leave.business_id)}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => openReject(leave.business_id)}>
                                <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                              </Button>
                            </div>
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
        {!loading && filtered.length > 0 && (
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {leaves.length} request{leaves.length !== 1 ? "s" : ""}
          </div>
        )}
      </Card>

      {/* Apply Leave Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a leave request for manager approval.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={applyForm.leave_type} onValueChange={(v) => setApplyForm({ ...applyForm, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date *</Label>
                <Input
                  id="start"
                  type="date"
                  value={applyForm.start_date}
                  onChange={(e) => setApplyForm({ ...applyForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Date *</Label>
                <Input
                  id="end"
                  type="date"
                  min={applyForm.start_date}
                  value={applyForm.end_date}
                  onChange={(e) => setApplyForm({ ...applyForm, end_date: e.target.value })}
                />
              </div>
            </div>
            {applyForm.start_date && applyForm.end_date && applyForm.end_date >= applyForm.start_date && (
              <p className="text-sm text-muted-foreground">
                Duration: <span className="font-medium text-foreground">{daysBetween(applyForm.start_date, applyForm.end_date)} day(s)</span>
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Optional — briefly describe the reason for your leave"
                value={applyForm.reason}
                onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={applySubmitting}>
              {applySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>Provide a reason so the employee understands the decision.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="rejectReason">Reason *</Label>
            <Textarea
              id="rejectReason"
              placeholder="e.g. Insufficient staffing during requested period"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
