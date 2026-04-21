"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Upload, Search, Loader2, Trash2, CheckCircle2,
  File, ShieldCheck, AlertTriangle,
  Building2, CreditCard, UserCheck, LogOut, BarChart3,
  Clock, XCircle, RefreshCw, Eye,
  Plus, Download, ClipboardList, Briefcase,
} from "lucide-react";
import { documentVaultService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type {
  EmployeeDocument, OnboardingChecklist, ExitChecklist,
  BankAccount, DocumentVaultSummary,
} from "@/types";

// helpers
const CATEGORY_LABELS: Record<string, string> = {
  identity: "Identity", employment: "Employment", education: "Education",
  payroll_banking: "Payroll & Banking", compliance: "Compliance",
  tax: "Tax", onboarding: "Onboarding", exit: "Exit", medical: "Medical", other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  uploaded: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  need_resubmission: "bg-orange-100 text-orange-700 border-orange-200",
  missing: "bg-gray-100 text-gray-500 border-gray-200",
  requested: "bg-purple-100 text-purple-700 border-purple-200",
  expired: "bg-red-100 text-red-600 border-red-200",
  not_requested: "bg-gray-50 text-gray-400 border-gray-100",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  not_started: "bg-gray-100 text-gray-500 border-gray-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  initiated: "bg-purple-100 text-purple-700 border-purple-200",
};

function humanSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime?: string) {
  if (!mime) return <File className="h-8 w-8 text-muted-foreground" />;
  if (mime.startsWith("image/")) return <FileText className="h-8 w-8 text-blue-400" />;
  if (mime === "application/pdf") return <FileText className="h-8 w-8 text-red-400" />;
  return <FileText className="h-8 w-8 text-muted-foreground" />;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function DocumentVaultPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const isAdmin = ["super_admin", "company_admin", "hr_manager"].includes(user?.role ?? "");
  const employeeId = (user as { employee_id?: string } | null)?.employee_id ?? "";

  // docs tab
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [docCategory, setDocCategory] = useState("all");
  const [docStatus, setDocStatus] = useState("all");

  // upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadName, setUploadName] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // review dialog
  const [reviewDoc, setReviewDoc] = useState<EmployeeDocument | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "request_resubmission">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // onboarding tab
  const [onboarding, setOnboarding] = useState<OnboardingChecklist | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  // exit tab
  const [exitChecklist, setExitChecklist] = useState<ExitChecklist | null>(null);
  const [exitLoading, setExitLoading] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitEmployeeId, setExitEmployeeId] = useState("");
  const [exitLWD, setExitLWD] = useState("");
  const [exitResignDate, setExitResignDate] = useState("");
  const [exitNotes, setExitNotes] = useState("");
  const [creatingExit, setCreatingExit] = useState(false);

  // bank tab
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    employee_id: employeeId, bank_name: "", account_holder_name: "",
    account_number: "", account_type: "savings", ifsc_code: "",
    branch_name: "", swift_code: "", currency: "INR", country_code: "IN",
    is_primary: false, upi_id: "",
  });
  const [savingBank, setSavingBank] = useState(false);

  // summary tab
  const [summary, setSummary] = useState<DocumentVaultSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadDocs = useCallback(async () => {
    if (!employeeId) return;
    setDocsLoading(true);
    try {
      const page = await documentVaultService.listDocuments({
        employee_id: employeeId,
        page_size: 200,
        category: docCategory !== "all" ? docCategory : undefined,
        status: docStatus !== "all" ? docStatus : undefined,
      });
      setDocs(page.data ?? []);
    } catch {
      toast({ title: "Could not load documents", variant: "destructive" });
    } finally {
      setDocsLoading(false);
    }
  }, [employeeId, docCategory, docStatus, toast]);

  const loadOnboarding = useCallback(async () => {
    if (!employeeId) return;
    setOnboardingLoading(true);
    try {
      const cl = await documentVaultService.getOnboardingChecklist(employeeId);
      setOnboarding(cl);
    } catch { setOnboarding(null); }
    finally { setOnboardingLoading(false); }
  }, [employeeId]);

  const loadExit = useCallback(async () => {
    if (!employeeId) return;
    setExitLoading(true);
    try {
      const ec = await documentVaultService.getExitChecklist(employeeId);
      setExitChecklist(ec);
    } finally { setExitLoading(false); }
  }, [employeeId]);

  const loadBank = useCallback(async () => {
    if (!isAdmin) return;
    setBankLoading(true);
    try {
      const accts = await documentVaultService.listBankAccounts(employeeId);
      setBankAccounts(accts);
    } catch { setBankAccounts([]); }
    finally { setBankLoading(false); }
  }, [employeeId, isAdmin]);

  const loadSummary = useCallback(async () => {
    if (!isAdmin) return;
    setSummaryLoading(true);
    try {
      const page = await documentVaultService.getVaultSummary({ page_size: 50 });
      setSummary(page.data ?? []);
    } catch { setSummary([]); }
    finally { setSummaryLoading(false); }
  }, [isAdmin]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setUploadDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setUploadFile(f); setUploadName(f.name.replace(/\.[^.]+$/, "")); }
  }

  async function handleUpload() {
    if (!uploadFile || !employeeId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("employee_id", employeeId);
      fd.append("category", uploadCategory);
      fd.append("document_name", uploadName || uploadFile.name);
      fd.append("access_level", "private");
      if (uploadNotes) fd.append("notes", uploadNotes);
      await documentVaultService.uploadDocument(fd);
      toast({ title: "Document uploaded" });
      setUploadOpen(false);
      setUploadFile(null); setUploadName(""); setUploadNotes(""); setUploadCategory("other");
      loadDocs();
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    finally { setUploading(false); }
  }

  async function handleReview() {
    if (!reviewDoc) return;
    setReviewing(true);
    try {
      await documentVaultService.reviewDocument(reviewDoc.business_id, reviewAction, reviewNotes || undefined, reviewReason || undefined);
      toast({ title: "Document reviewed" });
      setReviewDoc(null); setReviewNotes(""); setReviewReason("");
      loadDocs();
    } catch { toast({ title: "Review failed", variant: "destructive" }); }
    finally { setReviewing(false); }
  }

  async function toggleOnboardingItem(checklistId: string, itemId: string, status: string) {
    const newStatus = status === "completed" ? "not_started" : "completed";
    setUpdatingItem(itemId);
    try {
      const updated = await documentVaultService.updateOnboardingItem(checklistId, itemId, newStatus);
      setOnboarding(updated);
    } catch { toast({ title: "Could not update task", variant: "destructive" }); }
    finally { setUpdatingItem(null); }
  }

  async function handleCreateExit() {
    setCreatingExit(true);
    try {
      const ec = await documentVaultService.createExitChecklist({
        employee_id: exitEmployeeId || employeeId,
        last_working_day: exitLWD || undefined,
        resignation_date: exitResignDate || undefined,
        notes: exitNotes || undefined,
      });
      setExitChecklist(ec); setExitOpen(false);
      toast({ title: "Exit process initiated" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({ title: msg ?? "Could not initiate exit", variant: "destructive" });
    } finally { setCreatingExit(false); }
  }

  async function handleSaveBank() {
    setSavingBank(true);
    try {
      const acct = await documentVaultService.createBankAccount(bankForm as Parameters<typeof documentVaultService.createBankAccount>[0]);
      setBankAccounts(prev => [...prev, acct]);
      setBankOpen(false);
      toast({ title: "Bank account saved" });
    } catch { toast({ title: "Could not save bank account", variant: "destructive" }); }
    finally { setSavingBank(false); }
  }

  async function handleSeedTemplates() {
    setSeeding(true);
    try {
      const result = await documentVaultService.seedTemplates();
      toast({ title: `Seeded ${result.seeded} document templates` });
    } catch { toast({ title: "Seeding failed", variant: "destructive" }); }
    finally { setSeeding(false); }
  }

  const visibleDocs = docs.filter(d => {
    if (!docSearch) return true;
    const q = docSearch.toLowerCase();
    return d.document_name.toLowerCase().includes(q) || (d.category ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Vault</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Secure, organised HR document management</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={handleSeedTemplates} disabled={seeding}>
              {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Seed Templates
            </Button>
          )}
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />Upload Document
          </Button>
        </div>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-1.5" />My Documents</TabsTrigger>
          <TabsTrigger value="onboarding" onClick={loadOnboarding}><UserCheck className="h-4 w-4 mr-1.5" />Onboarding</TabsTrigger>
          <TabsTrigger value="exit" onClick={loadExit}><LogOut className="h-4 w-4 mr-1.5" />Exit Process</TabsTrigger>
          {isAdmin && <TabsTrigger value="bank" onClick={loadBank}><CreditCard className="h-4 w-4 mr-1.5" />Bank Accounts</TabsTrigger>}
          {isAdmin && <TabsTrigger value="summary" onClick={loadSummary}><BarChart3 className="h-4 w-4 mr-1.5" />Compliance</TabsTrigger>}
        </TabsList>

        {/* MY DOCUMENTS */}
        <TabsContent value="documents">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search documents…" value={docSearch} onChange={e => setDocSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={docCategory} onValueChange={setDocCategory}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={docStatus} onValueChange={setDocStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {["uploaded","under_review","approved","rejected","need_resubmission","missing","expired"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={loadDocs} disabled={docsLoading}>
              <RefreshCw className={`h-4 w-4 ${docsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {docsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : visibleDocs.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground gap-3">
              <FileText className="h-12 w-12 opacity-20" />
              <p className="text-sm">No documents found.</p>
              <Button size="sm" onClick={() => setUploadOpen(true)}><Plus className="h-4 w-4 mr-2" />Upload Document</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleDocs.map(doc => (
                <Card key={doc.business_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">{fileIcon(doc.mime_type)}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight line-clamp-2">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{CATEGORY_LABELS[doc.category] ?? doc.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={doc.status} />
                      {doc.expiry_date && <span className="text-xs text-muted-foreground">exp. {formatDate(doc.expiry_date)}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>{humanSize(doc.file_size)}</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                    {doc.rejection_reason && (
                      <p className="text-xs text-red-500 bg-red-50 rounded p-2 break-words">{doc.rejection_reason}</p>
                    )}
                    <div className="flex gap-2 mt-auto">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => window.open(doc.file_url, "_blank")}>
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                      {isAdmin && doc.status === "uploaded" && (
                        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setReviewDoc(doc); setReviewAction("approve"); }}>
                          Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ONBOARDING */}
        <TabsContent value="onboarding">
          {onboardingLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !onboarding ? (
            <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
              <UserCheck className="h-12 w-12 opacity-20" />
              <p className="text-sm">No onboarding checklist found.</p>
              <Button size="sm" onClick={loadOnboarding}><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
            </div>
          ) : (
            <div className="max-w-2xl">
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">Onboarding Progress</h3>
                      <p className="text-sm text-muted-foreground">{onboarding.completion_pct}% complete</p>
                    </div>
                    <StatusBadge status={onboarding.status} />
                  </div>
                  <Progress value={onboarding.completion_pct} className="h-2" />
                </CardContent>
              </Card>
              <div className="flex flex-col gap-2">
                {(onboarding.items ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map(item => {
                  const done = item.status === "completed";
                  return (
                    <div key={item.business_id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${done ? "bg-emerald-50 border-emerald-200" : "bg-card border-border"}`}>
                      <button onClick={() => toggleOnboardingItem(onboarding.business_id, item.business_id, item.status)} disabled={updatingItem === item.business_id} className="shrink-0">
                        {updatingItem === item.business_id
                          ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          : done
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{item.task_label}</p>
                        {item.completed_at && <p className="text-xs text-muted-foreground">Completed {formatDate(item.completed_at)}</p>}
                      </div>
                      {item.is_required && !done && <span className="text-xs text-orange-500 font-medium shrink-0">Required</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* EXIT PROCESS */}
        <TabsContent value="exit">
          {exitLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !exitChecklist ? (
            <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
              <LogOut className="h-12 w-12 opacity-20" />
              <p className="text-sm">No exit process has been initiated.</p>
              {isAdmin && <Button size="sm" onClick={() => setExitOpen(true)}><Plus className="h-4 w-4 mr-2" />Initiate Exit Process</Button>}
            </div>
          ) : (
            <div className="max-w-2xl">
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">Exit Progress</h3>
                      <p className="text-sm text-muted-foreground">{exitChecklist.completion_pct}% complete</p>
                    </div>
                    <StatusBadge status={exitChecklist.status} />
                  </div>
                  <Progress value={exitChecklist.completion_pct} className="h-2 mb-4" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Manager", done: exitChecklist.manager_approved },
                      { label: "HR Clearance", done: exitChecklist.hr_clearance },
                      { label: "Payroll", done: exitChecklist.payroll_cleared },
                      { label: "Assets", done: exitChecklist.assets_returned },
                    ].map(item => (
                      <div key={item.label} className={`rounded-lg p-2 text-center text-xs font-medium border ${item.done ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted border-border text-muted-foreground"}`}>
                        {item.done ? "✓ " : ""}{item.label}
                      </div>
                    ))}
                  </div>
                  {exitChecklist.last_working_day && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Last working day: <span className="font-medium text-foreground">{formatDate(exitChecklist.last_working_day)}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
              <div className="flex flex-col gap-2">
                {(exitChecklist.items ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map(item => {
                  const done = item.status === "completed";
                  return (
                    <div key={item.business_id} className={`flex items-center gap-3 p-3 rounded-lg border ${done ? "bg-emerald-50 border-emerald-200" : "bg-card border-border"}`}>
                      <div className="shrink-0">
                        {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{item.task_label}</p>
                        {item.completed_at && <p className="text-xs text-muted-foreground">Completed {formatDate(item.completed_at)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* BANK ACCOUNTS */}
        {isAdmin && (
          <TabsContent value="bank">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Bank Accounts</h3>
              <Button size="sm" onClick={() => { setBankForm(f => ({ ...f, employee_id: employeeId })); setBankOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />Add Account
              </Button>
            </div>
            {bankLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : bankAccounts.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
                <CreditCard className="h-12 w-12 opacity-20" />
                <p className="text-sm">No bank accounts on file.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bankAccounts.map(acct => (
                  <Card key={acct.business_id} className={`border-2 ${acct.is_primary ? "border-primary" : "border-border"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{acct.bank_name}</p>
                          <p className="text-sm text-muted-foreground">{acct.account_holder_name}</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {acct.is_primary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                          {acct.is_verified && <Badge className="text-xs bg-emerald-500">Verified</Badge>}
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-muted-foreground">Account</span>
                        <span className="font-mono">{acct.account_number_masked}</span>
                        <span className="text-muted-foreground">Type</span>
                        <span className="capitalize">{acct.account_type}</span>
                        {acct.ifsc_code && (<><span className="text-muted-foreground">IFSC</span><span className="font-mono">{acct.ifsc_code}</span></>)}
                        {acct.swift_code && (<><span className="text-muted-foreground">SWIFT</span><span className="font-mono">{acct.swift_code}</span></>)}
                        <span className="text-muted-foreground">Currency</span>
                        <span>{acct.currency}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* COMPLIANCE DASHBOARD */}
        {isAdmin && (
          <TabsContent value="summary">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Document Compliance Dashboard</h3>
              <Button variant="ghost" size="sm" onClick={loadSummary} disabled={summaryLoading}>
                <RefreshCw className={`h-4 w-4 ${summaryLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {summaryLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : summary.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
                <BarChart3 className="h-12 w-12 opacity-20" />
                <p className="text-sm">No data yet. Seed document templates first.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {["Employee","Required","Uploaded","Approved","Missing","Pending Review","Expired","Onboarding"].map(h => (
                        <th key={h} className="text-left p-3 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((row, i) => (
                      <tr key={row.employee_id} className={`border-b hover:bg-muted/30 ${i % 2 ? "bg-muted/10" : ""}`}>
                        <td className="p-3">
                          <p className="font-medium">{row.employee_name}</p>
                          {row.employee_code && <p className="text-xs text-muted-foreground">{row.employee_code}</p>}
                        </td>
                        <td className="p-3">{row.total_required}</td>
                        <td className="p-3 text-blue-600 font-medium">{row.uploaded}</td>
                        <td className="p-3 text-emerald-600 font-medium">{row.approved}</td>
                        <td className="p-3">{row.missing > 0 ? <span className="text-red-500 font-medium">{row.missing}</span> : <span className="text-muted-foreground">0</span>}</td>
                        <td className="p-3">{row.pending_review > 0 ? <span className="text-yellow-600 font-medium">{row.pending_review}</span> : <span className="text-muted-foreground">0</span>}</td>
                        <td className="p-3">{row.expired > 0 ? <span className="text-red-500 font-medium">{row.expired}</span> : <span className="text-muted-foreground">0</span>}</td>
                        <td className="p-3">
                          <div className="flex flex-col items-start gap-1">
                            {row.onboarding_status ? <StatusBadge status={row.onboarding_status} /> : <span className="text-xs text-muted-foreground">—</span>}
                            <Progress value={row.onboarding_pct} className="h-1 w-16" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* UPLOAD DIALOG */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>PDF, JPEG, PNG, DOCX — max 20 MB</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploadDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setUploadDragOver(true); }}
              onDragLeave={() => setUploadDragOver(false)}
              onDrop={handleFileDrop}
            >
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setUploadName(f.name.replace(/\.[^.]+$/, "")); } }} />
              {uploadFile ? (
                <div className="flex flex-col items-center gap-2">
                  {fileIcon(uploadFile.type)}
                  <p className="font-medium text-sm">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">{humanSize(uploadFile.size)}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Click or drag & drop a file here</p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Document Name</Label>
              <Input placeholder="e.g. Aadhaar Card" value={uploadName} onChange={e => setUploadName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Any notes…" value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REVIEW DIALOG */}
      <Dialog open={!!reviewDoc} onOpenChange={open => { if (!open) setReviewDoc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>{reviewDoc?.document_name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label>Action</Label>
              <Select value={reviewAction} onValueChange={v => setReviewAction(v as typeof reviewAction)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="request_resubmission">Request Resubmission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reviewAction === "reject" && (
              <div className="flex flex-col gap-1">
                <Label>Rejection Reason</Label>
                <Textarea placeholder="Why is this being rejected?" value={reviewReason} onChange={e => setReviewReason(e.target.value)} rows={2} />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Notes for the employee…" value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDoc(null)}>Cancel</Button>
            <Button onClick={handleReview} disabled={reviewing} variant={reviewAction === "reject" ? "destructive" : "default"}>
              {reviewing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {reviewAction === "approve" ? "Approve" : reviewAction === "reject" ? "Reject" : "Request Resubmission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXIT INITIATE DIALOG */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Initiate Exit Process</DialogTitle>
            <DialogDescription>Creates an exit checklist for the employee.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1"><Label>Employee ID</Label><Input placeholder="Employee business ID" value={exitEmployeeId} onChange={e => setExitEmployeeId(e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>Last Working Day</Label><Input type="date" value={exitLWD} onChange={e => setExitLWD(e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>Resignation Date</Label><Input type="date" value={exitResignDate} onChange={e => setExitResignDate(e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>Notes</Label><Textarea value={exitNotes} onChange={e => setExitNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateExit} disabled={creatingExit}>
              {creatingExit && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Initiate Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD BANK ACCOUNT DIALOG */}
      <Dialog open={bankOpen} onOpenChange={setBankOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>Account number will be masked for security.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["bank_name", "Bank Name"],
              ["account_holder_name", "Account Holder Name"],
              ["account_number", "Account Number"],
              ["ifsc_code", "IFSC Code"],
              ["branch_name", "Branch Name"],
              ["swift_code", "SWIFT Code"],
              ["upi_id", "UPI ID (optional)"],
            ] as [keyof typeof bankForm, string][]).map(([field, label]) => (
              <div key={field} className="flex flex-col gap-1">
                <Label className="text-xs">{label}</Label>
                <Input value={String(bankForm[field] ?? "")} onChange={e => setBankForm(f => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Account Type</Label>
              <Select value={bankForm.account_type} onValueChange={v => setBankForm(f => ({ ...f, account_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["savings","current","salary","other"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Currency</Label>
              <Select value={bankForm.currency} onValueChange={v => setBankForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["INR","MYR","SGD","AED","USD","GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setBankOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBank} disabled={savingBank}>
              {savingBank && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
