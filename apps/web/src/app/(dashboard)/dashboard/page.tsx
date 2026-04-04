"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, UserCheck, UserMinus, Clock, DollarSign, Briefcase, Target, TrendingUp, Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { analyticsService, departmentService, notificationService } from "@/services/api-services";
import type { Department } from "@/types";

interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  newJoinsThisMonth: number;
  attendanceRate: number;
  openPositions: number;
  pendingLeaves: number;
  payrollTotal: number;
}

interface ActivityItem {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0, activeEmployees: 0, onLeave: 0, newJoinsThisMonth: 0,
    attendanceRate: 0, openPositions: 0, pendingLeaves: 0, payrollTotal: 0,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [execRes, deptRes, notifRes] = await Promise.allSettled([
        analyticsService.getExecutiveDashboard({}),
        departmentService.list(),
        notificationService.list(),
      ]);
      if (execRes.status === "fulfilled" && execRes.value) {
        setMetrics((prev) => ({ ...prev, ...execRes.value }));
      }
      if (deptRes.status === "fulfilled") {
        setDepartments(Array.isArray(deptRes.value) ? deptRes.value : []);
      }
      if (notifRes.status === "fulfilled") {
        setActivity(Array.isArray(notifRes.value) ? notifRes.value.slice(0, 5) : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalDeptEmployees = departments.reduce((sum, d) => sum + (d._count?.employees || 0), 0) || 1;

  const cards = [
    { title: "Total Employees", value: metrics.totalEmployees, icon: Users, change: "+3.2%", color: "text-blue-600" },
    { title: "Active Today", value: metrics.activeEmployees, icon: UserCheck, change: `${metrics.attendanceRate}%`, color: "text-green-600" },
    { title: "On Leave", value: metrics.onLeave, icon: UserMinus, change: `${metrics.pendingLeaves} pending`, color: "text-yellow-600" },
    { title: "New Joins", value: metrics.newJoinsThisMonth, icon: TrendingUp, change: "This month", color: "text-purple-600" },
    { title: "Attendance Rate", value: `${metrics.attendanceRate}%`, icon: Clock, color: "text-cyan-600" },
    { title: "Open Positions", value: metrics.openPositions, icon: Briefcase, color: "text-orange-600" },
    { title: "Payroll (Monthly)", value: formatCurrency(metrics.payrollTotal), icon: DollarSign, color: "text-emerald-600" },
    { title: "Performance Avg", value: "—", icon: Target, color: "text-rose-600" },
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
                  const count = dept._count?.employees || 0;
                  const percent = Math.round((count / totalDeptEmployees) * 100);
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
                      <Badge variant="secondary">{timeAgo(item.createdAt)}</Badge>
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
