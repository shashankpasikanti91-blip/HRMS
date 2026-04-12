"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Users, Clock, Loader2, TrendingUp } from "lucide-react";
import { analyticsService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import type { DashboardStats, AttendanceSummaryItem, HeadcountByDept } from "@/types";

interface RecruitmentFunnelData {
  stages?: Array<{ stage: string; count: number; conversion?: number }>;
  total_applications?: number;
  open_positions?: number;
  avg_time_to_hire?: number;
}

interface AnalyticsData {
  dashboard: DashboardStats | null;
  attendance: AttendanceSummaryItem[];
  headcount: HeadcountByDept[];
  recruitment: RecruitmentFunnelData;
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData>({ dashboard: null, attendance: [], headcount: [], recruitment: {} });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("last_30_days");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, attendRes, headRes, recruitRes] = await Promise.allSettled([
        analyticsService.getDashboard(),
        analyticsService.getAttendanceSummary(),
        analyticsService.getHeadcount(),
        analyticsService.getRecruitmentFunnel(),
      ]);
      setData({
        dashboard: dashRes.status === "fulfilled" ? dashRes.value : null,
        attendance: attendRes.status === "fulfilled" ? attendRes.value : [],
        headcount: headRes.status === "fulfilled" ? headRes.value : [],
        recruitment: recruitRes.status === "fulfilled" ? recruitRes.value : {},
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const dash = data.dashboard;
  const attendSummary = data.attendance;
  const headcountData = data.headcount;
  const recruitData = data.recruitment;

  const DEPT_COLORS = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500", "bg-red-500", "bg-yellow-500"];

  function handleExport() {
    toast({ title: "Exporting", description: "Generating report..." });
    try {
      const reportData = {
        period,
        dashboard: dash,
        attendance: attendSummary,
        headcount: headcountData,
        recruitment: recruitData,
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
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Employees", value: dash?.total_employees ?? "—", icon: Users, color: "text-blue-600" },
              { label: "Active Employees", value: dash?.active_employees ?? "—", icon: TrendingUp, color: "text-green-600" },
              { label: "Present Today", value: dash?.present_today ?? "—", icon: Clock, color: "text-orange-600" },
              { label: "Open Positions", value: dash?.open_jobs ?? recruitData.open_positions ?? "—", icon: BarChart3, color: "text-purple-600" },
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
                {/* Headcount by Department */}
                <Card>
                  <CardHeader>
                    <CardTitle>Headcount by Department</CardTitle>
                    <CardDescription>Employee distribution across departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {headcountData.length > 0 ? (
                      <div className="space-y-3">
                        {headcountData.map((d, i) => (
                          <div key={d.department_name} className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${DEPT_COLORS[i % DEPT_COLORS.length]}`} />
                            <span className="w-28 text-sm truncate">{d.department_name}</span>
                            <Progress value={dash?.total_employees ? Math.round((d.total / dash.total_employees) * 100) : 0} className="h-2 flex-1" />
                            <span className="w-8 text-right text-sm font-medium">{d.total}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No headcount data available.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Attendance Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Recent attendance patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {attendSummary.length > 0 ? (
                      <div className="space-y-2">
                        {attendSummary.slice(0, 7).map((a) => (
                          <div key={a.date} className="flex items-center justify-between text-sm">
                            <span className="w-24 text-muted-foreground">{new Date(a.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                            <Progress value={a.attendance_percentage ?? 0} className="h-2 flex-1 mx-3" />
                            <span className="w-12 text-right">{a.present ?? 0}/{a.total_employees ?? 0}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">No attendance summary available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trend</CardTitle>
                  <CardDescription>Daily attendance statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendSummary.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left text-sm font-medium">Date</th>
                          <th className="p-3 text-left text-sm font-medium">Present</th>
                          <th className="p-3 text-left text-sm font-medium">Absent</th>
                          <th className="p-3 text-left text-sm font-medium">Rate</th>
                          <th className="p-3 text-left text-sm font-medium">Late</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendSummary.map((a) => (
                          <tr key={a.date} className="border-b last:border-0">
                            <td className="p-3 text-sm">{new Date(a.date).toLocaleDateString()}</td>
                            <td className="p-3 text-sm">{a.present ?? 0}</td>
                            <td className="p-3 text-sm">{a.absent ?? 0}</td>
                            <td className="p-3 text-sm">{a.attendance_percentage != null ? `${a.attendance_percentage.toFixed(1)}%` : "—"}</td>
                            <td className="p-3 text-sm">{a.late ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">No attendance data available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recruitment" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Open Positions", value: dash?.open_jobs ?? recruitData.open_positions ?? "—" },
                  { label: "Total Applications", value: recruitData.total_applications ?? "—" },
                  { label: "Pipeline Stages", value: recruitData.stages?.length ?? "—" },
                  { label: "Avg Time to Hire", value: recruitData.avg_time_to_hire != null ? `${recruitData.avg_time_to_hire} days` : "—" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {recruitData.stages && recruitData.stages.length > 0 && (
                <Card className="mt-4">
                  <CardHeader><CardTitle>Recruitment Funnel</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recruitData.stages.map((s) => (
                        <div key={s.stage} className="flex items-center gap-3">
                          <span className="w-24 text-sm capitalize">{s.stage}</span>
                          <Progress value={recruitData.total_applications ? Math.round((s.count / recruitData.total_applications) * 100) : 0} className="h-2 flex-1" />
                          <span className="w-8 text-right text-sm font-medium">{s.count}</span>
                          {s.conversion != null && <span className="w-12 text-right text-xs text-muted-foreground">{s.conversion}%</span>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}