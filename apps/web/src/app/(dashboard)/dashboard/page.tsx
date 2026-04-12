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
  CalendarDays, AlertTriangle, ArrowRight, Clock, Sparkles, Building2, BarChart3,
} from "lucide-react";
import { analyticsService, departmentService, notificationService, holidayService, employeeService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { getInitials } from "@/lib/utils";
import type { DepartmentSummary, DashboardStats, Notification, Holiday, Employee } from "@/types";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [activity, setActivity] = useState<Notification[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [visaAlerts, setVisaAlerts] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, deptRes, notifRes, holidayRes, empRes] = await Promise.allSettled([
        analyticsService.getDashboard(),
        departmentService.list(),
        notificationService.list(),
        holidayService.list({ year: new Date().getFullYear() }),
        employeeService.list(),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStats(statsRes.value);
      }
      if (deptRes.status === "fulfilled") {
        const deptData = deptRes.value;
        setDepartments(Array.isArray(deptData) ? deptData : (deptData as { data?: DepartmentSummary[] })?.data || []);
      }
      if (notifRes.status === "fulfilled") {
        const notifData = notifRes.value;
        const items = Array.isArray(notifData) ? notifData : (notifData as { data?: Notification[] })?.data || [];
        setActivity(items.slice(0, 5));
      }
      if (holidayRes.status === "fulfilled") {
        const hData = holidayRes.value;
        const hItems: Holiday[] = Array.isArray(hData) ? hData : (hData as { data?: Holiday[] })?.data || [];
        const now = new Date();
        setHolidays(
          hItems
            .filter((h) => new Date(h.date) >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
        );
      }
      if (empRes.status === "fulfilled") {
        const eData = empRes.value as unknown as { data?: Employee[] };
        const emps: Employee[] = eData?.data || [];
        const threshold = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        setVisaAlerts(
          emps.filter((e) => e.visa_expiry_date && new Date(e.visa_expiry_date) <= threshold).slice(0, 5)
        );
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.company_id]);

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

  const metricCards = [
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
  ];

  const secondaryCards = [
    { title: "Open Positions", value: stats?.open_jobs ?? 0, icon: Briefcase, color: "text-orange-600" },
    { title: "Departments", value: stats?.departments_count ?? 0, icon: Building2, color: "text-rose-600" },
    { title: "Active Employees", value: stats?.active_employees ?? 0, icon: Target, color: "text-cyan-600" },
    { title: "Pending Reviews", value: stats?.leave_requests_pending ?? 0, icon: Clock, color: "text-indigo-600" },
  ];

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
            Here&apos;s what&apos;s happening in your organization today. Stay on top of your HR operations with real-time insights.
          </p>
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
          {/* Primary Metric Cards */}
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

          {/* Secondary Stats Row */}
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

          {/* Middle Row: Quick Actions + Department Overview */}
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Quick Actions */}
            <Card className="lg:col-span-3 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>Jump to common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Add Employee", href: "/dashboard/employees", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
                    { label: "Mark Attendance", href: "/dashboard/attendance", icon: Clock, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
                    { label: "Run Payroll", href: "/dashboard/payroll", icon: BarChart3, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
                    { label: "Post Job", href: "/dashboard/recruitment", icon: Briefcase, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
                    { label: "View Holidays", href: "/dashboard/holidays", icon: CalendarDays, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
                    { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Sparkles, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
                  ].map((action) => (
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

            {/* Department Overview */}
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
          </div>

          {/* Bottom Row: Upcoming Holidays + Visa Alerts + Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
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

            {/* Visa Alerts */}
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
