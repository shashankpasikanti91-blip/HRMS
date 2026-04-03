"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, PieChart, TrendingUp, TrendingDown, Download, Users, DollarSign, Clock } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">AI-powered insights and workforce analytics</p>
        </div>
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export Report</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Attrition Rate", value: "4.2%", change: "-0.8%", trend: "down", icon: TrendingDown, color: "text-green-600" },
          { label: "Avg. Tenure", value: "2.8 yrs", change: "+0.3", trend: "up", icon: Users, color: "text-blue-600" },
          { label: "Cost per Hire", value: "$4,250", change: "-12%", trend: "down", icon: DollarSign, color: "text-green-600" },
          { label: "Time to Fill", value: "32 days", change: "-5 days", trend: "down", icon: Clock, color: "text-green-600" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <Badge variant={kpi.trend === "down" ? "success" : "default"} className="text-xs">{kpi.change}</Badge>
              </div>
              <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="workforce">
        <TabsList>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="attrition">Attrition Risk</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="diversity">Diversity</TabsTrigger>
        </TabsList>

        <TabsContent value="workforce" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Headcount Trend</CardTitle>
                <CardDescription>12-month employee headcount changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { month: "Oct 2024", count: 230, change: +5 },
                    { month: "Nov 2024", count: 235, change: +5 },
                    { month: "Dec 2024", count: 238, change: +3 },
                    { month: "Jan 2025", count: 242, change: +4 },
                    { month: "Feb 2025", count: 245, change: +3 },
                    { month: "Mar 2025", count: 248, change: +3 },
                  ].map((m) => (
                    <div key={m.month} className="flex items-center justify-between text-sm">
                      <span>{m.month}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(m.count / 300) * 100} className="h-2 w-32" />
                        <span className="w-8 text-right font-medium">{m.count}</span>
                        <span className="w-10 text-right text-green-600">+{m.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Employees by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Engineering", count: 82, percent: 33, color: "bg-blue-500" },
                    { name: "Sales", count: 45, percent: 18, color: "bg-green-500" },
                    { name: "Operations", count: 53, percent: 22, color: "bg-orange-500" },
                    { name: "Marketing", count: 28, percent: 11, color: "bg-purple-500" },
                    { name: "HR", count: 22, percent: 9, color: "bg-pink-500" },
                    { name: "Finance", count: 18, percent: 7, color: "bg-cyan-500" },
                  ].map((dept) => (
                    <div key={dept.name} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${dept.color}`} />
                      <span className="w-24 text-sm">{dept.name}</span>
                      <Progress value={dept.percent} className="h-2 flex-1" />
                      <span className="w-20 text-right text-sm text-muted-foreground">{dept.count} ({dept.percent}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attrition" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attrition Risk Analysis</CardTitle>
              <CardDescription>AI-predicted flight risk across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Rahul Kumar", department: "Engineering", risk: 78, level: "high", factors: ["Low compensation growth", "No promotion in 3 years"] },
                  { name: "Vikram Singh", department: "Sales", risk: 65, level: "medium", factors: ["Manager change", "Below market salary"] },
                  { name: "Priya Sharma", department: "Marketing", risk: 42, level: "medium", factors: ["Limited growth opportunities"] },
                  { name: "Arjun Patel", department: "Engineering", risk: 15, level: "low", factors: [] },
                  { name: "Sneha Gupta", department: "HR", risk: 10, level: "low", factors: [] },
                ].map((emp) => (
                  <div key={emp.name} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.department}</p>
                        </div>
                        <Badge variant={emp.level === "high" ? "destructive" : emp.level === "medium" ? "warning" : "success"}>
                          {emp.risk}% risk
                        </Badge>
                      </div>
                      {emp.factors.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {emp.factors.map((f) => (
                            <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
