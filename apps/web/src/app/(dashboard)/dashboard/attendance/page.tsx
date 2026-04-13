"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Clock, LogIn, LogOut, Calendar, Users, Loader2, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { attendanceService, leaveService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AttendanceRecord, LeaveRequest } from "@/types";

export default function AttendancePage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const role = user?.role || "employee";
  const isAdmin = ["super_admin", "company_admin", "hr_manager"].includes(role);
  const isManager = isAdmin || role === "team_manager";
  const canApproveLeaves = isManager;
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [hasEmployeeProfile, setHasEmployeeProfile] = useState(true);
  const [teamData, setTeamData] = useState<{ present: number; onLeave: number; late: number; absent: number }>({ present: 0, onLeave: 0, late: 0, absent: 0 });
  const [attendanceLog, setAttendanceLog] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({ date: "", clockIn: "", clockOut: "", reason: "" });
  const [leaveApplying, setLeaveApplying] = useState(false);
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);

  // Leave Apply Dialog state
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayResult, teamResult, leaveResult] = await Promise.allSettled([
        attendanceService.getMyToday(),
        attendanceService.getTeamDashboard(),
        canApproveLeaves ? leaveService.getRequests() : leaveService.getMyLeaves(),
      ]);

      if (todayResult.status === "fulfilled") {
        const today = todayResult.value;
        if (today === null) {
          // null means no employee profile or no record today
          setClockedIn(false);
          setClockInTime(null);
          setTodayRecord(null);
        } else if (today === "no_profile") {
          setHasEmployeeProfile(false);
        } else {
          setTodayRecord(today);
          setHasEmployeeProfile(true);
          if (today.check_in_time && !today.check_out_time) {
            setClockedIn(true);
            setClockInTime(new Date(today.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
          } else {
            setClockedIn(false);
          }
        }
      }

      if (teamResult.status === "fulfilled" && teamResult.value) {
        const team = teamResult.value;
        setTeamData({
          present: team.present || 0,
          onLeave: team.onLeave || 0,
          late: team.late || 0,
          absent: team.absent || 0,
        });
        if (team.records) {
          setAttendanceLog(team.records);
        }
      }

      if (leaveResult.status === "fulfilled") {
        setLeaveRequests(Array.isArray(leaveResult.value) ? leaveResult.value : []);
      }
    } catch {
      // API not available - show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleClockIn() {
    setClockLoading(true);
    try {
      await attendanceService.checkIn({ check_in_method: "web" });
      setClockedIn(true);
      setClockInTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      toast({ title: "Clocked In", description: "You have been clocked in successfully", variant: "success" });
      loadData();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg = axErr?.response?.data?.detail || axErr?.response?.data?.message || "Failed to clock in";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setClockLoading(false);
    }
  }

  async function handleClockOut() {
    setClockLoading(true);
    try {
      await attendanceService.checkOut();
      setClockedIn(false);
      toast({ title: "Clocked Out", description: "You have been clocked out successfully", variant: "success" });
      loadData();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg = axErr?.response?.data?.detail || axErr?.response?.data?.message || "Failed to clock out";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setClockLoading(false);
    }
  }

  async function handleLeaveApply() {
    if (!leaveForm.start_date || !leaveForm.end_date) {
      toast({ title: "Error", description: "Start date and end date are required", variant: "destructive" });
      return;
    }
    setLeaveSubmitting(true);
    try {
      await leaveService.apply(leaveForm);
      toast({ title: "Leave Applied", description: "Your leave request has been submitted", variant: "success" });
      setLeaveDialogOpen(false);
      setLeaveForm({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
      loadData();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg = axErr?.response?.data?.detail || axErr?.response?.data?.message || "Failed to apply for leave";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLeaveSubmitting(false);
    }
  }

  async function handleLeaveAction(id: string, action: "approve" | "reject") {
    setLeaveApplying(true);
    try {
      if (action === "approve") {
        await leaveService.approve(id);
        toast({ title: "Leave Approved", variant: "success" });
      } else {
        await leaveService.reject(id, "Rejected by manager");
        toast({ title: "Leave Rejected" });
      }
      loadData();
    } catch {
      toast({ title: "Error", description: `Failed to ${action} leave`, variant: "destructive" });
    } finally {
      setLeaveApplying(false);
    }
  }

  async function handleCorrectionSubmit() {
    if (!correctionForm.date || !correctionForm.reason) {
      toast({ title: "Error", description: "Date and reason are required", variant: "destructive" });
      return;
    }
    setCorrectionSubmitting(true);
    try {
      const checkInTime = correctionForm.clockIn ? `${correctionForm.date}T${correctionForm.clockIn}:00` : undefined;
      const checkOutTime = correctionForm.clockOut ? `${correctionForm.date}T${correctionForm.clockOut}:00` : undefined;

      await attendanceService.manualEntry({
        attendance_date: correctionForm.date,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        status: "present",
        remarks: correctionForm.reason,
      });
      toast({ title: "Correction Submitted", description: "Your correction request has been sent for approval", variant: "success" });
      setCorrectionOpen(false);
      setCorrectionForm({ date: "", clockIn: "", clockOut: "", reason: "" });
    } catch {
      toast({ title: "Error", description: "Failed to submit correction", variant: "destructive" });
    } finally {
      setCorrectionSubmitting(false);
    }
  }

  const statusColors: Record<string, "success" | "warning" | "destructive" | "default"> = {
    present: "success", late: "warning", absent: "destructive", on_leave: "default",
    approved: "success", pending: "warning", rejected: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance & Leave</h1>
          <p className="text-muted-foreground">Track attendance, manage leaves, and view schedules</p>
        </div>
        <Button variant="outline" onClick={() => setCorrectionOpen(true)}>
          <AlertCircle className="mr-2 h-4 w-4" />Request Correction
        </Button>
        {!canApproveLeaves && (
          <Button onClick={() => setLeaveDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Apply for Leave
          </Button>
        )}
      </div>

      {/* Clock In/Out Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              <p className="text-sm text-muted-foreground">
                {!hasEmployeeProfile
                  ? "Admin account — viewing team attendance"
                  : clockedIn ? `Clocked in at ${clockInTime || "—"}` : "You haven't clocked in yet"}
              </p>
            </div>
          </div>
          {hasEmployeeProfile && (
            <Button
              size="lg"
              variant={clockedIn ? "destructive" : "default"}
              onClick={clockedIn ? handleClockOut : handleClockIn}
              disabled={clockLoading}
            >
              {clockLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : clockedIn ? (
                <LogOut className="mr-2 h-4 w-4" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {clockedIn ? "Clock Out" : "Clock In"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Present Today", value: teamData.present || "—", icon: Users, color: "text-green-600" },
          { label: "On Leave", value: teamData.onLeave || "—", icon: Calendar, color: "text-yellow-600" },
          { label: "Late Arrivals", value: teamData.late || "—", icon: Clock, color: "text-orange-600" },
          { label: "Absent", value: teamData.absent || "—", icon: Users, color: "text-red-600" },
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

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Today&apos;s Attendance</TabsTrigger>
          <TabsTrigger value="leaves">{canApproveLeaves ? `Leave Requests (${leaveRequests.filter((l) => l.status === "pending").length} pending)` : `My Leaves (${leaveRequests.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log</CardTitle>
              <CardDescription>Real-time attendance tracking from the attendance service</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : attendanceLog.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Employee</th>
                      <th className="p-3 text-left text-sm font-medium">Clock In</th>
                      <th className="p-3 text-left text-sm font-medium">Clock Out</th>
                      <th className="p-3 text-left text-sm font-medium">Hours</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLog.map((r, i) => (
                      <tr key={r.id || i} className="border-b last:border-0">
                        <td className="p-3 text-sm font-medium">{r.employee_name || r.employee_code || r.employee_id}</td>
                        <td className="p-3 text-sm">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="p-3 text-sm">{r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="p-3 text-sm">{r.total_hours ? `${r.total_hours.toFixed(1)}h` : "—"}</td>
                        <td className="p-3"><Badge variant={statusColors[r.status] || "default"}>{r.status?.replace("_", " ") || "present"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8" />
                  <p>No attendance records for today yet.</p>
                  <p className="text-xs">Click &quot;Clock In&quot; to start tracking your attendance.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{canApproveLeaves ? "Leave Requests" : "My Leave Requests"}</CardTitle>
              <CardDescription>{canApproveLeaves ? "Manage pending leave requests" : "Your leave history"}</CardDescription>
            </CardHeader>
            <CardContent>
              {leaveRequests.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Employee</th>
                      <th className="p-3 text-left text-sm font-medium">Type</th>
                      <th className="p-3 text-left text-sm font-medium">Duration</th>
                      <th className="p-3 text-left text-sm font-medium">Days</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                      {canApproveLeaves && <th className="p-3 text-left text-sm font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="p-3 text-sm font-medium">{l.employee_name || l.employee_code || l.employee_id}</td>
                        <td className="p-3 text-sm">{l.leave_type || "Leave"}</td>
                        <td className="p-3 text-sm">{formatDate(l.start_date)} - {formatDate(l.end_date)}</td>
                        <td className="p-3 text-sm">{l.total_days}</td>
                        <td className="p-3"><Badge variant={statusColors[l.status]}>{l.status}</Badge></td>
                        {canApproveLeaves && (
                          <td className="p-3">
                            {l.status === "pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" disabled={leaveApplying} onClick={() => handleLeaveAction(l.business_id, "approve")}>Approve</Button>
                                <Button size="sm" variant="outline" disabled={leaveApplying} onClick={() => handleLeaveAction(l.business_id, "reject")}>Reject</Button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="py-8 text-center text-muted-foreground">No leave requests found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Correction Request Dialog */}
      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Attendance Correction</DialogTitle>
            <DialogDescription>Submit a correction request for missed punch or incorrect time</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={correctionForm.date} onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Correct Clock In</Label>
                <Input type="time" value={correctionForm.clockIn} onChange={(e) => setCorrectionForm({ ...correctionForm, clockIn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Correct Clock Out</Label>
                <Input type="time" value={correctionForm.clockOut} onChange={(e) => setCorrectionForm({ ...correctionForm, clockOut: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                value={correctionForm.reason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                placeholder="Explain why you need a correction..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionOpen(false)}>Cancel</Button>
            <Button onClick={handleCorrectionSubmit} disabled={correctionSubmitting}>
              {correctionSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply for Leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a leave request for approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select value={leaveForm.leave_type} onValueChange={(v) => setLeaveForm({ ...leaveForm, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="earned">Earned Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  <SelectItem value="maternity">Maternity Leave</SelectItem>
                  <SelectItem value="paternity">Paternity Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Reason for leave..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLeaveApply} disabled={leaveSubmitting}>
              {leaveSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
