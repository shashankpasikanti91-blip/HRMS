"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase, Users, CalendarCheck, Award, UserPlus, FileText, Loader2,
  Upload, Search, Brain, Send, Copy, CheckCircle, XCircle, AlertTriangle,
  Eye, Trash2, Plus, ChevronRight, BarChart3, Sparkles, Globe, Mail, MessageCircle,
  GripVertical, X,
} from "lucide-react";
import {
  jobService, candidateService, applicationService, interviewService,
  aiRecruitmentService, departmentService,
} from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type {
  JobPosting, Candidate, Application, Interview, DepartmentSummary,
  AIScreeningResult, AIJobPosts,
} from "@/types";

// ── Pipeline Stages ───────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: "applied", label: "Applied", color: "bg-blue-500" },
  { key: "screening", label: "Screening", color: "bg-yellow-500" },
  { key: "interview", label: "Interview", color: "bg-purple-500" },
  { key: "offer", label: "Offer", color: "bg-indigo-500" },
  { key: "hired", label: "Hired", color: "bg-green-500" },
] as const;

type TabKey = "jobs" | "candidates" | "interviews" | "ai-screening" | "ai-job-posts";

export default function RecruitmentPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");
  const [loading, setLoading] = useState(true);

  // Data
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);

  // Pipeline counts
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({});

  // Dialogs
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [candidateDetailOpen, setCandidateDetailOpen] = useState(false);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // AI States
  const [screening, setScreening] = useState(false);
  const [screeningResult, setScreeningResult] = useState<AIScreeningResult | null>(null);
  const [generatingPosts, setGeneratingPosts] = useState(false);
  const [jobPosts, setJobPosts] = useState<AIJobPosts | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form States
  const [processing, setProcessing] = useState(false);

  // ── Load Data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, candidatesRes, appsRes, interviewsRes, deptsRes] = await Promise.allSettled([
        jobService.list({ page_size: 100 }),
        candidateService.list({ page_size: 100 }),
        applicationService.list({ page_size: 200 }),
        interviewService.list({ page_size: 100 }),
        departmentService.listAll(),
      ]);

      if (jobsRes.status === "fulfilled") setJobs(jobsRes.value.data ?? []);
      if (candidatesRes.status === "fulfilled") setCandidates(candidatesRes.value.data ?? []);
      if (interviewsRes.status === "fulfilled") setInterviews(interviewsRes.value.data ?? []);
      if (deptsRes.status === "fulfilled") setDepartments(deptsRes.value ?? []);

      if (appsRes.status === "fulfilled") {
        const apps = appsRes.value.data ?? [];
        setApplications(apps);
        const counts: Record<string, number> = {};
        for (const st of PIPELINE_STAGES) {
          counts[st.key] = apps.filter((a) => a.current_stage === st.key).length;
        }
        setPipelineCounts(counts);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load recruitment data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Job CRUD ───────────────────────────────────────────────────────────
  const [jobForm, setJobForm] = useState({
    title: "", department_id: "", description: "", requirements: "",
    employment_type: "full_time", location: "", openings: 1, closing_date: "",
  });

  async function handleCreateJob() {
    if (!jobForm.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setProcessing(true);
    try {
      await jobService.create({
        title: jobForm.title,
        department_id: jobForm.department_id || undefined,
        description: jobForm.description || undefined,
        requirements: jobForm.requirements || undefined,
        employment_type: jobForm.employment_type,
        location: jobForm.location || undefined,
        openings: jobForm.openings,
        closing_date: jobForm.closing_date || undefined,
      });
      toast({ title: "Job Posted", description: `"${jobForm.title}" has been created`, variant: "success" });
      setJobDialogOpen(false);
      setJobForm({ title: "", department_id: "", description: "", requirements: "", employment_type: "full_time", location: "", openings: 1, closing_date: "" });
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to create job";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  // ── Candidate CRUD ─────────────────────────────────────────────────────
  const [candidateForm, setCandidateForm] = useState({
    full_name: "", email: "", phone: "", current_role: "",
    years_of_experience: 0, source: "direct", resume_url: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidResumeFile(file)) {
        setResumeFile(file);
      } else {
        toast({ title: "Invalid file", description: "Please upload PDF, DOC, or DOCX files only", variant: "destructive" });
      }
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidResumeFile(file)) {
        setResumeFile(file);
      } else {
        toast({ title: "Invalid file", description: "Please upload PDF, DOC, or DOCX files only", variant: "destructive" });
      }
    }
  }

  function isValidResumeFile(file: File): boolean {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return validTypes.includes(file.type) || /\.(pdf|doc|docx)$/i.test(file.name);
  }

  async function handleCreateCandidate() {
    if (!candidateForm.full_name.trim() || !candidateForm.email.trim()) {
      toast({ title: "Name and email required", variant: "destructive" }); return;
    }
    setProcessing(true);
    try {
      await candidateService.create({
        full_name: candidateForm.full_name,
        email: candidateForm.email,
        phone: candidateForm.phone || undefined,
        current_role: candidateForm.current_role || undefined,
        years_of_experience: candidateForm.years_of_experience || undefined,
        source: candidateForm.source || undefined,
        resume_url: candidateForm.resume_url || undefined,
      });
      toast({ title: "Candidate Added", description: `${candidateForm.full_name} has been added`, variant: "success" });
      setCandidateDialogOpen(false);
      setCandidateForm({ full_name: "", email: "", phone: "", current_role: "", years_of_experience: 0, source: "direct", resume_url: "" });
      setResumeFile(null);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to add candidate";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  // ── AI Screening ───────────────────────────────────────────────────────
  const [screenJD, setScreenJD] = useState("");
  const [screenResume, setScreenResume] = useState("");
  const [screenFile, setScreenFile] = useState<File | null>(null);
  const screenFileRef = useRef<HTMLInputElement>(null);
  const [screenDrag, setScreenDrag] = useState(false);

  async function handleAIScreen() {
    if (!screenJD.trim()) {
      toast({ title: "Job description required", variant: "destructive" }); return;
    }
    setScreening(true);
    setScreeningResult(null);
    try {
      let result: AIScreeningResult;
      if (screenFile) {
        result = await aiRecruitmentService.screenCandidateFile(screenJD, screenFile);
      } else if (screenResume.trim()) {
        result = await aiRecruitmentService.screenCandidate(screenJD, screenResume);
      } else {
        toast({ title: "Resume required", description: "Paste resume text or upload a file", variant: "destructive" });
        setScreening(false);
        return;
      }
      setScreeningResult(result);
      if (result.error) {
        toast({ title: "Screening Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Screening Complete", description: `Score: ${result.score}/100 — ${result.decision}`, variant: "success" });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "AI screening failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setScreening(false);
    }
  }

  // ── AI Job Post Generation ─────────────────────────────────────────────
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const jdFileRef = useRef<HTMLInputElement>(null);
  const [jdDrag, setJdDrag] = useState(false);

  async function handleGenerateJobPosts() {
    if (!jdText.trim() && !jdFile) {
      toast({ title: "Job description required", description: "Paste JD text or upload a file", variant: "destructive" }); return;
    }
    setGeneratingPosts(true);
    setJobPosts(null);
    try {
      let result: AIJobPosts;
      if (jdFile) {
        result = await aiRecruitmentService.generateJobPostsFile(jdFile);
      } else {
        result = await aiRecruitmentService.generateJobPosts(jdText);
      }
      setJobPosts(result);
      if (result.error) {
        toast({ title: "Generation Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Posts Generated", description: "LinkedIn, Indeed, Email, and WhatsApp posts are ready", variant: "success" });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Job post generation failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setGeneratingPosts(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied!", description: `${field} post copied to clipboard` });
  }

  // ── Score helpers ──────────────────────────────────────────────────────
  function scoreColor(score: number) {
    if (score >= 75) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }
  function scoreBg(score: number) {
    if (score >= 75) return "bg-green-100 border-green-300";
    if (score >= 60) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">Manage job postings, candidates, and hiring pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCandidateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />Add Candidate
          </Button>
          <Button onClick={() => setJobDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Post Job
          </Button>
        </div>
      </div>

      {/* Hiring Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Hiring Pipeline</CardTitle>
          <CardDescription>Current candidate distribution across stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage.key} className="text-center">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${stage.color} text-white text-xl font-bold`}>
                  {pipelineCounts[stage.key] || 0}
                </div>
                <p className="mt-2 text-sm font-medium">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="jobs" className="gap-1"><Briefcase className="h-4 w-4" />Job Postings ({jobs.length})</TabsTrigger>
          <TabsTrigger value="candidates" className="gap-1"><Users className="h-4 w-4" />Candidates ({candidates.length})</TabsTrigger>
          <TabsTrigger value="interviews" className="gap-1"><CalendarCheck className="h-4 w-4" />Interviews</TabsTrigger>
          <TabsTrigger value="ai-screening" className="gap-1"><Brain className="h-4 w-4" />AI Screening</TabsTrigger>
          <TabsTrigger value="ai-job-posts" className="gap-1"><Sparkles className="h-4 w-4" />AI Job Posts</TabsTrigger>
        </TabsList>

        {/* ── Job Postings Tab ──────────────────────────────────────────── */}
        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Postings</CardTitle>
              <CardDescription>Manage open positions and track applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{job.title}</h3>
                          <Badge variant={job.status === "open" ? "success" : job.status === "closed" ? "destructive" : "secondary"}>
                            {job.status}
                          </Badge>
                          {job.employment_type && <Badge variant="outline">{job.employment_type.replace("_", " ")}</Badge>}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          {job.department_name && <span>{job.department_name}</span>}
                          {job.location && <span>📍 {job.location}</span>}
                          {job.openings > 0 && <span>{job.openings} opening{job.openings > 1 ? "s" : ""}</span>}
                          {job.applications_count !== undefined && <span>{job.applications_count} application{job.applications_count !== 1 ? "s" : ""}</span>}
                        </div>
                        {job.closing_date && (
                          <p className="mt-1 text-xs text-muted-foreground">Closes: {new Date(job.closing_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedJob(job); setJobDetailOpen(true); }}>
                          <Eye className="mr-1 h-3 w-3" />View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Briefcase className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p className="font-medium">No job postings yet</p>
                  <p className="text-sm">Click &quot;Post Job&quot; to create your first listing.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Candidates Tab ───────────────────────────────────────────── */}
        <TabsContent value="candidates" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Candidates</CardTitle>
                <CardDescription>All candidates in the recruitment pipeline</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : candidates.length > 0 ? (
                <div className="space-y-3">
                  {candidates.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => { setSelectedCandidate(c); setCandidateDetailOpen(true); }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{c.full_name}</h3>
                          <Badge variant={c.status === "active" ? "success" : c.status === "hired" ? "default" : "secondary"}>
                            {c.status}
                          </Badge>
                          {c.ai_score !== null && c.ai_score !== undefined && (
                            <Badge variant="outline" className={scoreColor(c.ai_score)}>
                              AI: {c.ai_score}/100
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{c.email}</span>
                          {c.current_role && <span>{c.current_role}</span>}
                          {c.current_company && <span>@ {c.current_company}</span>}
                          {c.years_of_experience !== null && c.years_of_experience !== undefined && (
                            <span>{c.years_of_experience}y exp</span>
                          )}
                          {c.source && <span>Source: {c.source}</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p className="font-medium">No candidates yet</p>
                  <p className="text-sm">Click &quot;Add Candidate&quot; to add your first candidate.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Interviews Tab ───────────────────────────────────────────── */}
        <TabsContent value="interviews" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Interviews</CardTitle>
              <CardDescription>Scheduled and completed interviews</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : interviews.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Candidate</th>
                      <th className="p-3 text-left text-sm font-medium">Job</th>
                      <th className="p-3 text-left text-sm font-medium">Round</th>
                      <th className="p-3 text-left text-sm font-medium">Type</th>
                      <th className="p-3 text-left text-sm font-medium">Scheduled</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                      <th className="p-3 text-left text-sm font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((i) => (
                      <tr key={i.id} className="border-b last:border-0">
                        <td className="p-3 text-sm font-medium">{i.candidate_name || "—"}</td>
                        <td className="p-3 text-sm">{i.job_title || "—"}</td>
                        <td className="p-3 text-sm">{i.round_name || "Round 1"}</td>
                        <td className="p-3 text-sm">{i.interview_type || "—"}</td>
                        <td className="p-3 text-sm">{i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : "—"}</td>
                        <td className="p-3"><Badge variant={i.status === "completed" ? "success" : i.status === "cancelled" ? "destructive" : "secondary"}>{i.status}</Badge></td>
                        <td className="p-3 text-sm">{i.score ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <CalendarCheck className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p className="font-medium">No interviews scheduled</p>
                  <p className="text-sm">Interviews will appear here when scheduled for candidates.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Screening Tab ─────────────────────────────────────────── */}
        <TabsContent value="ai-screening" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-purple-600" />AI Resume Screening</CardTitle>
                <CardDescription>Screen candidates against job descriptions using AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="screen-jd">Job Description *</Label>
                  <Textarea
                    id="screen-jd"
                    placeholder="Paste the full job description here..."
                    value={screenJD}
                    onChange={(e) => setScreenJD(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resume (paste text or upload file)</Label>
                  <Textarea
                    id="screen-resume"
                    placeholder="Paste resume text here..."
                    value={screenResume}
                    onChange={(e) => setScreenResume(e.target.value)}
                    rows={6}
                  />

                  {/* Drag & Drop for Resume */}
                  <div
                    className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${screenDrag ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                    onDragOver={(e) => { e.preventDefault(); setScreenDrag(true); }}
                    onDragLeave={() => setScreenDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setScreenDrag(false);
                      const files = e.dataTransfer.files;
                      if (files.length > 0 && isValidResumeFile(files[0])) {
                        setScreenFile(files[0]);
                      }
                    }}
                  >
                    <input
                      ref={screenFileRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setScreenFile(e.target.files[0]);
                      }}
                    />
                    {screenFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">{screenFile.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => setScreenFile(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Drag & drop resume here, or{" "}
                          <button className="text-primary underline" onClick={() => screenFileRef.current?.click()}>browse</button>
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <Button onClick={handleAIScreen} disabled={screening} className="w-full">
                  {screening ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Screening...</>
                  ) : (
                    <><Brain className="mr-2 h-4 w-4" />Screen Candidate</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Screening Results</CardTitle>
              </CardHeader>
              <CardContent>
                {screeningResult ? (
                  <div className="space-y-4">
                    {screeningResult.error ? (
                      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <AlertTriangle className="mb-1 inline h-4 w-4" /> {screeningResult.error}
                      </div>
                    ) : (
                      <>
                        {/* Score Card */}
                        <div className={`rounded-lg border-2 p-4 text-center ${scoreBg(screeningResult.score)}`}>
                          <p className={`text-4xl font-bold ${scoreColor(screeningResult.score)}`}>{screeningResult.score}</p>
                          <p className="text-sm font-medium">/100</p>
                          <Badge className="mt-2" variant={screeningResult.decision === "Shortlisted" ? "success" : "destructive"}>
                            {screeningResult.decision === "Shortlisted" ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                            {screeningResult.decision}
                          </Badge>
                        </div>

                        {/* Candidate Info */}
                        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                          <p className="text-sm"><strong>Name:</strong> {screeningResult.name || "N/A"}</p>
                          <p className="text-sm"><strong>Email:</strong> {screeningResult.email || "N/A"}</p>
                          <p className="text-sm"><strong>Phone:</strong> {screeningResult.contact_number || "N/A"}</p>
                          <p className="text-sm"><strong>Current Co:</strong> {screeningResult.current_company || "N/A"}</p>
                        </div>

                        {/* Evaluation Details */}
                        {screeningResult.evaluation && (
                          <div className="space-y-3">
                            {screeningResult.evaluation.candidate_strengths?.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-green-700">✅ Strengths</p>
                                <ul className="ml-4 list-disc text-sm">
                                  {screeningResult.evaluation.candidate_strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                              </div>
                            )}
                            {screeningResult.evaluation.high_match_skills?.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-green-600">🎯 High Match Skills</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {screeningResult.evaluation.high_match_skills.map((s, i) =>
                                    <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">{s}</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            {screeningResult.evaluation.medium_match_skills?.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-yellow-600">🔸 Medium Match</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {screeningResult.evaluation.medium_match_skills.map((s, i) =>
                                    <Badge key={i} variant="secondary" className="bg-yellow-100 text-yellow-800">{s}</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            {screeningResult.evaluation.low_or_missing_match_skills?.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-red-600">❌ Missing / Low</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {screeningResult.evaluation.low_or_missing_match_skills.map((s, i) =>
                                    <Badge key={i} variant="secondary" className="bg-red-100 text-red-800">{s}</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            {screeningResult.evaluation.candidate_weaknesses?.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-red-700">⚠️ Weaknesses</p>
                                <ul className="ml-4 list-disc text-sm">
                                  {screeningResult.evaluation.candidate_weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                              </div>
                            )}
                            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                              <p className="text-sm"><strong>Risk:</strong> {screeningResult.evaluation.risk_level} — {screeningResult.evaluation.risk_explanation}</p>
                              <p className="text-sm"><strong>Reward:</strong> {screeningResult.evaluation.reward_level} — {screeningResult.evaluation.reward_explanation}</p>
                            </div>
                            {screeningResult.evaluation.justification && (
                              <div className="rounded-lg border p-3">
                                <p className="text-sm font-semibold mb-1">Justification</p>
                                <p className="text-sm text-muted-foreground">{screeningResult.evaluation.justification}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Brain className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p className="text-sm">Submit a JD and resume to see AI screening results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── AI Job Posts Tab ──────────────────────────────────────────── */}
        <TabsContent value="ai-job-posts" className="mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" />AI Job Post Generator</CardTitle>
                <CardDescription>
                  Generate professional job posts for LinkedIn, Indeed, Email, and WhatsApp from a job description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jd-text">Job Description</Label>
                  <Textarea
                    id="jd-text"
                    placeholder="Paste the full job description here..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    rows={8}
                  />
                </div>

                {/* JD File Upload */}
                <div
                  className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${jdDrag ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                  onDragOver={(e) => { e.preventDefault(); setJdDrag(true); }}
                  onDragLeave={() => setJdDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setJdDrag(false);
                    const files = e.dataTransfer.files;
                    if (files.length > 0 && isValidResumeFile(files[0])) {
                      setJdFile(files[0]);
                    }
                  }}
                >
                  <input
                    ref={jdFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setJdFile(e.target.files[0]);
                    }}
                  />
                  {jdFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">{jdFile.name}</span>
                      <Button size="sm" variant="ghost" onClick={() => setJdFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Or drag & drop a JD file here, or{" "}
                        <button className="text-primary underline" onClick={() => jdFileRef.current?.click()}>browse</button>
                      </p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT</p>
                    </>
                  )}
                </div>

                <Button onClick={handleGenerateJobPosts} disabled={generatingPosts} className="w-full">
                  {generatingPosts ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Posts...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Generate Job Posts</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Posts */}
            {jobPosts && !jobPosts.error && (
              <div className="space-y-4">
                {/* Summary Card */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="font-semibold">{jobPosts.role}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-semibold">{jobPosts.recruitment_type}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-semibold">{jobPosts.location}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="font-semibold">{jobPosts.experience}</p>
                      </div>
                    </div>
                    {jobPosts.key_skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {jobPosts.key_skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Platform Posts */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {([
                    { key: "linkedin_post", label: "LinkedIn", icon: Globe, color: "text-blue-600" },
                    { key: "indeed_post", label: "Indeed", icon: Globe, color: "text-purple-600" },
                    { key: "email_post", label: "Email", icon: Mail, color: "text-green-600" },
                    { key: "whatsapp_post", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
                  ] as { key: keyof AIJobPosts; label: string; icon: typeof Globe; color: string }[]).map((platform) => (
                    <Card key={platform.key}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <platform.icon className={`h-4 w-4 ${platform.color}`} />
                          {platform.label}
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(String(jobPosts[platform.key] || ""), platform.label)}
                        >
                          {copiedField === platform.label ? (
                            <><CheckCircle className="mr-1 h-3 w-3 text-green-600" />Copied</>
                          ) : (
                            <><Copy className="mr-1 h-3 w-3" />Copy</>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-64 overflow-y-auto rounded-lg bg-muted/50 p-3">
                          <pre className="whitespace-pre-wrap text-sm">{String(jobPosts[platform.key] || "—")}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create Job Dialog ──────────────────────────────────────────── */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post New Job</DialogTitle>
            <DialogDescription>Create a new job posting for your organization</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title *</Label>
                <Input id="job-title" placeholder="e.g. Senior Software Engineer" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-dept">Department</Label>
                <Select value={jobForm.department_id} onValueChange={(v) => setJobForm({ ...jobForm, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.business_id} value={d.business_id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-type">Employment Type</Label>
                <Select value={jobForm.employment_type} onValueChange={(v) => setJobForm({ ...jobForm, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-location">Location</Label>
                <Input id="job-location" placeholder="e.g. Bangalore, Remote" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-openings">Openings</Label>
                <Input id="job-openings" type="number" min={1} value={jobForm.openings} onChange={(e) => setJobForm({ ...jobForm, openings: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-closing">Closing Date</Label>
              <Input id="job-closing" type="date" value={jobForm.closing_date} onChange={(e) => setJobForm({ ...jobForm, closing_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-desc">Description</Label>
              <Textarea id="job-desc" rows={4} placeholder="Describe the role, responsibilities, and requirements..." value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-reqs">Requirements</Label>
              <Textarea id="job-reqs" rows={4} placeholder="List skills, experience, and qualifications..." value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateJob} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Candidate Dialog ───────────────────────────────────────── */}
      <Dialog open={candidateDialogOpen} onOpenChange={setCandidateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
            <DialogDescription>Add a new candidate to the recruitment pipeline</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cand-name">Full Name *</Label>
                <Input id="cand-name" placeholder="John Doe" value={candidateForm.full_name} onChange={(e) => setCandidateForm({ ...candidateForm, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cand-email">Email *</Label>
                <Input id="cand-email" type="email" placeholder="john@example.com" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cand-phone">Phone</Label>
                <Input id="cand-phone" placeholder="+91 98765 43210" value={candidateForm.phone} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cand-role">Current Role</Label>
                <Input id="cand-role" placeholder="Software Engineer" value={candidateForm.current_role} onChange={(e) => setCandidateForm({ ...candidateForm, current_role: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cand-exp">Years of Experience</Label>
                <Input id="cand-exp" type="number" min={0} value={candidateForm.years_of_experience} onChange={(e) => setCandidateForm({ ...candidateForm, years_of_experience: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cand-source">Source</Label>
                <Select value={candidateForm.source} onValueChange={(v) => setCandidateForm({ ...candidateForm, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="indeed">Indeed</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="job_board">Job Board</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resume Drag & Drop */}
            <div className="space-y-2">
              <Label>Resume</Label>
              <div
                className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {resumeFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">{resumeFile.name}</span>
                    <span className="text-xs text-muted-foreground">({(resumeFile.size / 1024).toFixed(0)} KB)</span>
                    <Button size="sm" variant="ghost" onClick={() => setResumeFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag & drop resume here, or{" "}
                      <button type="button" className="text-primary underline" onClick={() => fileInputRef.current?.click()}>browse files</button>
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (max 10MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCandidateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCandidate} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Candidate Detail Dialog ────────────────────────────────────── */}
      <Dialog open={candidateDetailOpen} onOpenChange={setCandidateDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCandidate?.full_name || "Candidate Details"}</DialogTitle>
            <DialogDescription>Full candidate profile and screening information</DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{selectedCandidate.email}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{selectedCandidate.phone || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Current Role</p>
                  <p className="text-sm font-medium">{selectedCandidate.current_role || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm font-medium">{selectedCandidate.current_company || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium">{selectedCandidate.years_of_experience ?? "—"} years</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-sm font-medium">{selectedCandidate.source || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={selectedCandidate.status === "active" ? "success" : "secondary"}>{selectedCandidate.status}</Badge>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">AI Score</p>
                  <p className="text-sm font-medium">
                    {selectedCandidate.ai_score != null ? (
                      <span className={scoreColor(selectedCandidate.ai_score)}>{selectedCandidate.ai_score}/100</span>
                    ) : "Not screened"}
                  </p>
                </div>
              </div>
              {selectedCandidate.ai_summary && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">AI Summary</p>
                  <p className="text-sm">{selectedCandidate.ai_summary}</p>
                </div>
              )}
              {selectedCandidate.resume_url && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <a href={selectedCandidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                    View Resume
                  </a>
                </div>
              )}
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Business ID</p>
                <code className="text-xs">{selectedCandidate.business_id}</code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Job Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={jobDetailOpen} onOpenChange={setJobDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title || "Job Details"}</DialogTitle>
            <DialogDescription>Full job posting details</DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedJob.status === "open" ? "success" : "secondary"}>{selectedJob.status}</Badge>
                {selectedJob.employment_type && <Badge variant="outline">{selectedJob.employment_type.replace("_", " ")}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{selectedJob.department_name || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{selectedJob.location || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Openings</p>
                  <p className="text-sm font-medium">{selectedJob.openings}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Closing Date</p>
                  <p className="text-sm font-medium">{selectedJob.closing_date ? new Date(selectedJob.closing_date).toLocaleDateString() : "—"}</p>
                </div>
                {selectedJob.salary_min != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Salary Range</p>
                    <p className="text-sm font-medium">{formatCurrency(selectedJob.salary_min)} - {formatCurrency(selectedJob.salary_max || 0)}</p>
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Applications</p>
                  <p className="text-sm font-medium">{selectedJob.applications_count ?? 0}</p>
                </div>
              </div>
              {selectedJob.description && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}
              {selectedJob.requirements && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Requirements</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Business ID</p>
                <code className="text-xs">{selectedJob.business_id}</code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
