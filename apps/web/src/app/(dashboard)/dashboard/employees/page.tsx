"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Download, Upload, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { employeeService, departmentService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatDate } from "@/lib/utils";
import type { EmployeeSummary, DepartmentSummary } from "@/types";

const statusColors: Record<string, "success" | "warning" | "destructive" | "secondary" | "default"> = {
  active: "success",
  inactive: "secondary",
  on_leave: "warning",
  terminated: "destructive",
  probation: "default",
};

export default function EmployeesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", work_email: "", phone: "",
    department_id: "", employment_type: "full_time" as string,
    joining_date: new Date().toISOString().split("T")[0],
    gender: "", date_of_birth: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empResult, deptResult] = await Promise.allSettled([
        employeeService.list({ q: search || undefined, employment_status: statusFilter !== "all" ? statusFilter : undefined }),
        departmentService.listAll(),
      ]);
      if (empResult.status === "fulfilled") {
        const empData = empResult.value;
        setEmployees(Array.isArray(empData) ? empData : empData?.data || []);
      }
      if (deptResult.status === "fulfilled") {
        setDepartments(deptResult.value);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load employees", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = employees.filter((e) => {
    const matchSearch = `${e.full_name} ${e.employee_code} ${e.work_email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.employment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openAddDialog() {
    setEditingEmployee(null);
    setForm({ full_name: "", work_email: "", phone: "", department_id: "", employment_type: "full_time", joining_date: new Date().toISOString().split("T")[0], gender: "", date_of_birth: "" });
    setDialogOpen(true);
  }

  async function openEditDialog(emp: EmployeeSummary) {
    // Fetch full employee data for accurate pre-fill
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
      });
      setDialogOpen(true);
    } catch {
      toast({ title: "Error", description: "Failed to load employee details", variant: "destructive" });
    }
  }

  async function handleSave() {
    if (!form.full_name || !form.work_email) {
      toast({ title: "Validation Error", description: "Full name and email are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.business_id, form);
        toast({ title: "Success", description: "Employee updated successfully", variant: "success" });
      } else {
        await employeeService.create(form);
        toast({ title: "Success", description: "Employee created successfully", variant: "success" });
      }
      setDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg = axErr?.response?.data?.detail || axErr?.response?.data?.message || "Failed to save employee";
      toast({ title: "Error", description: msg, variant: "destructive" });
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

  async function handleExport() {
    try {
      // Export from current data
      const csv = ["Employee Code,Full Name,Email,Department,Status,Joined"]
        .concat(filtered.map((e) => `${e.employee_code},${e.full_name},${e.work_email},${e.department_name || ""},${e.employment_status},${e.joining_date || ""}`))
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your organization&apos;s workforce</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button size="sm" onClick={openAddDialog}><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
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

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({employees.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({employees.filter((e) => e.employment_status === "active").length})</TabsTrigger>
          <TabsTrigger value="on_leave">On Leave ({employees.filter((e) => e.employment_status === "on_leave").length})</TabsTrigger>
          <TabsTrigger value="probation">Probation ({employees.filter((e) => e.employment_status === "probation").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-sm font-medium">Employee</th>
                    <th className="p-4 text-left text-sm font-medium">Department</th>
                    <th className="p-4 text-left text-sm font-medium">Position</th>
                    <th className="p-4 text-left text-sm font-medium">Joined</th>
                    <th className="p-4 text-left text-sm font-medium">Status</th>
                    <th className="p-4 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => router.push(`/dashboard/employees/${emp.business_id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">{getInitials(emp.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{emp.full_name}</p>
                            <p className="text-xs text-muted-foreground">{emp.employee_code} &middot; {emp.work_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{emp.department_name || "—"}</td>
                      <td className="p-4 text-sm">{emp.designation || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(emp.joining_date)}</td>
                      <td className="p-4"><Badge variant={statusColors[emp.employment_status] || "secondary"}>{emp.employment_status.replace("_", " ")}</Badge></td>
                      <td className="p-4">
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(emp)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { setDeletingId(emp.business_id); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        {search ? "No employees match your search" : "No employees found. Click 'Add Employee' to get started."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? "Update employee information" : "Fill in details to create a new employee. Employee ID will be auto-generated."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <Input id="email" type="email" value={form.work_email} onChange={(e) => setForm({ ...form, work_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department_id} onValueChange={(val) => setForm({ ...form, department_id: val })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doj">Date of Joining</Label>
                <Input id="doj" type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(val) => setForm({ ...form, gender: val })}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEmployee ? "Update" : "Create"} Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>Are you sure you want to delete this employee? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
