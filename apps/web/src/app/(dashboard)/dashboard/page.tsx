"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Users, UserCheck, UserMinus, Briefcase, Target, TrendingUp, Loader2,
  CalendarDays, AlertTriangle, ArrowRight, Clock, Sparkles, Building2, BarChart3, Bell,
  LogIn, LogOut, FileText, DollarSign,
} from "lucide-react";
import { analyticsService, departmentService, notificationService, holidayService, employeeService, attendanceService, payrollService, leaveService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import type { DepartmentSummary, DashboardStats, Notification, Holiday, Employee, AttendanceRecord, LeaveRequest } from "@/types";

interface PayslipSummary {
  business_id: string;
  period_month: number;
  period_year: number;
  net_salary: number;
  currency: string;
  payment_status: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [activity, setActivity] = useState<Notification[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [visaAlerts, setVisaAlerts] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Self-service state for employee/manager
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [myPayslips, setMyPayslips] = useState<PayslipSummary[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  // Role helpers
  const role = user?.role || "employee";
  const isAdmin = ["super_admin", "company_admin", "hr_manager"].includes(role);
  const isManager = isAdmin || role === "team_manager";
  const isFinance = role === "finance";
  const isEmployee = !isAdmin;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Everyone gets holidays + notifications
      const baseRequests: Promise<unknown>[] = [
        notificationService.list(),
        holidayService.list({ year: new Date().getFullYear() }),
      ];
      // Only admins/managers load org-wide stats
      if (isAdmin || isManager) {
        baseRequests.push(
          analyticsService.getDashboard(),
          departmentService.list(),
          employeeService.list(),
        );
      }
      // All users (especially employees) get self-service data
      if (isEmployee || isManager) {
        baseRequests.push(
          attendanceService.getMyToday().catch(() => null),
          attendanceService.getMyHistory({ page: 1, page_size: 7 }).catch(() => null),
          payrollService.getMyPayslips().catch(() => null),
          leaveService.getMyLeaves().catch(() => null),
        );
      }

      const results = await Promise.allSettled(baseRequests);

      // Notifications (index 0)
      if (results[0].status === "fulfilled") {
        const notifData = results[0].value;
        const items = Array.isArray(notifData) ? notifData : (notifData as { data?: Notification[] })?.data || [];
        setActivity(items.slice(0, 5));
      }
      // Holidays (index 1)
      if (results[1].status === "fulfilled") {
        const hData = results[1].value;
        const hItems: Holiday[] = Array.isArray(hData) ? hData : (hData as { data?: Holiday[] })?.data || [];
        const now = new Date();
        setHolidays(
          hItems
            .filter((h) => new Date(h.date) >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
        );
      }
      // Org stats (index 2+, only if admin/manager)
      if ((isAdmin || isManager) && results.length > 2) {
        if (results[2].status === "fulfilled" && results[2].value) {
          setStats(results[2].value as DashboardStats);
        }
        if (results[3]?.status === "fulfilled") {
          const deptData = results[3].value;
          setDepartments(Array.isArray(deptData) ? deptData : (deptData as { data?: DepartmentSummary[] })?.data || []);
        }
        if (results[4]?.status === "fulfilled") {
          const eData = results[4].value as unknown as { data?: Employee[] };
          const emps: Employee[] = eData?.data || [];
          const threshold = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          setVisaAlerts(
            emps.filter((e) => e.visa_expiry_date && new Date(e.visa_expiry_date) <= threshold).slice(0, 5)
          );
        }
      }
      // Self-service results  
      if (isEmployee || isManager) {
        const s = (isAdmin || isManager) ? 5 : 2;
        // Today's attendance
        if (results[s]?.status === "fulfilled") {
          const v = (results[s] as PromiseFulfilledResult<unknown>).value;
          if (v) setTodayAttendance(v as AttendanceRecord);
        }
        // Attendance history
        if (results[s + 1]?.status === "fulfilled") {
          const v = (results[s + 1] as PromiseFulfilledResult<unknown>).value;
          if (v) {
            const histItems = Array.isArray(v) ? v : (v as { data?: AttendanceRecord[] })?.data || [];
            setAttendanceHistory(histItems.slice(0, 7));
          }
        }
        // Payslips
        if (results[s + 2]?.status === "fulfilled") {
          const v = (results[s + 2] as PromiseFulfilledResult<unknown>).value;
          if (v) {
            const psItems = Array.isArray(v) ? v : (v as { data?: PayslipSummary[] })?.data || [];
            setMyPayslips(psItems.slice(0, 3));
          }
        }
        // Leaves
        if (results[s + 3]?.status === "fulfilled") {
          const v = (results[s + 3] as PromiseFulfilledResult<unknown>).value;
          if (v) {
            const lvItems: LeaveRequest[] = Array.isArray(v) ? v : (v as { data?: LeaveRequest[] })?.data || [];
            setMyLeaves(lvItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
          }
        }
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.company_id, user?.id, isAdmin, isManager, isEmployee]);

  // Clock in/out handlers
  async function handleClockIn() {
    setClockingIn(true);
    try {
      const result = await attendanceService.checkIn();
      setTodayAttendance(result as AttendanceRecord);
      toast({ title: "Clocked In", description: `You clocked in at ${new Date().toLocaleTimeString()}`, variant: "success" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to clock in";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setClockingIn(false); }
  }

  async function handleClockOut() {
    setClockingOut(true);
    try {
      const result = await attendanceService.checkOut();
      setTodayAttendance(result as AttendanceRecord);
      toast({ title: "Clocked Out", description: `You clocked out at ${new Date().toLocaleTimeString()}`, variant: "success" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to clock out";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setClockingOut(false); }
  }

  useEffect(() => { loadData(); }, [loadData]);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const metricCards = isAdmin ? [
    {
      title: "Total Employees",
      value: stats?.total_employees ?? 0,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      textColor: "text-blue-700 dark:text-blue-300",
    },
    {
      title: "Present Today",
      value: stats?.present_today ?? 0,
      icon: UserCheck,
      subtitle: stats ? `${Math.round((stats.present_today / Math.max(stats.total_employees, 1)) * 100)}% attendance` : "",
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      textColor: "text-emerald-700 dark:text-emerald-300",
    },
    {
      title: "On Leave",
      value: stats?.on_leave_today ?? 0,
      icon: UserMinus,
      subtitle: `${stats?.leave_requests_pending ?? 0} pending approval`,
      gradient: "from-amber-500 to-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      textColor: "text-amber-700 dark:text-amber-300",
    },
    {
      title: "New Hires",
      value: stats?.hires_this_month ?? 0,
      icon: TrendingUp,
      subtitle: "This month",
      gradient: "from-violet-500 to-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      iconBg: "bg-violet-100 dark:bg-violet-900/40",
      textColor: "text-violet-700 dark:text-violet-300",
    },
  ] : [];

  const secondaryCards = isAdmin ? [
    { title: "Open Positions", value: stats?.open_jobs ?? 0, icon: Briefcase, color: "text-orange-600" },
    { title: "Departments", value: stats?.departments_count ?? 0, icon: Building2, color: "text-rose-600" },
    { title: "Active Employees", value: stats?.active_employees ?? 0, icon: Target, color: "text-cyan-600" },
    { title: "Pending Reviews", value: stats?.leave_requests_pending ?? 0, icon: Clock, color: "text-indigo-600" },
  ] : [];

  // Quick actions differ by role
  const adminQuickActions = [
    { label: "Add Employee", href: "/dashboard/employees", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
    { label: "Mark Attendance", href: "/dashboard/attendance", icon: Clock, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
    { label: "Run Payroll", href: "/dashboard/payroll", icon: BarChart3, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
    { label: "Post Job", href: "/dashboard/recruitment", icon: Briefcase, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
    { label: "View Holidays", href: "/dashboard/holidays", icon: CalendarDays, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
    { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Sparkles, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
  ];
  const employeeQuickActions = [
    { label: "My Attendance", href: "/dashboard/attendance", icon: Clock, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
    { label: "My Payslips", href: "/dashboard/payroll", icon: DollarSign, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "View Holidays", href: "/dashboard/holidays", icon: CalendarDays, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
    { label: "Settings", href: "/dashboard/settings", icon: Target, color: "text-gray-600 bg-gray-50 dark:bg-gray-950/30" },
    { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Sparkles, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
  ];
  const managerQuickActions = [
    { label: "Mark Attendance", href: "/dashboard/attendance", icon: Clock, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
    { label: "View Holidays", href: "/dashboard/holidays", icon: CalendarDays, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
    { label: "Performance", href: "/dashboard/performance", icon: Target, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
    { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Sparkles, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
  ];

  const quickActions = isAdmin ? adminQuickActions : isManager ? managerQuickActions : employeeQuickActions;
  const roleLabel = role === "super_admin" ? "Super Admin" : role === "company_admin" ? "Company Admin" : role === "hr_manager" ? "HR Manager" : role === "team_manager" ? "Team Manager" : role === "recruiter" ? "Recruiter" : role === "finance" ? "Finance" : "Employee";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-2xl font-bold">{greeting()}, {user?.full_name?.split(" ")[0] || "Admin"} 👋</h1>
          <p className="mt-1 text-white/80 text-sm max-w-lg">
            {isAdmin
              ? "Here's what's happening in your organization today. Stay on top of your HR operations with real-time insights."
              : "Welcome to your dashboard. Check your schedule, holidays, and notifications."}
          </p>
          <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-0 text-xs">{roleLabel}</Badge>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 top-16 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute right-32 -bottom-6 h-20 w-20 rounded-full bg-white/10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Primary Metric Cards — admin only */}
          {metricCards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((card) => (
              <Card key={card.title} className={`${card.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                      <p className="text-3xl font-bold mt-1">{card.value}</p>
                      {card.subtitle && <p className={`text-xs mt-1 ${card.textColor}`}>{card.subtitle}</p>}
                    </div>
                    <div className={`${card.iconBg} rounded-xl p-2.5`}>
                      <card.icon className={`h-5 w-5 ${card.textColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {/* Secondary Stats Row — admin only */}
          {secondaryCards.length > 0 && (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {secondaryCards.map((card) => (
              <Card key={card.title} className="border shadow-sm">
                <CardContent className="py-4 flex items-center gap-3">
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                  <div>
                    <p className="text-lg font-semibold leading-none">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {/* Middle Row: Quick Actions + Department Overview */}
          <div className={`grid gap-6 ${isAdmin ? "lg:grid-cols-7" : "lg:grid-cols-2"}`}>
            {/* Quick Actions */}
            <Card className={`${isAdmin ? "lg:col-span-3" : ""} shadow-sm`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>Jump to common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 rounded-xl p-3 transition-all hover:scale-[1.02] hover:shadow-sm border"
                    >
                      <div className={`rounded-lg p-2 ${action.color}`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Overview — admin only */}
            {isAdmin && (
            <Card className="lg:col-span-4 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Department Overview</CardTitle>
                    <CardDescription>Employee distribution</CardDescription>
                  </div>
                  <Link href="/dashboard/departments">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {departments.length > 0 ? departments.slice(0, 6).map((dept) => {
                  const count = (dept as unknown as { employee_count?: number }).employee_count ?? 0;
                  const total = stats?.total_employees || 1;
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={dept.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="font-medium">{dept.name}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{count} employees ({percent}%)</span>
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No departments configured yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>

          {/* ── Employee Self-Service Section ──────────────────── */}
          {isEmployee && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Clock In/Out Card */}
            <Card className="shadow-sm border-2 border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Time & Attendance
                </CardTitle>
                <CardDescription>Clock in/out and view today&apos;s status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  {/* Live Clock */}
                  <div className="text-center">
                    <p className="text-4xl font-bold tabular-nums tracking-tight">{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                  </div>

                  {/* Status */}
                  <div className="w-full rounded-xl bg-muted/50 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={todayAttendance?.check_in_time ? (todayAttendance?.check_out_time ? "secondary" : "success") : "outline"}>
                        {todayAttendance?.check_in_time ? (todayAttendance?.check_out_time ? "Completed" : "Working") : "Not Clocked In"}
                      </Badge>
                    </div>
                    {todayAttendance?.check_in_time && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Clock In</span>
                        <span className="font-medium">{todayAttendance.check_in_time}</span>
                      </div>
                    )}
                    {todayAttendance?.check_out_time && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Clock Out</span>
                        <span className="font-medium">{todayAttendance.check_out_time}</span>
                      </div>
                    )}
                    {todayAttendance?.total_hours !== undefined && todayAttendance?.total_hours !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Hours</span>
                        <span className="font-medium">{todayAttendance.total_hours.toFixed(1)}h</span>
                      </div>
                    )}
                  </div>

                  {/* Clock Buttons */}
                  <div className="flex gap-3 w-full">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleClockIn}
                      disabled={clockingIn || !!todayAttendance?.check_in_time}
                    >
                      {clockingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                      Clock In
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      variant="outline"
                      onClick={handleClockOut}
                      disabled={clockingOut || !todayAttendance?.check_in_time || !!todayAttendance?.check_out_time}
                    >
                      {clockingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                      Clock Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance History */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Attendance</CardTitle>
                  <Link href="/dashboard/attendance">
                    <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="h-3 w-3 ml-1" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {attendanceHistory.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceHistory.map((a) => (
                      <div key={a.business_id || a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="text-center w-10">
                            <p className="text-xs font-medium text-muted-foreground">{new Date(a.attendance_date).toLocaleDateString("en-US", { weekday: "short" })}</p>
                            <p className="text-sm font-bold">{new Date(a.attendance_date).getDate()}</p>
                          </div>
                          <div>
                            <p className="text-sm">{a.check_in_time || "—"} {a.check_out_time ? `→ ${a.check_out_time}` : ""}</p>
                            <p className="text-xs text-muted-foreground">{a.total_hours ? `${a.total_hours.toFixed(1)}h` : "—"}</p>
                          </div>
                        </div>
                        <Badge variant={a.status === "present" ? "success" : a.status === "absent" ? "destructive" : a.status === "late" ? "warning" : "secondary"} className="text-[10px]">
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">No attendance records yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Employee Payslips + Leave Requests */}
          {isEmployee && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Payslips */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" /> My Payslips
                  </CardTitle>
                  <Link href="/dashboard/payroll">
                    <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="h-3 w-3 ml-1" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {myPayslips.length > 0 ? (
                  <div className="space-y-2">
                    {myPayslips.map((ps) => {
                      const monthName = new Date(ps.period_year, ps.period_month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                      return (
                        <div key={ps.business_id} className="flex items-center justify-between rounded-lg border px-3 py-3">
                          <div>
                            <p className="text-sm font-medium">{monthName}</p>
                            <p className="text-xs text-muted-foreground">Net: {ps.currency} {ps.net_salary?.toLocaleString()}</p>
                          </div>
                          <Badge variant={ps.payment_status === "paid" ? "success" : "warning"} className="text-[10px]">
                            {ps.payment_status || "pending"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">No payslips available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Leave Requests */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-blue-500" /> My Leave Requests
                  </CardTitle>
                  <Link href="/dashboard/attendance">
                    <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="h-3 w-3 ml-1" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {myLeaves.length > 0 ? (
                  <div className="space-y-2">
                    {myLeaves.map((lv) => (
                      <div key={lv.business_id || lv.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{lv.leave_type?.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(lv.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {lv.end_date !== lv.start_date && ` – ${new Date(lv.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                            {lv.total_days ? ` (${lv.total_days}d)` : ""}
                          </p>
                        </div>
                        <Badge variant={lv.status === "approved" ? "success" : lv.status === "rejected" ? "destructive" : "warning"} className="text-[10px]">
                          {lv.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <CalendarDays className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">No leave requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Bottom Row: Upcoming Holidays + Visa Alerts + Recent Activity */}
          <div className={`grid gap-6 ${isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
            {/* Upcoming Holidays */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-rose-500" /> Upcoming Holidays
                  </CardTitle>
                  <Link href="/dashboard/holidays">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {holidays.length > 0 ? (
                  <div className="space-y-3">
                    {holidays.map((h) => {
                      const d = new Date(h.date);
                      const dayNum = d.getDate();
                      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
                      return (
                        <div key={h.business_id} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex flex-col items-center justify-center">
                            <span className="text-xs text-rose-600 font-medium uppercase">{monthShort}</span>
                            <span className="text-lg font-bold leading-none text-rose-700">{dayNum}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{h.name}</p>
                            <p className="text-xs text-muted-foreground">{h.country || "All"}{h.state ? ` • ${h.state}` : ""}</p>
                          </div>
                          <Badge variant={h.holiday_type === "public" ? "success" : h.holiday_type === "restricted" ? "warning" : "secondary"} className="text-[10px]">
                            {h.holiday_type}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming holidays</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visa Alerts — admin only */}
            {isAdmin && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Visa Expiry Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visaAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {visaAlerts.map((emp) => {
                      const expiryDate = new Date(emp.visa_expiry_date!);
                      const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpired = daysLeft < 0;
                      const initials = getInitials(`${emp.first_name} ${emp.last_name}`);
                      return (
                        <Link key={emp.business_id} href={`/dashboard/employees/${emp.business_id}`} className="flex items-center gap-3 group">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/30">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{emp.visa_type || "Visa"}</p>
                          </div>
                          <Badge variant={isExpired ? "destructive" : "warning"} className="text-[10px]">
                            {isExpired ? "Expired" : `${daysLeft}d left`}
                          </Badge>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <UserCheck className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No visa expiry alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Recent Activity */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest events across the org</CardDescription>
              </CardHeader>
              <CardContent>
                {activity.length > 0 ? (
                  <div className="space-y-3">
                    {activity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.message}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(item.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
