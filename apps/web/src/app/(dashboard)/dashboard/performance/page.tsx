"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Star, TrendingUp, Award } from "lucide-react";

export default function PerformancePage() {
  const goals = [
    { id: "1", title: "Complete API Integration", owner: "Arjun Patel", deadline: "Apr 15, 2025", progress: 75, status: "in_progress" },
    { id: "2", title: "Launch Marketing Campaign", owner: "Priya Sharma", deadline: "Mar 30, 2025", progress: 90, status: "in_progress" },
    { id: "3", title: "Hire 5 Engineers", owner: "Sneha Gupta", deadline: "Jun 30, 2025", progress: 40, status: "in_progress" },
    { id: "4", title: "Reduce Bug Backlog by 50%", owner: "Rahul Kumar", deadline: "May 1, 2025", progress: 100, status: "completed" },
    { id: "5", title: "Achieve 98% Uptime SLA", owner: "Vikram Singh", deadline: "Q1 2025", progress: 95, status: "in_progress" },
  ];

  const reviews = [
    { employee: "Arjun Patel", cycle: "Q1 2025", rating: 4.5, status: "submitted" },
    { employee: "Priya Sharma", cycle: "Q1 2025", rating: 4.2, status: "approved" },
    { employee: "Rahul Kumar", cycle: "Q1 2025", rating: 3.8, status: "draft" },
    { employee: "Sneha Gupta", cycle: "Q1 2025", rating: 4.0, status: "submitted" },
  ];

  const statusColors: Record<string, "success" | "warning" | "default" | "secondary"> = {
    completed: "success",
    in_progress: "warning",
    not_started: "secondary",
    submitted: "default",
    approved: "success",
    draft: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground">Goals, reviews, and skill development tracking</p>
        </div>
        <Button size="sm"><Target className="mr-2 h-4 w-4" />Create Goal</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Active Goals", value: "124", icon: Target, color: "text-blue-600" },
          { label: "Avg. Rating", value: "4.2", icon: Star, color: "text-yellow-600" },
          { label: "Reviews Due", value: "18", icon: TrendingUp, color: "text-orange-600" },
          { label: "Top Performers", value: "32", icon: Award, color: "text-green-600" },
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

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Goals</CardTitle>
              <CardDescription>Track goal progress across the organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{goal.title}</p>
                      <Badge variant={statusColors[goal.status]}>{goal.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{goal.owner} &middot; Due: {goal.deadline}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={goal.progress} className="h-2 flex-1" />
                      <span className="text-xs font-medium">{goal.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Employee</th>
                    <th className="p-3 text-left text-sm font-medium">Cycle</th>
                    <th className="p-3 text-left text-sm font-medium">Rating</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-sm font-medium">{r.employee}</td>
                      <td className="p-3 text-sm">{r.cycle}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {r.rating}
                        </div>
                      </td>
                      <td className="p-3"><Badge variant={statusColors[r.status]}>{r.status}</Badge></td>
                      <td className="p-3"><Button size="sm" variant="outline">View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
