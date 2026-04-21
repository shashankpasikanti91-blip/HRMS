"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target, Star, TrendingUp, Award, Plus, Loader2, Edit, Search,
  CheckCircle2, Clock, AlertCircle, Users,
} from "lucide-react";
import { performanceService, employeeService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { PerformanceReview, EmployeeSummary } from "@/types";

const REVIEW_PERIODS = [
  { value: "q1", label: "Q1 (Jan-Mar)" },
  { value: "q2", label: "Q2 (Apr-Jun)" },
  { value: "q3", label: "Q3 (Jul-Sep)" },
  { value: "q4", label: "Q4 (Oct-Dec)" },
  { value: "annual", label: "Annual" },
  { value: "probation", label: "Probation" },
];

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "warning" },
  submitted: { label: "Submitted", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function ScoreBar({ label, value }: { label: string; value?: number | null }) {
  const pct = value != null ? Math.min(100, Math.round((value / 5) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value != null ? `${value} / 5` : "—"}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StarRating({ value }: { value?: number | null }) {
  const stars = Math.round(value ?? 0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function PerformancePage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const role = user?.role || "employee";
  const isAdmin = ["super_admin", "company_admin", "hr_manager"].includes(role);
  const isManager = isAdmin || role === "team_manager";

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PerformanceReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    review_period: "annual",
    review_year: new Date().getFullYear(),
    goal_score: "",
    behavior_score: "",
    comments: "",
    employee_self_review: "",
    status: "draft",
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsResult, empsResult] = await Promise.allSettled([
        performanceService.listReviews({ page_size: 200 }),
        (isAdmin || isManager) ? employeeService.list({ page_size: 200 }) : Promise.resolve(null),
      ]);
      if (reviewsResult.status === "fulfilled") {
        const page = reviewsResult.value;
        setReviews(page.data ?? []);
      }
      if (empsResult.status === "fulfilled" && empsResult.value) {
        const page = empsResult.value as { data?: EmployeeSummary[] };
        setEmployees(page.data ?? []);
      }
    } catch {
      // per-request handled above
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isManager]);

  useEffect(() => { loadData(); }, [loadData]);

  const completedReviews = reviews.filter((r) => r.status === "completed");
  const pendingReviews = reviews.filter((r) => ["draft","in_progress","submitted"].includes(r.status)).length;
  const avgOverall = completedReviews.length > 0
    ? (completedReviews.reduce((sum, r) => sum + ((r as unknown as { overall_score?: number }).overall_score ?? r.overall_rating ?? 0), 0) / completedReviews.length).toFixed(1)
    : "—";

  const filtered = reviews.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (r.employee_name ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  function openCreate() {
    setEditing(null);
    setForm({ employee_id: "", review_period: "annual", review_year: new Date().getFullYear(), goal_score: "", behavior_score: "", comments: "", employee_self_review: "", status: "draft" });
    setDialogOpen(true);
  }

  function openEdit(review: PerformanceReview) {
    setEditing(review);
    const r = review as unknown as Record<string, unknown>;
    setForm({
      employee_id: review.employee_id,
      review_period: (r.review_period as string) || "annual",
      review_year: (r.review_year as number) || new Date().getFullYear(),
      goal_score: String(r.goal_score ?? ""),
      behavior_score: String(r.behavior_score ?? ""),
      comments: (r.comments as string) || "",
      employee_self_review: (r.employee_self_review as string) || "",
      status: review.status,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editing && !form.employee_id) {
      toast({ title: "Validation Error", description: "Please select an employee", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await performanceService.updateReview(editing.business_id, {
          goal_score: form.goal_score ? parseFloat(form.goal_score) : undefined,
          behavior_score: form.behavior_score ? parseFloat(form.behavior_score) : undefined,
          comments: form.comments || undefined,
          employee_self_review: form.employee_self_review || undefined,
          status: form.status,
        });
        toast({ title: "Review Updated", variant: "success" });
      } else {
        await performanceService.createReview({
          employee_id: form.employee_id,
          review_period: form.review_period,
          review_year: form.review_year,
          goal_score: form.goal_score ? parseFloat(form.goal_score) : undefined,
          behavior_score: form.behavior_score ? parseFloat(form.behavior_score) : undefined,
          comments: form.comments || undefined,
          employee_self_review: form.employee_self_review || undefined,
        });
        toast({ title: "Review Created", variant: "success" });
      }
      setDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save review";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground">Track and manage employee performance reviews</p>
        </div>
        {(isAdmin || isManager) && (
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Review</Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Reviews", value: String(reviews.length), icon: Target, color: "text-blue-600" },
          { label: "Avg. Overall Score", value: avgOverall !== "—" ? `${avgOverall} / 5` : "—", icon: Star, color: "text-yellow-600" },
          { label: "Pending", value: String(pendingReviews), icon: Clock, color: "text-orange-600" },
          { label: "Completed", value: String(completedReviews.length), icon: Award, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by employee..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_MAP).map(([v, d]) => (
              <SelectItem key={v} value={v}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews</CardTitle>
          <CardDescription>{filtered.length} review{filtered.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-1">{search || statusFilter !== "all" ? "No reviews match filters" : "No performance reviews yet"}</h3>
              <p className="text-sm text-muted-foreground mb-6">{search || statusFilter !== "all" ? "Try adjusting your filters." : "Create the first review to start tracking."}</p>
              {(isAdmin || isManager) && !search && statusFilter === "all" && (
                <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create First Review</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {["Employee","Period","Reviewer","Score","Status","Date","Actions"].map((h) => (
                      <th key={h} className={`p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((review) => {
                    const statusInfo = STATUS_MAP[review.status] ?? { label: review.status, variant: "secondary" as const };
                    const r = review as unknown as Record<string, unknown>;
                    const overall = (r.overall_score as number | undefined) ?? review.overall_rating;
                    return (
                      <tr key={review.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{review.employee_name || "—"}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {REVIEW_PERIODS.find((p) => p.value === (r.review_period as string))?.label ?? (r.review_period as string) ?? "—"}
                          {r.review_year ? ` ${r.review_year}` : ""}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{(r.reviewer_name as string) || "—"}</td>
                        <td className="p-4">
                          {overall != null ? (
                            <div className="flex items-center gap-2">
                              <StarRating value={overall} />
                              <span className="text-xs text-muted-foreground">({Number(overall).toFixed(1)})</span>
                            </div>
                          ) : <span className="text-sm text-muted-foreground">Not scored</span>}
                        </td>
                        <td className="p-4"><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(review.created_at)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedReview(review); setDetailOpen(true); }}><TrendingUp className="h-4 w-4" /></Button>
                            {(isAdmin || isManager) && (
                              <Button size="sm" variant="ghost" onClick={() => openEdit(review)}><Edit className="h-4 w-4" /></Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Review" : "Create Performance Review"}</DialogTitle>
            <DialogDescription>{editing ? "Update review details." : "Start a new performance review."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editing && (
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.business_id} value={e.business_id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Review Period</Label>
                <Select value={form.review_period} onValueChange={(v) => setForm({ ...form, review_period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REVIEW_PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" value={form.review_year} onChange={(e) => setForm({ ...form, review_year: parseInt(e.target.value) || new Date().getFullYear() })} min="2020" max="2030" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Goal Score (0-5)</Label>
                <Input type="number" placeholder="e.g. 4.2" value={form.goal_score} onChange={(e) => setForm({ ...form, goal_score: e.target.value })} min="0" max="5" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label>Behaviour Score (0-5)</Label>
                <Input type="number" placeholder="e.g. 3.8" value={form.behavior_score} onChange={(e) => setForm({ ...form, behavior_score: e.target.value })} min="0" max="5" step="0.1" />
              </div>
            </div>
            {editing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_MAP).map(([v, d]) => <SelectItem key={v} value={v}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Manager Comments</Label>
              <Textarea placeholder="Provide detailed feedback..." value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Employee Self-Review</Label>
              <Textarea placeholder="Employee self-assessment..." value={form.employee_self_review} onChange={(e) => setForm({ ...form, employee_self_review: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedReview?.employee_name ?? "Review"} — Detail</DialogTitle>
            <DialogDescription>
              {(() => {
                const r = selectedReview as unknown as Record<string, unknown> | null;
                return r?.review_period
                  ? `${REVIEW_PERIODS.find((p) => p.value === r.review_period)?.label ?? r.review_period}${r.review_year ? ` ${r.review_year}` : ""}`
                  : "Performance review details";
              })()}
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (() => {
            const r = selectedReview as unknown as Record<string, unknown>;
            const overall = (r.overall_score as number | undefined) ?? selectedReview.overall_rating;
            return (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <Badge variant={STATUS_MAP[selectedReview.status]?.variant ?? "secondary"}>
                    {STATUS_MAP[selectedReview.status]?.label ?? selectedReview.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Created {formatDate(selectedReview.created_at)}</span>
                </div>
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-semibold">Scores</p>
                  <ScoreBar label="Goal Achievement" value={r.goal_score as number | undefined} />
                  <ScoreBar label="Behaviour & Values" value={r.behavior_score as number | undefined} />
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Score</span>
                      <div className="flex items-center gap-2">
                        <StarRating value={overall} />
                        <span className="text-sm font-bold">{overall != null ? `${Number(overall).toFixed(1)} / 5` : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {r.reviewer_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Reviewed by <strong>{r.reviewer_name as string}</strong></span>
                  </div>
                )}
                {r.comments ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Manager Comments</p>
                    <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{r.comments as string}</p>
                  </div>
                ) : null}
                {r.employee_self_review ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Employee Self-Review</p>
                    <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{r.employee_self_review as string}</p>
                  </div>
                ) : null}
                {!r.comments && !r.employee_self_review && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>No comments submitted yet.</span>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            {(isAdmin || isManager) && selectedReview && (
              <Button variant="outline" onClick={() => { openEdit(selectedReview); setDetailOpen(false); }}>
                <Edit className="mr-2 h-4 w-4" />Edit Review
              </Button>
            )}
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
