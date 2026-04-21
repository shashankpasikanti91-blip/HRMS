"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  Download,
  Users,
  Clock,
  Loader2,
  TrendingUp,
  Activity,
  Briefcase,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { analyticsService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import type { DashboardStats, AttendanceSummaryItem, HeadcountByDept } from "@/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";

interface AnalyticsData {
  dashboard: DashboardStats | null;
  attendance: AttendanceSummaryItem[];
  headcount: HeadcountByDept[];
  payroll: Array<{ period_month: number; period_year: number; total_gross?: number; total_net?: number; total_deductions?: number; employee_count?: number }>;
}

const PERIOD_DAYS: Record<string, number> = {
  last_7_days: 7,
  last_30_days: 30,
  last_90_days: 90,
  last_12_months: 365,
};

const DEPT_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#db2777", "#0891b2", "#dc2626", "#ca8a04"];

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function formatPct(n: number) {
  return `${n.toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData>({ dashboard: null, attendance: [], headcount: [], payroll: [] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("last_30_days");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const days = PERIOD_DAYS[period] ?? 30;
      const [dashRes, attendRes, headRes, payrollRes] = await Promise.allSettled([
        analyticsService.getDashboard(),
        analyticsService.getAttendanceSummary(days),
        analyticsService.getHeadcount(),
        analyticsService.getPayrollSummary(),
      ]);
      setData({
        dashboard: dashRes.status === "fulfilled" ? dashRes.value : null,
        attendance: attendRes.status === "fulfilled" ? attendRes.value : [],
        headcount: headRes.status === "fulfilled" ? headRes.value : [],
        payroll: payrollRes.status === "fulfilled" ? (payrollRes.value ?? []) : [],
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const dash = data.dashboard;
  const attendSummary = data.attendance;
  const headcountData = data.headcount;
  const payrollData = data.payroll;

  const attendancePoints = attendSummary.map((a) => ({
    label: shortDate(a.date),
    attendance: a.attendance_percentage ?? 0,
    present: a.present ?? 0,
    absent: a.absent ?? 0,
    late: a.late ?? 0,
  }));

  const headcountPie = headcountData.map((h, idx) => ({
    name: h.department_name,
    value: h.total,
    color: DEPT_COLORS[idx % DEPT_COLORS.length],
  }));

  const recentSlice = attendSummary.slice(-7);
  const prevSlice = attendSummary.slice(-14, -7);
  const recentAttendance = avg(recentSlice.map((a) => a.attendance_percentage ?? 0));
  const prevAttendance = avg(prevSlice.map((a) => a.attendance_percentage ?? 0));
  const attendanceDelta = recentAttendance - prevAttendance;
  const attendanceTrendUp = attendanceDelta >= 0;

  const totalHeadcount = headcountData.reduce((sum, dept) => sum + dept.total, 0);
  const totalActive = headcountData.reduce((sum, dept) => sum + dept.active, 0);
  const utilizationRate = totalHeadcount ? (totalActive / totalHeadcount) * 100 : 0;
  const presentTodayRate = dash?.total_employees ? ((dash.present_today ?? 0) / dash.total_employees) * 100 : 0;

  const baseForecast = attendancePoints.slice(-5).map((p) => p.attendance);
  const baseline = avg(baseForecast);
  const slope = baseForecast.length > 1 ? (baseForecast[baseForecast.length - 1] - baseForecast[0]) / (baseForecast.length - 1) : 0;
  const attendanceForecast = Array.from({ length: 3 }, (_, idx) => {
    const next = clamp(baseline + slope * (idx + 1));
    return {
      period: `+${idx + 1} wk`,
      forecast: Number(next.toFixed(1)),
    };
  });

  const payrollPoints = payrollData.map((p) => ({
    label: `${new Date(p.period_year, p.period_month - 1).toLocaleString("default", { month: "short", year: "2-digit" })}`,
    gross: p.total_gross ?? 0,
    net: p.total_net ?? 0,
    deductions: p.total_deductions ?? 0,
    employees: p.employee_count ?? 0,
  }));
  const topDepartment = [...headcountData].sort((a, b) => b.total - a.total)[0];
  const healthScore = clamp((presentTodayRate * 0.45) + (utilizationRate * 0.25) + (Math.max(0, 100 - (dash?.leave_requests_pending ?? 0) * 3) * 0.15) + (Math.max(0, 100 - (dash?.offers_pending ?? 0) * 2) * 0.15));

  const latestPayroll = payrollData[payrollData.length - 1];
  const totalPayrollGross = payrollData.reduce((s, p) => s + (p.total_gross ?? 0), 0);

  const kpis = [
    {
      label: "Total Employees",
      value: dash?.total_employees ?? 0,
      helper: topDepartment ? `${topDepartment.department_name} leads` : "No department mix yet",
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "Attendance Rate",
      value: formatPct(recentAttendance || presentTodayRate),
      helper: `${attendanceTrendUp ? "+" : ""}${attendanceDelta.toFixed(1)} pts vs previous window`,
      icon: Activity,
      color: "text-emerald-600",
      trendUp: attendanceTrendUp,
    },
    {
      label: "Monthly Payroll",
      value: latestPayroll ? `₹${(latestPayroll.total_net ?? 0).toLocaleString()}` : "N/A",
      helper: latestPayroll ? `${latestPayroll.employee_count ?? 0} employees paid` : "No payroll runs yet",
      icon: Briefcase,
      color: "text-amber-600",
    },
    {
      label: "Workforce Health",
      value: `${Math.round(healthScore)}/100`,
      helper: `${formatPct(utilizationRate)} active utilization`,
      icon: Target,
      color: "text-violet-600",
    },
  ];

  function handleExport() {
    toast({ title: "Exporting", description: "Generating report..." });
    try {
      const reportData = {
        period,
        dashboard: dash,
        attendance: attendSummary,
        headcount: headcountData,
        payroll: payrollData,
        generated_at: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hrms-analytics-${period}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Report exported successfully", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to export report", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics &amp; Reports</h1>
          <p className="text-muted-foreground">AI-powered insights and workforce analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_12_months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          <Card className="border-blue-200/60 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-blue-900">Executive Snapshot</p>
                  <p className="text-sm text-blue-800/80">
                    Attendance is {formatPct(recentAttendance || 0)} with projected trend {attendanceForecast[2] ? formatPct(attendanceForecast[2].forecast) : "0.0%"} in 3 weeks.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-300 text-blue-800">Power BI Mode</Badge>
                  <Badge variant="outline" className="border-cyan-300 text-cyan-800">Future Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      </div>
                      {typeof kpi.trendUp === "boolean" && (
                        kpi.trendUp ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.helper}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="workforce">
            <TabsList>
              <TabsTrigger value="workforce">Workforce</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
            </TabsList>

            <TabsContent value="workforce" className="mt-4">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Headcount by Department</CardTitle>
                    <CardDescription>Distribution and ownership mix</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {headcountData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={headcountPie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2}>
                              {headcountPie.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No headcount data available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Departmental Strength and Utilization</CardTitle>
                    <CardDescription>Active vs total employees by department</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {headcountData.length > 0 ? (
                      <div className="space-y-3">
                        {headcountData.map((d, i) => {
                          const activeRate = d.total ? (d.active / d.total) * 100 : 0;
                          return (
                            <div key={d.department_name} className="rounded-lg border p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                                  <span className="text-sm font-medium">{d.department_name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{d.active}/{d.total} active</span>
                              </div>
                              <Progress value={activeRate} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No workforce distribution available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                    <CardDescription>Daily present vs absent distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {attendancePoints.length > 0 ? (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={attendancePoints} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                            <defs>
                              <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                              </linearGradient>
                              <linearGradient id="absentFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.24} />
                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.04} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="present" stroke="#16a34a" fill="url(#presentFill)" strokeWidth={2} />
                            <Area type="monotone" dataKey="absent" stroke="#dc2626" fill="url(#absentFill)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No attendance summary available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Forecast (Next 3 Weeks)</CardTitle>
                    <CardDescription>Projected attendance rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {attendanceForecast.length > 0 ? (
                      <div className="space-y-3">
                        {attendanceForecast.map((item) => (
                          <div key={item.period} className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium">{item.period}</span>
                              <span>{formatPct(item.forecast)}</span>
                            </div>
                            <Progress value={item.forecast} className="h-2" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">Not enough attendance data to forecast.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Attendance Quality Curve</CardTitle>
                  <CardDescription>Observed and projected attendance percentages</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendancePoints.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          ...attendancePoints.map((p) => ({ period: p.label, observed: p.attendance })),
                          ...attendanceForecast.map((f) => ({ period: f.period, forecast: f.forecast })),
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="observed" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Observed" />
                          <Line type="monotone" dataKey="forecast" stroke="#ea580c" strokeDasharray="6 4" strokeWidth={2.5} dot={false} name="Forecast" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">No attendance data available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payroll" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "YTD Gross", value: `\u20b9${totalPayrollGross.toLocaleString()}` },
                  { label: "Latest Month Net", value: latestPayroll ? `\u20b9${(latestPayroll.total_net ?? 0).toLocaleString()}` : "N/A" },
                  { label: "Latest Deductions", value: latestPayroll ? `\u20b9${(latestPayroll.total_deductions ?? 0).toLocaleString()}` : "N/A" },
                  { label: "Employees Paid", value: latestPayroll?.employee_count ?? 0 },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-4 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Payroll Trend</CardTitle>
                    <CardDescription>Monthly gross vs net payroll</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payrollPoints.length > 0 ? (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={payrollPoints}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `\u20b9${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => `\u20b9${v.toLocaleString()}`} />
                            <Bar dataKey="gross" name="Gross" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="net" name="Net" fill="#16a34a" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No payroll run data available yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Breakdown</CardTitle>
                    <CardDescription>Deduction trend across payroll runs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payrollPoints.length > 0 ? (
                      <div className="space-y-3">
                        {payrollPoints.slice(-6).map((p) => {
                          const deductionPct = p.gross > 0 ? (p.deductions / p.gross) * 100 : 0;
                          return (
                            <div key={p.label}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span>{p.label}</span>
                                <span>{formatPct(deductionPct)} deducted</span>
                              </div>
                              <Progress value={deductionPct} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No payroll data to analyze.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}