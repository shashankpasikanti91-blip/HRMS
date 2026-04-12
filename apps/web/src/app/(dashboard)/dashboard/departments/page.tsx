"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Building2, Users, Edit, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { departmentService, employeeService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import type { Department, DepartmentSummary, EmployeeSummary } from "@/types";

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [selectedDept, setSelectedDept] = useState<DepartmentSummary | null>(null);
  const [deptEmployees, setDeptEmployees] = useState<EmployeeSummary[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await departmentService.list();
      setDepartments(Array.isArray(result) ? result : result?.data || []);
    } catch {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", code: "", description: "" });
    setDialogOpen(true);
  }

  function openEdit(dept: DepartmentSummary) {
    setEditing(dept);
    setForm({ name: dept.name, code: dept.code || "", description: dept.description || "" });
    setDialogOpen(true);
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  async function viewDepartment(dept: DepartmentSummary) {
    setSelectedDept(dept);
    setDeptLoading(true);
    try {
      const result = await employeeService.list({ department_id: dept.id, page_size: 200 });
      setDeptEmployees(Array.isArray(result) ? result : result?.data || []);
    } catch {
      setDeptEmployees([]);
    } finally {
      setDeptLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name) {
      toast({ title: "Validation Error", description: "Department name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await departmentService.update(editing.business_id, form);
        toast({ title: "Updated", description: "Department updated successfully", variant: "success" });
      } else {
        await departmentService.create(form);
        toast({ title: "Created", description: "Department created successfully", variant: "success" });
      }
      setDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save department";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setSaving(true);
    try {
      await departmentService.delete(deletingId);
      toast({ title: "Deleted", description: "Department deleted", variant: "success" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to delete department", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {selectedDept ? (
            <>
              <Button variant="ghost" size="sm" className="mb-2" onClick={() => setSelectedDept(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" />Back to Departments
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">{selectedDept.name}</h1>
              <p className="text-muted-foreground">{selectedDept.description || selectedDept.code} · {selectedDept.employee_count ?? 0} employees</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
              <p className="text-muted-foreground">Organizational structure and department management</p>
            </>
          )}
        </div>
        {!selectedDept && <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Department</Button>}
      </div>

      {selectedDept ? (
        /* Department Detail View */
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Employees in {selectedDept.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {deptLoading ? (
              <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : deptEmployees.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Employee</th>
                    <th className="p-3 text-left text-sm font-medium">Code</th>
                    <th className="p-3 text-left text-sm font-medium">Designation</th>
                    <th className="p-3 text-left text-sm font-medium">Email</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deptEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="p-3 text-sm font-medium">{emp.full_name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{emp.employee_code || emp.business_id}</td>
                      <td className="p-3 text-sm">{emp.designation || "—"}</td>
                      <td className="p-3 text-sm text-muted-foreground">{emp.work_email}</td>
                      <td className="p-3"><Badge variant={emp.employment_status === "active" ? "success" : "secondary"}>{emp.employment_status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-8 text-center text-muted-foreground">No employees in this department yet.</p>
            )}
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : departments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => viewDepartment(dept)}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                  <CardDescription>{dept.description || dept.code}</CardDescription>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {dept.employee_count ?? 0} employees
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline">{dept.code}</Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(dept); }}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDelete(dept.business_id); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-2 h-8 w-8" />
            <p>No departments yet. Click &quot;Add Department&quot; to create one.</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>{editing ? "Update department details" : "Create a new department"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engineering" />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. ENG" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone. Employees in this department will need to be reassigned.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
