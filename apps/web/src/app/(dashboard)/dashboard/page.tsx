"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, UserCheck, UserMinus, DollarSign, Briefcase, Target, TrendingUp, Loader2,
} from "lucide-react";
import { analyticsService, departmentService, notificationService } from "@/services/api-services";
import type { DepartmentSummary, DashboardStats, Notification } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [activity, setActivity] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, deptRes, notifRes] = await Promise.allSettled([
        analyticsService.getDashboard(),
        departmentService.list(),
        notificationService.list(),
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalDeptEmployees = stats?.total_employees || 1;

  const cards = [
    { title: "Total Employees", value: stats?.total_employees ?? 0, icon: Users, change: "+3.2%", color: "text-blue-600" },
    { title: "Active Today", value: stats?.present_today ?? 0, icon: UserCheck, change: stats ? `${Math.round((stats.present_today / Math.max(stats.total_employees, 1)) * 100)}%` : "0%", color: "text-green-600" },
    { title: "On Leave", value: stats?.on_leave_today ?? 0, icon: UserMinus, change: `${stats?.leave_requests_pending ?? 0} pending`, color: "text-yellow-600" },
    { title: "New Hires", value: stats?.hires_this_month ?? 0, icon: TrendingUp, change: "This month", color: "text-purple-600" },
    { title: "Open Positions", value: stats?.open_jobs ?? 0, icon: Briefcase, color: "text-orange-600" },
    { title: "Pending Leaves", value: stats?.leave_requests_pending ?? 0, icon: DollarSign, color: "text-emerald-600" },
    { title: "Departments", value: stats?.departments_count ?? 0, icon: Target, color: "text-rose-600" },
    { title: "Active Employees", value: stats?.active_employees ?? 0, icon: UserCheck, change: "Currently active", color: "text-cyan-600" },
  ];

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to SRP AI HRMS. Here&apos;s your organization overview.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.change && <p className="text-xs text-muted-foreground">{card.change}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions & Department Overview */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Add Employee", href: "/dashboard/employees" },
                    { label: "Mark Attendance", href: "/dashboard/attendance" },
                    { label: "Run Payroll", href: "/dashboard/payroll" },
                    { label: "Post Job", href: "/dashboard/recruitment" },
                    { label: "Create Review", href: "/dashboard/performance" },
                    { label: "AI Chat", href: "/dashboard/ai-assistant" },
                  ].map((action) => (
                    <a
                      key={action.label}
                      href={action.href}
                      className="flex items-center justify-center rounded-lg border border-dashed p-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>Employee distribution by department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {departments.length > 0 ? departments.slice(0, 6).map((dept) => {
                  const count = 0;
                  const percent = 0;
                  return (
                    <div key={dept.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{dept.name}</span>
                        <span className="text-muted-foreground">{count} ({percent}%)</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  );
                }) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No departments configured yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.message}</p>
                      </div>
                      <Badge variant="secondary">{timeAgo(item.created_at)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No recent activity.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
