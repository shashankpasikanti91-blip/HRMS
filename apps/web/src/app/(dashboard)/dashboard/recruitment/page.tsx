"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Briefcase, Users, MapPin, Clock, Loader2, Star, Mail, Phone } from "lucide-react";
import { recruitmentService, departmentService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import type { JobPosting, Candidate, Department } from "@/types";

export default function RecruitmentPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "", departmentId: "", description: "", location: "",
    type: "full_time", openings: "1", requirements: "",
  });
  const [candidateForm, setCandidateForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", jobPostingId: "", resumeUrl: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsResult, candidatesResult, deptsResult] = await Promise.allSettled([
        recruitmentService.getJobs(),
        recruitmentService.getCandidates(),
        departmentService.list(),
      ]);
      if (jobsResult.status === "fulfilled") setJobs(Array.isArray(jobsResult.value) ? jobsResult.value : []);
      if (candidatesResult.status === "fulfilled") setCandidates(Array.isArray(candidatesResult.value) ? candidatesResult.value : []);
      if (deptsResult.status === "fulfilled") setDepartments(Array.isArray(deptsResult.value) ? deptsResult.value : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate pipeline from candidates
  const pipeline = [
    { stage: "Applied", count: candidates.filter((c) => c.stage === "applied").length, color: "bg-blue-500" },
    { stage: "Screening", count: candidates.filter((c) => c.stage === "screening").length, color: "bg-yellow-500" },
    { stage: "Interview", count: candidates.filter((c) => c.stage === "interview").length, color: "bg-purple-500" },
    { stage: "Offer", count: candidates.filter((c) => c.stage === "offer").length, color: "bg-green-500" },
    { stage: "Hired", count: candidates.filter((c) => c.stage === "hired").length, color: "bg-emerald-500" },
  ];

  async function handleCreateJob() {
    if (!jobForm.title || !jobForm.description) {
      toast({ title: "Validation Error", description: "Title and description are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await recruitmentService.createJob({
        ...jobForm,
        openings: parseInt(jobForm.openings) || 1,
        requirements: jobForm.requirements.split("\n").filter(Boolean),
      } as unknown as Partial<JobPosting>);
      toast({ title: "Success", description: "Job posted successfully", variant: "success" });
      setJobDialogOpen(false);
      setJobForm({ title: "", departmentId: "", description: "", location: "", type: "full_time", openings: "1", requirements: "" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to create job posting", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCandidate() {
    if (!candidateForm.firstName || !candidateForm.lastName || !candidateForm.email) {
      toast({ title: "Validation Error", description: "Name and email are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await recruitmentService.createCandidate(candidateForm);
      toast({ title: "Success", description: "Candidate added successfully", variant: "success" });
      setCandidateDialogOpen(false);
      setCandidateForm({ firstName: "", lastName: "", email: "", phone: "", jobPostingId: "", resumeUrl: "" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to add candidate", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function updateCandidateStage(id: string, stage: string) {
    try {
      await recruitmentService.updateCandidate(id, { stage } as Partial<Candidate>);
      toast({ title: "Updated", description: `Candidate moved to ${stage}`, variant: "success" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to update candidate", variant: "destructive" });
    }
  }

  const statusColors: Record<string, "success" | "warning" | "secondary"> = {
    open: "success", draft: "secondary", on_hold: "warning", closed: "secondary",
  };
  const stageColors: Record<string, "default" | "warning" | "secondary" | "success" | "destructive"> = {
    applied: "default", screening: "warning", interview: "secondary", offer: "success", hired: "success", rejected: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">Manage job postings, candidates, and hiring pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCandidateDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />Add Candidate
          </Button>
          <Button onClick={() => setJobDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Post Job
          </Button>
        </div>
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
          <TabsTrigger value="jobs">Job Postings ({jobs.length})</TabsTrigger>
          <TabsTrigger value="candidates">Candidates ({candidates.length})</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : jobs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Card key={job.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedJob(job)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <Badge variant={statusColors[job.status] || "secondary"}>{job.status?.replace("_", " ")}</Badge>
                    </div>
                    <CardDescription>{job.department?.name || "No department"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{job.location || "Not specified"}</div>
                      <div className="flex items-center gap-2"><Clock className="h-3 w-3" />{job.type?.replace("_", " ") || "Full time"}</div>
                      <div className="flex items-center gap-2"><Briefcase className="h-3 w-3" />{job.openings} openings</div>
                      <div className="flex items-center gap-2"><Users className="h-3 w-3" />{job.applicationsCount || 0} applications</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Briefcase className="mx-auto mb-2 h-8 w-8" />
                <p>No job postings yet. Click &quot;Post Job&quot; to create your first listing.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="candidates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Candidates</CardTitle>
              <CardDescription>Manage candidate pipeline and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {candidates.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Candidate</th>
                      <th className="p-3 text-left text-sm font-medium">Email</th>
                      <th className="p-3 text-left text-sm font-medium">AI Score</th>
                      <th className="p-3 text-left text-sm font-medium">Stage</th>
                      <th className="p-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="p-3 text-sm font-medium">{c.firstName} {c.lastName}</td>
                        <td className="p-3 text-sm text-muted-foreground">{c.email}</td>
                        <td className="p-3 text-sm">
                          {c.aiScore != null ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {Number(c.aiScore).toFixed(0)}%
                            </div>
                          ) : "—"}
                        </td>
                        <td className="p-3"><Badge variant={stageColors[c.stage] || "default"}>{c.stage}</Badge></td>
                        <td className="p-3">
                          <Select value={c.stage} onValueChange={(val) => updateCandidateStage(c.id, val)}>
                            <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="screening">Screening</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="offer">Offer</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="py-8 text-center text-muted-foreground">No candidates yet. Add candidates or wait for applications.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Interview Schedule</CardTitle>
              <CardDescription>Upcoming and past interviews</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-muted-foreground">Interview scheduling will load from the recruitment service.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post New Job</DialogTitle>
            <DialogDescription>Create a job posting to attract candidates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Job Title *</Label>
              <Input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Senior Frontend Developer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={jobForm.departmentId} onValueChange={(val) => setJobForm({ ...jobForm, departmentId: val })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder="e.g. Remote, Bangalore" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={jobForm.type} onValueChange={(val) => setJobForm({ ...jobForm, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Openings</Label>
                <Input type="number" min="1" value={jobForm.openings} onChange={(e) => setJobForm({ ...jobForm, openings: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea rows={4} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Job description..." />
            </div>
            <div className="space-y-2">
              <Label>Requirements (one per line)</Label>
              <Textarea rows={3} value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} placeholder="3+ years React experience&#10;TypeScript proficiency&#10;..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateJob} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Dialog */}
      <Dialog open={candidateDialogOpen} onOpenChange={setCandidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
            <DialogDescription>Manually add a candidate to the pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={candidateForm.firstName} onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={candidateForm.lastName} onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={candidateForm.phone} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Job Posting</Label>
              <Select value={candidateForm.jobPostingId} onValueChange={(val) => setCandidateForm({ ...candidateForm, jobPostingId: val })}>
                <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resume URL</Label>
              <Input value={candidateForm.resumeUrl} onChange={(e) => setCandidateForm({ ...candidateForm, resumeUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCandidateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCandidate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
