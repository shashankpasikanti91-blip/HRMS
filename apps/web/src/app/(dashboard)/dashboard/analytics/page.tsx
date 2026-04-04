"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Users, DollarSign, Clock, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { analyticsService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  executive?: {
    totalEmployees?: number;
    attritionRate?: number;
    avgTenure?: number;
    costPerHire?: number;
    timeToFill?: number;
    headcountTrend?: Array<{ month: string; count: number; change: number }>;
    departmentDistribution?: Array<{ name: string; count: number; percent: number }>;
  };
  workforce?: {
    genderDistribution?: Array<{ label: string; count: number; percent: number }>;
    ageDistribution?: Array<{ label: string; count: number; percent: number }>;
    tenureDistribution?: Array<{ label: string; count: number; percent: number }>;
  };
  attendance?: {
    avgAttendance?: number;
    latePercentage?: number;
    leaveUtilization?: number;
    overtimeHours?: number;
  };
  recruitment?: {
    openPositions?: number;
    totalApplications?: number;
    interviewToOffer?: number;
    avgTimeToHire?: number;
  };
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("last_30_days");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [execRes, workforceRes, attendanceRes, recruitRes] = await Promise.allSettled([
        analyticsService.getExecutiveDashboard({ period }),
        analyticsService.getWorkforceAnalytics({ period }),
        analyticsService.getAttendanceAnalytics({ period }),
        analyticsService.getRecruitmentAnalytics({ period }),
      ]);
      setData({
        executive: execRes.status === "fulfilled" ? execRes.value : {},
        workforce: workforceRes.status === "fulfilled" ? workforceRes.value : {},
        attendance: attendanceRes.status === "fulfilled" ? attendanceRes.value : {},
        recruitment: recruitRes.status === "fulfilled" ? recruitRes.value : {},
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const exec = data.executive || {};
  const dept = exec.departmentDistribution || [];
  const headcount = exec.headcountTrend || [];
  const workforce = data.workforce || {};
  const attendance = data.attendance || {};
  const recruitment = data.recruitment || {};

  const DEPT_COLORS = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500", "bg-red-500", "bg-yellow-500"];

  function handleExport() {
    toast({ title: "Exporting", description: "Report export will be downloaded shortly" });
    // In production, call analyticsService export endpoint
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
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Employees", value: exec.totalEmployees ?? "—", icon: Users, color: "text-blue-600" },
              { label: "Attrition Rate", value: exec.attritionRate != null ? `${exec.attritionRate}%` : "—", icon: TrendingDown, color: "text-green-600" },
              { label: "Avg. Attendance", value: attendance.avgAttendance != null ? `${attendance.avgAttendance}%` : "—", icon: Clock, color: "text-orange-600" },
              { label: "Open Positions", value: recruitment.openPositions ?? "—", icon: BarChart3, color: "text-purple-600" },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="workforce">
            <TabsList>
              <TabsTrigger value="workforce">Workforce</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
            </TabsList>

            <TabsContent value="workforce" className="mt-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Headcount Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Headcount Trend</CardTitle>
                    <CardDescription>Employee headcount over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {headcount.length > 0 ? (
                      <div className="space-y-3">
                        {headcount.map((m) => (
                          <div key={m.month} className="flex items-center justify-between text-sm">
                            <span className="w-20">{m.month}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={Math.min((m.count / (exec.totalEmployees || m.count) ) * 80 + 20, 100)} className="h-2 w-32" />
                              <span className="w-8 text-right font-medium">{m.count}</span>
                              <span className={`w-10 text-right ${m.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {m.change >= 0 ? "+" : ""}{m.change}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No headcount trend data available.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Department Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Department Distribution</CardTitle>
                    <CardDescription>Employees by department</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dept.length > 0 ? (
                      <div className="space-y-4">
                        {dept.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${DEPT_COLORS[i % DEPT_COLORS.length]}`} />
                            <span className="w-24 text-sm">{d.name}</span>
                            <Progress value={d.percent} className="h-2 flex-1" />
                            <span className="w-20 text-right text-sm text-muted-foreground">{d.count} ({d.percent}%)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No department distribution data available.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Demographics */}
                {(workforce.genderDistribution || workforce.ageDistribution) && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Workforce Demographics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 sm:grid-cols-2">
                        {workforce.genderDistribution && (
                          <div>
                            <p className="mb-3 text-sm font-medium">Gender Distribution</p>
                            <div className="space-y-2">
                              {workforce.genderDistribution.map((g) => (
                                <div key={g.label} className="flex items-center gap-2 text-sm">
                                  <span className="w-16">{g.label}</span>
                                  <Progress value={g.percent} className="h-2 flex-1" />
                                  <span className="w-16 text-right text-muted-foreground">{g.count} ({g.percent}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {workforce.ageDistribution && (
                          <div>
                            <p className="mb-3 text-sm font-medium">Age Distribution</p>
                            <div className="space-y-2">
                              {workforce.ageDistribution.map((a) => (
                                <div key={a.label} className="flex items-center gap-2 text-sm">
                                  <span className="w-16">{a.label}</span>
                                  <Progress value={a.percent} className="h-2 flex-1" />
                                  <span className="w-16 text-right text-muted-foreground">{a.count} ({a.percent}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Avg Attendance Rate", value: attendance.avgAttendance != null ? `${attendance.avgAttendance}%` : "—" },
                  { label: "Late Arrival %", value: attendance.latePercentage != null ? `${attendance.latePercentage}%` : "—" },
                  { label: "Leave Utilization", value: attendance.leaveUtilization != null ? `${attendance.leaveUtilization}%` : "—" },
                  { label: "Overtime Hours", value: attendance.overtimeHours != null ? `${attendance.overtimeHours}h` : "—" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recruitment" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Open Positions", value: recruitment.openPositions ?? "—" },
                  { label: "Total Applications", value: recruitment.totalApplications ?? "—" },
                  { label: "Interview to Offer %", value: recruitment.interviewToOffer != null ? `${recruitment.interviewToOffer}%` : "—" },
                  { label: "Avg Time to Hire", value: recruitment.avgTimeToHire != null ? `${recruitment.avgTimeToHire} days` : "—" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
