"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, UserCheck, UserMinus, Clock, DollarSign, Briefcase, Target, TrendingUp,
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

const defaultMetrics: DashboardMetrics = {
  totalEmployees: 248,
  activeEmployees: 231,
  onLeave: 12,
  newJoinsThisMonth: 8,
  attendanceRate: 94.2,
  openPositions: 15,
  pendingLeaves: 7,
  payrollTotal: 1250000,
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data } = await api.get("/analytics/dashboards/executive");
        setMetrics(data.data || data);
      } catch {
        // Use default metrics if API not available
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const cards = [
    { title: "Total Employees", value: metrics.totalEmployees, icon: Users, change: "+3.2%", color: "text-blue-600" },
    { title: "Active Today", value: metrics.activeEmployees, icon: UserCheck, change: `${metrics.attendanceRate}%`, color: "text-green-600" },
    { title: "On Leave", value: metrics.onLeave, icon: UserMinus, change: `${metrics.pendingLeaves} pending`, color: "text-yellow-600" },
    { title: "New Joins", value: metrics.newJoinsThisMonth, icon: TrendingUp, change: "This month", color: "text-purple-600" },
    { title: "Attendance Rate", value: `${metrics.attendanceRate}%`, icon: Clock, change: "+1.5%", color: "text-cyan-600" },
    { title: "Open Positions", value: metrics.openPositions, icon: Briefcase, change: "Active", color: "text-orange-600" },
    { title: "Payroll (Monthly)", value: formatCurrency(metrics.payrollTotal), icon: DollarSign, change: "+2.1%", color: "text-emerald-600" },
    { title: "Performance Avg", value: "4.2/5", icon: Target, change: "+0.3", color: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to SRP AI HRMS. Here&apos;s your organization overview.</p>
      </div>

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
              <p className="text-xs text-muted-foreground">{card.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
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
            {[
              { name: "Engineering", count: 82, percent: 33 },
              { name: "Sales", count: 45, percent: 18 },
              { name: "Marketing", count: 28, percent: 11 },
              { name: "HR", count: 22, percent: 9 },
              { name: "Finance", count: 18, percent: 7 },
              { name: "Operations", count: 53, percent: 22 },
            ].map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{dept.name}</span>
                  <span className="text-muted-foreground">{dept.count} ({dept.percent}%)</span>
                </div>
                <Progress value={dept.percent} className="h-2" />
              </div>
            ))}
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
          <div className="space-y-4">
            {[
              { action: "New employee onboarded", name: "Jane Smith", dept: "Engineering", time: "2 hours ago", badge: "success" as const },
              { action: "Leave approved", name: "John Doe", dept: "Marketing", time: "3 hours ago", badge: "default" as const },
              { action: "Payroll processed", name: "March 2025", dept: "Finance", time: "5 hours ago", badge: "secondary" as const },
              { action: "Interview scheduled", name: "Alice Brown", dept: "Recruitment", time: "1 day ago", badge: "warning" as const },
              { action: "Performance review submitted", name: "Bob Wilson", dept: "Sales", time: "1 day ago", badge: "default" as const },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.name} &middot; {item.dept}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.badge}>{item.time}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
