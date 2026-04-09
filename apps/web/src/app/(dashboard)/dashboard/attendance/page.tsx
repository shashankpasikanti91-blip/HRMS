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
import { Clock, LogIn, LogOut, Calendar, Users, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { attendanceService, leaveService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { AttendanceRecord, LeaveRequest } from "@/types";

export default function AttendancePage() {
  const { toast } = useToast();
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [teamData, setTeamData] = useState<{ present: number; onLeave: number; late: number; absent: number }>({ present: 0, onLeave: 0, late: 0, absent: 0 });
  const [attendanceLog, setAttendanceLog] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({ date: "", clockIn: "", clockOut: "", reason: "" });
  const [leaveApplying, setLeaveApplying] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayResult, teamResult, leaveResult] = await Promise.allSettled([
        attendanceService.getToday(),
        attendanceService.getTeamDashboard(),
        leaveService.getRequests(),
      ]);

      if (todayResult.status === "fulfilled" && todayResult.value) {
        const today = todayResult.value;
        setTodayRecord(today);
        if (today.check_in_time && !today.check_out_time) {
          setClockedIn(true);
          setClockInTime(new Date(today.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to clock in";
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to clock out";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setClockLoading(false);
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
    try {
      await attendanceService.manualEntry({
        employee_id: correctionForm.date,
        attendance_date: correctionForm.date,
        check_in_time: correctionForm.clockIn || undefined,
        check_out_time: correctionForm.clockOut || undefined,
        status: "present",
        remarks: correctionForm.reason,
      });
      toast({ title: "Correction Submitted", description: "Your correction request has been sent for approval", variant: "success" });
      setCorrectionOpen(false);
      setCorrectionForm({ date: "", clockIn: "", clockOut: "", reason: "" });
    } catch {
      toast({ title: "Error", description: "Failed to submit correction", variant: "destructive" });
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
                {clockedIn ? `Clocked in at ${clockInTime || "—"}` : "You haven't clocked in yet"}
              </p>
            </div>
          </div>
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
          <TabsTrigger value="leaves">Leave Requests ({leaveRequests.filter((l) => l.status === "pending").length} pending)</TabsTrigger>
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
                        <td className="p-3 text-sm font-medium">{r.employee_id}</td>
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
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Manage pending leave requests</CardDescription>
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
                      <th className="p-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="p-3 text-sm font-medium">{l.employee_id}</td>
                        <td className="p-3 text-sm">{l.leave_type || "Leave"}</td>
                        <td className="p-3 text-sm">{formatDate(l.start_date)} - {formatDate(l.end_date)}</td>
                        <td className="p-3 text-sm">{l.total_days}</td>
                        <td className="p-3"><Badge variant={statusColors[l.status]}>{l.status}</Badge></td>
                        <td className="p-3">
                          {l.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" disabled={leaveApplying} onClick={() => handleLeaveAction(l.business_id, "approve")}>Approve</Button>
                              <Button size="sm" variant="outline" disabled={leaveApplying} onClick={() => handleLeaveAction(l.business_id, "reject")}>Reject</Button>
                            </div>
                          )}
                        </td>
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
            <Button onClick={handleCorrectionSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
