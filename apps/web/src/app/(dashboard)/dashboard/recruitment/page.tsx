"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Briefcase, Users, MapPin, Clock } from "lucide-react";

export default function RecruitmentPage() {
  const jobs = [
    { id: "1", title: "Senior Frontend Developer", department: "Engineering", location: "Remote", type: "Full-time", openings: 3, applications: 42, status: "open" },
    { id: "2", title: "Product Manager", department: "Product", location: "Bangalore", type: "Full-time", openings: 1, applications: 28, status: "open" },
    { id: "3", title: "UX Designer", department: "Design", location: "Hybrid", type: "Full-time", openings: 2, applications: 35, status: "open" },
    { id: "4", title: "DevOps Engineer", department: "Engineering", location: "Remote", type: "Full-time", openings: 1, applications: 18, status: "on_hold" },
    { id: "5", title: "Marketing Lead", department: "Marketing", location: "Mumbai", type: "Full-time", openings: 1, applications: 15, status: "closed" },
  ];

  const pipeline = [
    { stage: "Applied", count: 138, color: "bg-blue-500" },
    { stage: "Screening", count: 52, color: "bg-yellow-500" },
    { stage: "Interview", count: 24, color: "bg-purple-500" },
    { stage: "Offer", count: 8, color: "bg-green-500" },
    { stage: "Hired", count: 5, color: "bg-emerald-500" },
  ];

  const statusColors: Record<string, "success" | "warning" | "secondary"> = {
    open: "success",
    on_hold: "warning",
    closed: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">Manage job postings, candidates, and hiring pipeline</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Post Job</Button>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Hiring Pipeline</CardTitle>
          <CardDescription>Current candidate distribution across stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {pipeline.map((p) => (
              <div key={p.stage} className="flex-1 text-center">
                <div className={`mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full ${p.color} text-white text-lg font-bold`}>
                  {p.count}
                </div>
                <p className="text-sm font-medium">{p.stage}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <Badge variant={statusColors[job.status]}>{job.status.replace("_", " ")}</Badge>
                  </div>
                  <CardDescription>{job.department}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{job.location}</div>
                    <div className="flex items-center gap-2"><Clock className="h-3 w-3" />{job.type}</div>
                    <div className="flex items-center gap-2"><Briefcase className="h-3 w-3" />{job.openings} openings</div>
                    <div className="flex items-center gap-2"><Users className="h-3 w-3" />{job.applications} applications</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
