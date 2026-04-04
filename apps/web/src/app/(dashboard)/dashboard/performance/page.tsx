"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Star, TrendingUp, Award, Plus, Loader2, Edit } from "lucide-react";
import { performanceService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  title: string;
  description?: string;
  type?: string;
  targetDate?: string;
  progress: number;
  status: string;
  employee?: { firstName: string; lastName: string };
  employeeId?: string;
}

interface Review {
  id: string;
  employeeId?: string;
  employee?: { firstName: string; lastName: string };
  cycleId?: string;
  cycle?: { name: string };
  overallRating?: number;
  status: string;
  selfAssessment?: string;
  managerAssessment?: string;
}

interface ReviewCycle {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

export default function PerformancePage() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "", description: "", type: "individual", targetDate: "", progress: "0",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, reviewsRes, cyclesRes] = await Promise.allSettled([
        performanceService.getGoals(),
        performanceService.getReviews(),
        performanceService.getReviewCycles(),
      ]);
      if (goalsRes.status === "fulfilled") setGoals(Array.isArray(goalsRes.value) ? goalsRes.value : []);
      if (reviewsRes.status === "fulfilled") setReviews(Array.isArray(reviewsRes.value) ? reviewsRes.value : []);
      if (cyclesRes.status === "fulfilled") setCycles(Array.isArray(cyclesRes.value) ? cyclesRes.value : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeGoals = goals.filter((g) => g.status === "in_progress" || g.status === "not_started");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length).toFixed(1) : "—";
  const pendingReviews = reviews.filter((r) => r.status === "draft" || r.status === "submitted").length;

  function openCreateGoal() {
    setEditingGoal(null);
    setGoalForm({ title: "", description: "", type: "individual", targetDate: "", progress: "0" });
    setGoalDialogOpen(true);
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      description: goal.description || "",
      type: goal.type || "individual",
      targetDate: goal.targetDate?.split("T")[0] || "",
      progress: String(goal.progress || 0),
    });
    setGoalDialogOpen(true);
  }

  async function handleSaveGoal() {
    if (!goalForm.title) {
      toast({ title: "Validation Error", description: "Goal title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: goalForm.title,
        description: goalForm.description,
        type: goalForm.type,
        targetDate: goalForm.targetDate || undefined,
        progress: parseInt(goalForm.progress) || 0,
      };
      if (editingGoal) {
        await performanceService.updateGoal(editingGoal.id, payload);
        toast({ title: "Updated", description: "Goal updated successfully", variant: "success" });
      } else {
        await performanceService.createGoal(payload);
        toast({ title: "Created", description: "Goal created successfully", variant: "success" });
      }
      setGoalDialogOpen(false);
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to save goal", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function updateGoalProgress(goal: Goal, progress: number) {
    try {
      await performanceService.updateGoal(goal.id, {
        progress,
        status: progress >= 100 ? "completed" : "in_progress",
      });
      toast({ title: "Updated", description: `Progress updated to ${progress}%`, variant: "success" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to update progress", variant: "destructive" });
    }
  }

  const statusColors: Record<string, "success" | "warning" | "default" | "secondary"> = {
    completed: "success", in_progress: "warning", not_started: "secondary",
    submitted: "default", approved: "success", draft: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground">Goals, reviews, and skill development tracking</p>
        </div>
        <Button onClick={openCreateGoal}><Plus className="mr-2 h-4 w-4" />Create Goal</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Active Goals", value: String(activeGoals.length), icon: Target, color: "text-blue-600" },
          { label: "Avg. Rating", value: avgRating, icon: Star, color: "text-yellow-600" },
          { label: "Reviews Pending", value: String(pendingReviews), icon: TrendingUp, color: "text-orange-600" },
          { label: "Completed Goals", value: String(completedGoals.length), icon: Award, color: "text-green-600" },
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

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <Tabs defaultValue="goals">
          <TabsList>
            <TabsTrigger value="goals">Goals ({goals.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="cycles">Review Cycles ({cycles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Goals</CardTitle>
                <CardDescription>Track goal progress across the organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.length > 0 ? goals.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{goal.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[goal.status] || "secondary"}>{goal.status?.replace("_", " ")}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => openEditGoal(goal)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {goal.employee ? `${goal.employee.firstName} ${goal.employee.lastName}` : "Unassigned"}
                        {goal.targetDate && ` · Due: ${new Date(goal.targetDate).toLocaleDateString()}`}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={goal.progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium">{goal.progress}%</span>
                        {goal.status !== "completed" && goal.progress < 100 && (
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateGoalProgress(goal, Math.min(goal.progress + 10, 100))}>
                            +10%
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="py-8 text-center text-muted-foreground">No goals yet. Create your first goal to start tracking.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Employee</th>
                        <th className="p-3 text-left text-sm font-medium">Cycle</th>
                        <th className="p-3 text-left text-sm font-medium">Rating</th>
                        <th className="p-3 text-left text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="p-3 text-sm font-medium">
                            {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "—"}
                          </td>
                          <td className="p-3 text-sm">{r.cycle?.name || "—"}</td>
                          <td className="p-3 text-sm">
                            {r.overallRating != null ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {Number(r.overallRating).toFixed(1)}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="p-3"><Badge variant={statusColors[r.status] || "secondary"}>{r.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">No reviews yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cycles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Cycles</CardTitle>
                <CardDescription>Manage performance review cycles</CardDescription>
              </CardHeader>
              <CardContent>
                {cycles.length > 0 ? (
                  <div className="space-y-3">
                    {cycles.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.startDate && new Date(c.startDate).toLocaleDateString()} — {c.endDate && new Date(c.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={statusColors[c.status] || "secondary"}>{c.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">No review cycles configured.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create/Edit Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Create Goal"}</DialogTitle>
            <DialogDescription>{editingGoal ? "Update goal details and progress" : "Set a new performance goal"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="e.g. Increase test coverage to 80%" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={goalForm.type} onValueChange={(val) => setGoalForm({ ...goalForm, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} />
              </div>
            </div>
            {editingGoal && (
              <div className="space-y-2">
                <Label>Progress (%)</Label>
                <Input type="number" min="0" max="100" value={goalForm.progress} onChange={(e) => setGoalForm({ ...goalForm, progress: e.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGoal} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingGoal ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
