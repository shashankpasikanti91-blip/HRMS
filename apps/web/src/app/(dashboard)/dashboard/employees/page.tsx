"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, Download, Upload, Loader2,
  MoreHorizontal, Pencil, Trash2, Eye, Clock, Calendar, DollarSign,
  FileText, UserCheck, UserX, UserMinus, Users, LogOut, CheckCircle2,
} from "lucide-react";
import { employeeService, departmentService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatDate } from "@/lib/utils";
import type { EmployeeSummary, DepartmentSummary } from "@/types";

const statusColors: Record<string, "success" | "warning" | "destructive" | "secondary" | "default"> = {
  active: "success",
  inactive: "secondary",
  on_leave: "warning",
  terminated: "destructive",
  probation: "default",
  notice_period: "warning",
  exit_clearance: "warning",
  resigned: "secondary",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  intern: "Intern",
  freelance: "Freelance",
  consultant: "Consultant",
};

const EXIT_REASON_OPTIONS = [
  { value: "resignation", label: "Resignation" },
  { value: "termination", label: "Termination" },
  { value: "end_of_contract", label: "End of Contract" },
  { value: "mutual_separation", label: "Mutual Separation" },
  { value: "retirement", label: "Retirement" },
  { value: "other", label: "Other" },
];

export default function EmployeesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const canManage = ["super_admin", "company_admin", "hr_manager"].includes(user?.role || "");

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [exitTargetId, setExitTargetId] = useState<string | null>(null);
  const [exitForm, setExitForm] = useState({
    resignation_date: new Date().toISOString().split("T")[0],
    last_working_day: "",
    exit_reason: "resignation",
    notes: "",
  });
  const [exitSubmitting, setExitSubmitting] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState<EmployeeSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", work_email: "", phone: "",
    department_id: "", employment_type: "full_time" as string,
    joining_date: new Date().toISOString().split("T")[0],
    gender: "", date_of_birth: "", designation: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empResult, deptResult] = await Promise.allSettled([
        employeeService.list({ page_size: 200 }),
        departmentService.listAll(),
      ]);
      if (empResult.status === "fulfilled") {
        const page = empResult.value;
        setEmployees(page.data ?? []);
      } else {
        const err = empResult.reason as { response?: { status?: number } };
        if (err?.response?.status !== 401) {
          toast({ title: "Failed to load employees", description: "Please refresh to try again.", variant: "destructive" });
        }
      }
      if (deptResult.status === "fulfilled") {
        setDepartments(deptResult.value);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = employees.filter((e) => {
    const matchSearch = `${e.full_name} ${e.employee_code} ${e.work_email} ${e.designation || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.employment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openAddDialog() {
    setEditingEmployee(null);
    setForm({ full_name: "", work_email: "", phone: "", department_id: "", employment_type: "full_time", joining_date: new Date().toISOString().split("T")[0], gender: "", date_of_birth: "", designation: "" });
    setDialogOpen(true);
  }

  async function openEditDialog(emp: EmployeeSummary) {
    try {
      const full = await employeeService.getByBusinessId(emp.business_id);
      setEditingEmployee(emp);
      setForm({
        full_name: full.full_name,
        work_email: full.work_email,
        phone: full.phone || "",
        department_id: full.department_id || "",
        employment_type: full.employment_type || "full_time",
        joining_date: full.joining_date?.split("T")[0] || "",
        gender: full.gender || "",
        date_of_birth: full.date_of_birth?.split("T")[0] || "",
        designation: full.designation || "",
      });
      setDialogOpen(true);
    } catch {
      toast({ title: "Error", description: "Failed to load employee details", variant: "destructive" });
    }
  }

  async function handleSave() {
    const trimmedName = form.full_name.trim();
    const trimmedEmail = form.work_email.trim().toLowerCase();

    if (!trimmedName) {
      toast({ title: "Validation Error", description: "Full name is required", variant: "destructive" });
      return;
    }
    if (!trimmedEmail) {
      toast({ title: "Validation Error", description: "Work email is required", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ title: "Validation Error", description: "Please enter a valid work email address", variant: "destructive" });
      return;
    }

    // Build a clean payload — omit empty strings for optional fields
    // so the backend receives undefined (excluded) rather than ""
    function nonEmpty(val: string | undefined): string | undefined {
      const s = val?.trim();
      return s || undefined;
    }

    const payload = {
      full_name: trimmedName,
      work_email: trimmedEmail,
      ...(nonEmpty(form.phone) ? { phone: form.phone.trim() } : {}),
      ...(nonEmpty(form.department_id) ? { department_id: form.department_id } : {}),
      ...(nonEmpty(form.designation) ? { designation: form.designation.trim() } : {}),
      ...(nonEmpty(form.gender) ? { gender: form.gender } : {}),
      ...(nonEmpty(form.date_of_birth) ? { date_of_birth: form.date_of_birth } : {}),
      ...(nonEmpty(form.joining_date) ? { joining_date: form.joining_date } : {}),
      employment_type: form.employment_type || "full_time",
    };

    setSaving(true);
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.business_id, payload);
        toast({ title: "Employee Updated", description: `${trimmedName} has been updated successfully.`, variant: "success" });
      } else {
        await employeeService.create(payload);
        toast({ title: "Employee Added", description: `${trimmedName} has been added to your team.`, variant: "success" });
      }
      setDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string | object; message?: string } } };
      const rawDetail = axErr?.response?.data?.detail;
      const msg =
        typeof rawDetail === "string"
          ? rawDetail
          : axErr?.response?.data?.message || "Something went wrong. Please try again.";
      toast({ title: "Could not save employee", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await employeeService.delete(deletingId);
      toast({ title: "Success", description: "Employee deleted", variant: "success" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to delete employee", variant: "destructive" });
    }
  }

  async function handleStatusChange(businessId: string, newStatus: string) {
    try {
      await employeeService.update(businessId, { employment_status: newStatus });
      toast({ title: "Updated", description: `Employee status set to ${newStatus.replace("_", " ")}`, variant: "success" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to update employee status", variant: "destructive" });
    }
  }

  async function handleTerminate() {
    if (!terminatingId) return;
    try {
      await employeeService.update(terminatingId, { employment_status: "terminated" });
      toast({ title: "Terminated", description: "Employee has been terminated", variant: "success" });
      setTerminateDialogOpen(false);
      setTerminatingId(null);
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to terminate employee", variant: "destructive" });
    }
  }

  async function handleStartExit() {
    if (!exitTargetId) return;
    if (!exitForm.resignation_date) {
      toast({ title: "Validation", description: "Resignation date is required", variant: "destructive" });
      return;
    }
    setExitSubmitting(true);
    try {
      await employeeService.startExit(exitTargetId, exitForm);
      toast({ title: "Exit Started", description: "Employee has been moved to notice period.", variant: "success" });
      setExitDialogOpen(false);
      setExitTargetId(null);
      setExitForm({ resignation_date: new Date().toISOString().split("T")[0], last_working_day: "", exit_reason: "resignation", notes: "" });
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to start exit workflow";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setExitSubmitting(false);
    }
  }

  async function handleConfirmProbation(businessId: string) {
    try {
      await employeeService.confirmProbation(businessId);
      toast({ title: "Confirmed", description: "Employee has been confirmed as active.", variant: "success" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to confirm employee", variant: "destructive" });
    }
  }

  function handleExport() {
    try {
      const csv = ["Employee ID,Full Name,Email,Department,Designation,Employment Type,Status,Joined"]
        .concat(filtered.map((e) =>
          `${e.employee_code},"${e.full_name}",${e.work_email},"${e.department_name || ""}","${e.designation || ""}",${e.employment_type || ""},${e.employment_status},${e.joining_date || ""}`
        ))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `employees-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `${filtered.length} employees exported as CSV` });
    } catch {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    }
  }

  const counts = {
    all: employees.length,
    active: employees.filter((e) => e.employment_status === "active").length,
    on_leave: employees.filter((e) => e.employment_status === "on_leave").length,
    probation: employees.filter((e) => e.employment_status === "probation").length,
    inactive: employees.filter((e) => e.employment_status === "inactive").length,
    terminated: employees.filter((e) => e.employment_status === "terminated").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your organization workforce</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />Export CSV
            </Button>
          )}
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/employees/import")}>
              <Upload className="mr-2 h-4 w-4" />Import
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, ID, email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="probation">Probation</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="on_leave">On Leave ({counts.on_leave})</TabsTrigger>
          <TabsTrigger value="probation">Probation ({counts.probation})</TabsTrigger>
          <TabsTrigger value="terminated">Terminated ({counts.terminated})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {search || statusFilter !== "all" ? "No employees match your filters" : "No employees yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Start by adding your first employee or importing from a spreadsheet."}
              </p>
              {canManage && !search && statusFilter === "all" && (
                <div className="flex gap-3">
                  <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />Add Employee
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/dashboard/employees/import")}>
                    <Upload className="mr-2 h-4 w-4" />Import Employees
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Designation</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                      onClick={() => router.push(`/dashboard/employees/${emp.business_id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(emp.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-tight">{emp.full_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{emp.work_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-foreground">
                          {emp.employee_code || "—"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{emp.department_name || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{emp.designation || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {EMPLOYMENT_TYPE_LABELS[emp.employment_type || ""] || emp.employment_type || "—"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(emp.joining_date) || "—"}</td>
                      <td className="p-4">
                        <Badge variant={statusColors[emp.employment_status] || "secondary"}>
                          {emp.employment_status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp.business_id}`)}>
                              <Eye className="mr-2 h-4 w-4" />View Profile
                            </DropdownMenuItem>
                            {canManage && (
                              <DropdownMenuItem onClick={() => openEditDialog(emp)}>
                                <Pencil className="mr-2 h-4 w-4" />Edit Details
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/attendance?employee=${emp.business_id}`)}>
                              <Clock className="mr-2 h-4 w-4" />Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/attendance?employee=${emp.business_id}&tab=leaves`)}>
                              <Calendar className="mr-2 h-4 w-4" />Leave
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/payroll?employee=${emp.business_id}`)}>
                              <DollarSign className="mr-2 h-4 w-4" />Payroll
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp.business_id}?tab=documents`)}>
                              <FileText className="mr-2 h-4 w-4" />Documents
                            </DropdownMenuItem>
                            {canManage && (
                              <>
                                <DropdownMenuSeparator />
                                {emp.employment_status === "probation" && (
                                  <DropdownMenuItem
                                    className="text-green-600 focus:text-green-600"
                                    onClick={() => handleConfirmProbation(emp.business_id)}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />Confirm Employee
                                  </DropdownMenuItem>
                                )}
                                {emp.employment_status === "active" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(emp.business_id, "inactive")}>
                                    <UserX className="mr-2 h-4 w-4" />Deactivate
                                  </DropdownMenuItem>
                                ) : emp.employment_status === "inactive" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(emp.business_id, "active")}>
                                    <UserCheck className="mr-2 h-4 w-4" />Activate
                                  </DropdownMenuItem>
                                ) : null}
                                {!["terminated", "resigned", "notice_period", "exit_clearance"].includes(emp.employment_status) && (
                                  <DropdownMenuItem
                                    className="text-orange-600 focus:text-orange-600"
                                    onClick={() => {
                                      setExitTargetId(emp.business_id);
                                      setExitForm({ resignation_date: new Date().toISOString().split("T")[0], last_working_day: "", exit_reason: "resignation", notes: "" });
                                      setExitDialogOpen(true);
                                    }}
                                  >
                                    <LogOut className="mr-2 h-4 w-4" />Start Exit
                                  </DropdownMenuItem>
                                )}
                                {emp.employment_status !== "terminated" && (
                                  <DropdownMenuItem
                                    className="text-red-700 focus:text-red-700"
                                    onClick={() => { setTerminatingId(emp.business_id); setTerminateDialogOpen(true); }}
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />Terminate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => { setDeletingId(emp.business_id); setDeleteDialogOpen(true); }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />Delete Record
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {!loading && filtered.length > 0 && (
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {employees.length} employee{employees.length !== 1 ? "s" : ""}
          </div>
        )}
      </Card>

      {/* Add / Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? "Update employee information." : "Fill in the details below. Employee ID will be auto-generated."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Smith" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <Input id="email" type="email" value={form.work_email} onChange={(e) => setForm({ ...form, work_email: e.target.value })} placeholder="john@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+60 12-345 6789" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department_id || "__none__"} onValueChange={(val) => setForm({ ...form, department_id: val === "__none__" ? "" : val })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Software Engineer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={form.employment_type} onValueChange={(val) => setForm({ ...form, employment_type: val })}>
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
                <Label htmlFor="doj">Date of Joining</Label>
                <Input id="doj" type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender || "__none__"} onValueChange={(val) => setForm({ ...form, gender: val === "__none__" ? "" : val })}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Prefer not to say</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEmployee ? "Update Employee" : "Create Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Confirmation Dialog */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Employee</DialogTitle>
            <DialogDescription>
              This will mark the employee as terminated. Their data will be preserved. You can reactivate them later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleTerminate}>Confirm Termination</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Exit / Resignation Dialog */}
      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Start Exit Workflow</DialogTitle>
            <DialogDescription>
              Record the employee&apos;s resignation or separation details. This moves the employee to &ldquo;Notice Period&rdquo; status and preserves all historical data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Exit Reason *</Label>
              <Select value={exitForm.exit_reason} onValueChange={(v) => setExitForm({ ...exitForm, exit_reason: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXIT_REASON_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Resignation / Separation Date *</Label>
                <Input
                  type="date"
                  value={exitForm.resignation_date}
                  onChange={(e) => setExitForm({ ...exitForm, resignation_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Working Day</Label>
                <Input
                  type="date"
                  value={exitForm.last_working_day}
                  onChange={(e) => setExitForm({ ...exitForm, last_working_day: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={exitForm.notes}
                onChange={(e) => setExitForm({ ...exitForm, notes: e.target.value })}
                placeholder="Optional notes about the exit..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitDialogOpen(false)}>Cancel</Button>
            <Button
              variant="default"
              onClick={handleStartExit}
              disabled={exitSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {exitSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              This will permanently delete the employee record. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
