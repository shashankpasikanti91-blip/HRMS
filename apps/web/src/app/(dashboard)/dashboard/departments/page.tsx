"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Building2, Users, Edit, Trash2, Loader2 } from "lucide-react";
import { departmentService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import type { Department, DepartmentSummary } from "@/types";

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
    } catch {
      toast({ title: "Error", description: "Failed to save department", variant: "destructive" });
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
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Organizational structure and department management</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Department</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : departments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="transition-shadow hover:shadow-md">
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
                    {0} employees
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline">{dept.code}</Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(dept)}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openDelete(dept.business_id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
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
