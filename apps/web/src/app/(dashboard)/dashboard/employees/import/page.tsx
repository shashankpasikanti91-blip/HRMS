"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Download, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, ArrowRight, Loader2, FileSpreadsheet, Users,
  SkipForward,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ImportRowResult {
  row: number;
  status: "success" | "error" | "skipped";
  employee_code?: string;
  full_name?: string;
  work_email?: string;
  errors: string[];
}

interface ImportResponse {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  results: ImportRowResult[];
}

// ─── Step Config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Download Template" },
  { id: 2, label: "Upload File" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Preview" },
  { id: 5, label: "Import" },
  { id: 6, label: "Done" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmployeeImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ImportResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [skipErrors, setSkipErrors] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function downloadTemplate() {
    try {
      const res = await api.get("/employees/import/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "employee_import_template.csv";
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Template downloaded", description: "Fill in the CSV and upload it in the next step." });
    } catch {
      toast({ title: "Download failed", description: "Could not download template.", variant: "destructive" });
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (f && !f.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Invalid file type", description: "Only CSV files are supported.", variant: "destructive" });
      return;
    }
    setFile(f);
    setValidationResult(null);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Invalid file type", description: "Only CSV files are supported.", variant: "destructive" });
      return;
    }
    setFile(f);
    setValidationResult(null);
  }, [toast]);

  async function handleValidate() {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<ImportResponse>("/employees/import/validate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setValidationResult(res.data);
      setStep(4);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      toast({
        title: "Validation failed",
        description: axErr?.response?.data?.detail || "An error occurred during validation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<ImportResponse>(
        `/employees/import?skip_errors=${skipErrors}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setImportResult(res.data);
      setStep(6);
      toast({
        title: "Import complete",
        description: `${res.data.created} employees imported successfully.`,
        variant: "success",
      });
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      toast({
        title: "Import failed",
        description: axErr?.response?.data?.detail || "An error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ── Render Steps ───────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Download the Import Template</h2>
              <p className="text-muted-foreground max-w-md">
                Start by downloading our CSV template. Fill it with your employee data following the required format.
              </p>
            </div>
            <div className="w-full max-w-lg border rounded-lg divide-y text-sm">
              {[
                { field: "full_name", req: true, note: "Employee's full name" },
                { field: "work_email", req: true, note: "Must be unique per company" },
                { field: "phone", req: false, note: "E.g. +60 12-345 6789" },
                { field: "designation", req: false, note: "Job title / role" },
                { field: "department_name", req: false, note: "Must match an existing department name" },
                { field: "employment_type", req: false, note: "full_time | part_time | contract | intern" },
                { field: "joining_date", req: false, note: "YYYY-MM-DD format" },
                { field: "gender", req: false, note: "male | female | other" },
                { field: "date_of_birth", req: false, note: "YYYY-MM-DD format" },
                { field: "employee_code", req: false, note: "Leave blank to auto-generate" },
                { field: "location", req: false, note: "Office location" },
                { field: "work_mode", req: false, note: "onsite | hybrid | remote" },
              ].map(({ field, req, note }) => (
                <div key={field} className="grid grid-cols-3 px-4 py-2.5">
                  <span className="font-mono text-xs text-foreground">{field}</span>
                  <span className={req ? "text-destructive text-xs font-medium" : "text-muted-foreground text-xs"}>
                    {req ? "Required" : "Optional"}
                  </span>
                  <span className="text-xs text-muted-foreground">{note}</span>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={downloadTemplate}>
              <Download className="mr-2 h-5 w-5" />Download Template
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center gap-6 py-8">
            <div>
              <h2 className="text-xl font-semibold mb-2 text-center">Upload Your CSV File</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Upload the filled CSV file. Only <strong>.csv</strong> files are accepted.
              </p>
            </div>

            <div
              className={`w-full max-w-lg border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Drop your CSV here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5 MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{file.name} selected</span>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              {loading ? (
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Validate Your File</h2>
              <p className="text-muted-foreground max-w-md">
                We will check your file for errors before importing. No data will be saved during this step.
              </p>
            </div>
            {file && (
              <div className="border rounded-lg px-6 py-4 text-left w-full max-w-md">
                <p className="text-sm font-medium">Selected file</p>
                <p className="text-sm text-muted-foreground mt-1">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
            <Button size="lg" onClick={handleValidate} disabled={loading || !file}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Validation
            </Button>
          </div>
        );

      case 4:
        if (!validationResult) return null;
        const { total, errors: errCount, results } = validationResult;
        const hasErrors = errCount > 0;
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">Validation Preview</h2>
              <p className="text-muted-foreground text-sm">Review the results before importing.</p>
            </div>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Rows</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{total - errCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Valid</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-destructive">{errCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Errors</p>
                </CardContent>
              </Card>
            </div>

            {hasErrors && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
                <p className="text-sm text-orange-800">
                  {errCount} row{errCount !== 1 ? "s have" : " has"} errors.
                  You can skip invalid rows and import only valid ones, or go back to fix the file.
                </p>
              </div>
            )}

            {/* Row table */}
            <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Row</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.row} className="border-t">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.row}</td>
                      <td className="px-4 py-2.5">{r.full_name || <span className="text-muted-foreground italic">—</span>}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.work_email || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={r.status === "success" ? "success" : "destructive"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-destructive">
                        {r.errors.join("; ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasErrors && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={(e) => setSkipErrors(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Skip invalid rows and import only valid ones ({total - errCount} employee{total - errCount !== 1 ? "s" : ""})
              </label>
            )}
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              {loading ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <Users className="h-10 w-10 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {loading ? "Importing Employees…" : "Ready to Import"}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {loading
                  ? "Please wait while we create employee records. Do not close this page."
                  : `Import ${skipErrors ? (validationResult ? validationResult.total - validationResult.errors : "valid") : "all"} employee records into the system.`}
              </p>
            </div>
            {!loading && (
              <Button size="lg" onClick={handleImport}>
                <Upload className="mr-2 h-5 w-5" />Confirm Import
              </Button>
            )}
          </div>
        );

      case 6:
        if (!importResult) return null;
        return (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Import Complete!</h2>
              <p className="text-muted-foreground">Your employee data has been imported successfully.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{importResult.created}</p>
                  <p className="text-xs text-muted-foreground mt-1">Imported</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-orange-500">{importResult.skipped}</p>
                  <p className="text-xs text-muted-foreground mt-1">Skipped</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-destructive">{importResult.errors}</p>
                  <p className="text-xs text-muted-foreground mt-1">Errors</p>
                </CardContent>
              </Card>
            </div>

            {importResult.results.filter((r) => r.status === "error").length > 0 && (
              <div className="w-full max-w-lg border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Row</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.results.filter((r) => r.status === "error").map((r) => (
                      <tr key={r.row} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.row}</td>
                        <td className="px-3 py-2 text-xs">{r.work_email || "—"}</td>
                        <td className="px-3 py-2 text-xs text-destructive">{r.errors.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep(1); setFile(null); setValidationResult(null); setImportResult(null); }}>
                Import Another File
              </Button>
              <Button onClick={() => router.push("/dashboard/employees")}>
                View Employees
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function canGoNext() {
    if (step === 2 && !file) return false;
    if (step === 4 && validationResult && validationResult.errors > 0 && !skipErrors && validationResult.total === validationResult.errors) return false;
    return true;
  }

  function handleNext() {
    if (step === 3) { handleValidate(); return; }
    if (step === 5) { handleImport(); return; }
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  const progressValue = ((step - 1) / (STEPS.length - 1)) * 100;

  // ── Final render ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/employees")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Employees</h1>
          <p className="text-muted-foreground text-sm">Bulk import employees from a CSV spreadsheet</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          {STEPS.map((s) => (
            <span key={s.id} className={step >= s.id ? "text-primary font-medium" : ""}>
              {s.label}
            </span>
          ))}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      {/* Main card */}
      <Card>
        <CardContent className="pt-6 pb-6 min-h-[380px]">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      {step < 6 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>
          {step < 5 && step !== 3 && (
            <Button onClick={handleNext} disabled={!canGoNext() || loading}>
              {step === 4 ? "Proceed to Import" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleValidate} disabled={!file || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validate File<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === 5 && (
            <Button onClick={handleImport} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />Start Import
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
