"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { settingsService, organizationService, userService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Shield, Bell, Loader2, Plus, Edit, Trash2, MapPin, Briefcase, Clock, Users, UserPlus, Key, Ban, CheckCircle, Mail, Search } from "lucide-react";
import type { Branch, Designation, Shift } from "@/types";

interface ManagedUser {
  id: string;
  business_id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  last_login_at?: string;
  phone?: string;
}

const ROLE_OPTIONS = [
  { value: "company_admin", label: "Company Admin" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "recruiter", label: "Recruiter" },
  { value: "team_manager", label: "Team Manager" },
  { value: "finance", label: "Finance" },
  { value: "employee", label: "Employee" },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  company_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  hr_manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  recruiter: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  team_manager: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  finance: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  employee: "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
  invited: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function SettingsPage() {
  const { user, loadUser } = useAuthStore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({ full_name: "" });
  const [orgForm, setOrgForm] = useState({ name: "", industry: "", size: "", timezone: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    "Leave approvals": true,
    "Payroll updates": true,
    "New candidates": true,
    "Performance reviews": true,
    "System announcements": true,
  });

  const canManageOrg = ["super_admin", "company_admin", "hr_manager"].includes((user?.role || "").toLowerCase());
  const canManageUsers = ["super_admin", "company_admin"].includes((user?.role || "").toLowerCase());

  // Users
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userForm, setUserForm] = useState({ email: "", full_name: "", role: "employee", password: "", phone: "" });
  const [savingUser, setSavingUser] = useState(false);
  const [resetPwdDialogOpen, setResetPwdDialogOpen] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<ManagedUser | null>(null);
  const [resetPwdForm, setResetPwdForm] = useState({ newPassword: "", confirmPassword: "" });
  const [savingResetPwd, setSavingResetPwd] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "employee" });
  const [savingInvite, setSavingInvite] = useState(false);

  // Branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({ name: "", code: "", branch_type: "branch", city: "", state: "", country: "", timezone: "", email: "" });
  const [savingBranch, setSavingBranch] = useState(false);

  // Designations
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [designationDialogOpen, setDesignationDialogOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [designationForm, setDesignationForm] = useState({ name: "", code: "", level: 0, description: "" });
  const [savingDesignation, setSavingDesignation] = useState(false);

  // Shifts
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState({ name: "", code: "", shift_type: "general", start_time: "09:00", end_time: "18:00", break_duration_minutes: 60, work_hours: 8, is_night_shift: false, grace_minutes: 15, is_default: false });
  const [savingShift, setSavingShift] = useState(false);

  useEffect(() => {
    setProfileForm({ full_name: user?.full_name || "" });
  }, [user?.full_name]);

  useEffect(() => {
    async function loadSettings() {
      // Super admin has no company — skip org profile fetch
      if (!user || user.role === "super_admin") {
        setInitialLoading(false);
        return;
      }
      try {
        const company = await settingsService.getCompanyProfile();
        setOrgForm({
          name: company?.name || "",
          industry: company?.industry || "",
          size: company?.size || "",
          timezone: company?.timezone || "",
        });
      } catch {
        toast({ title: "Warning", description: "Could not load organization settings", variant: "destructive" });
      } finally {
        setInitialLoading(false);
      }
    }
    loadSettings();
  }, [user?.role]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await settingsService.updateProfile(profileForm);
      await loadUser();
      toast({ title: "Saved", description: "Profile updated successfully", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOrg() {
    if (!canManageOrg) {
      toast({ title: "Access restricted", description: "Only workspace owners and HR admins can update organization settings.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await settingsService.updateCompany(orgForm);
      toast({ title: "Saved", description: "Organization settings updated", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to update organization", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(passwordForm.newPassword)) {
      toast({ title: "Error", description: "Password must include uppercase, lowercase, number, and special character", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await settingsService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast({ title: "Success", description: "Password changed successfully", variant: "success" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast({ title: "Error", description: "Failed to change password. Check your current password.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleEnableMFA() {
    try {
      const result = await settingsService.enableMFA();
      toast({
        title: "MFA Ready",
        description: result?.setup_key ? `Setup key: ${result.setup_key}` : "Scan the QR code in your authenticator app.",
        variant: "success",
      });
    } catch {
      toast({ title: "Error", description: "Failed to enable MFA", variant: "destructive" });
    }
  }

  // ── Branch CRUD ──────────────────────────────────────────────
  const loadBranches = useCallback(async () => {
    setLoadingBranches(true);
    try {
      const res = await organizationService.listBranches();
      setBranches(Array.isArray(res) ? res : res?.data || []);
    } catch { /* ignore */ } finally { setLoadingBranches(false); }
  }, []);

  function openBranchDialog(b?: Branch) {
    if (b) {
      setEditingBranch(b);
      setBranchForm({ name: b.name, code: b.code || "", branch_type: b.branch_type || "branch", city: b.city || "", state: b.state || "", country: b.country || "", timezone: b.timezone || "", email: b.email || "" });
    } else {
      setEditingBranch(null);
      setBranchForm({ name: "", code: "", branch_type: "branch", city: "", state: "", country: "", timezone: "", email: "" });
    }
    setBranchDialogOpen(true);
  }

  async function handleSaveBranch() {
    setSavingBranch(true);
    try {
      if (editingBranch) {
        await organizationService.updateBranch(editingBranch.business_id, branchForm);
      } else {
        await organizationService.createBranch(branchForm);
      }
      toast({ title: "Saved", variant: "success" });
      setBranchDialogOpen(false);
      loadBranches();
    } catch {
      toast({ title: "Error", description: "Failed to save branch", variant: "destructive" });
    } finally { setSavingBranch(false); }
  }

  async function handleDeleteBranch(id: string) {
    if (!confirm("Delete this branch?")) return;
    try {
      await organizationService.deleteBranch(id);
      toast({ title: "Deleted", variant: "success" });
      loadBranches();
    } catch {
      toast({ title: "Error", description: "Failed to delete branch", variant: "destructive" });
    }
  }

  // ── Designation CRUD ───────────────────────────────────────
  const loadDesignations = useCallback(async () => {
    setLoadingDesignations(true);
    try {
      const res = await organizationService.listDesignations();
      setDesignations(Array.isArray(res) ? res : res?.data || []);
    } catch { /* ignore */ } finally { setLoadingDesignations(false); }
  }, []);

  function openDesignationDialog(d?: Designation) {
    if (d) {
      setEditingDesignation(d);
      setDesignationForm({ name: d.name, code: d.code || "", level: d.level || 0, description: d.description || "" });
    } else {
      setEditingDesignation(null);
      setDesignationForm({ name: "", code: "", level: 0, description: "" });
    }
    setDesignationDialogOpen(true);
  }

  async function handleSaveDesignation() {
    setSavingDesignation(true);
    try {
      if (editingDesignation) {
        await organizationService.updateDesignation(editingDesignation.business_id, designationForm);
      } else {
        await organizationService.createDesignation(designationForm);
      }
      toast({ title: "Saved", variant: "success" });
      setDesignationDialogOpen(false);
      loadDesignations();
    } catch {
      toast({ title: "Error", description: "Failed to save designation", variant: "destructive" });
    } finally { setSavingDesignation(false); }
  }

  async function handleDeleteDesignation(id: string) {
    if (!confirm("Delete this designation?")) return;
    try {
      await organizationService.deleteDesignation(id);
      toast({ title: "Deleted", variant: "success" });
      loadDesignations();
    } catch {
      toast({ title: "Error", description: "Failed to delete designation", variant: "destructive" });
    }
  }

  // ── Shift CRUD ─────────────────────────────────────────────
  const loadShifts = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const res = await organizationService.listShifts();
      setShifts(Array.isArray(res) ? res : res?.data || []);
    } catch { /* ignore */ } finally { setLoadingShifts(false); }
  }, []);

  function openShiftDialog(s?: Shift) {
    if (s) {
      setEditingShift(s);
      setShiftForm({ name: s.name, code: s.code || "", shift_type: s.shift_type, start_time: s.start_time, end_time: s.end_time, break_duration_minutes: s.break_duration_minutes, work_hours: s.work_hours, is_night_shift: s.is_night_shift, grace_minutes: s.grace_minutes, is_default: s.is_default });
    } else {
      setEditingShift(null);
      setShiftForm({ name: "", code: "", shift_type: "general", start_time: "09:00", end_time: "18:00", break_duration_minutes: 60, work_hours: 8, is_night_shift: false, grace_minutes: 15, is_default: false });
    }
    setShiftDialogOpen(true);
  }

  async function handleSaveShift() {
    setSavingShift(true);
    try {
      if (editingShift) {
        await organizationService.updateShift(editingShift.business_id, shiftForm);
      } else {
        await organizationService.createShift(shiftForm);
      }
      toast({ title: "Saved", variant: "success" });
      setShiftDialogOpen(false);
      loadShifts();
    } catch {
      toast({ title: "Error", description: "Failed to save shift", variant: "destructive" });
    } finally { setSavingShift(false); }
  }

  async function handleDeleteShift(id: string) {
    if (!confirm("Delete this shift?")) return;
    try {
      await organizationService.deleteShift(id);
      toast({ title: "Deleted", variant: "success" });
      loadShifts();
    } catch {
      toast({ title: "Error", description: "Failed to delete shift", variant: "destructive" });
    }
  }

  // ── User Management CRUD ───────────────────────────────────
  const loadUsers = useCallback(async (search?: string) => {
    setLoadingUsers(true);
    try {
      const res = await userService.list({ page: 1, page_size: 100, q: search || undefined });
      const items = res?.data || res || [];
      setManagedUsers(Array.isArray(items) ? items : []);
    } catch { /* ignore */ } finally { setLoadingUsers(false); }
  }, []);

  function openUserDialog(u?: ManagedUser) {
    if (u) {
      setEditingUser(u);
      setUserForm({ email: u.email, full_name: u.full_name, role: u.role, password: "", phone: u.phone || "" });
    } else {
      setEditingUser(null);
      setUserForm({ email: "", full_name: "", role: "employee", password: "", phone: "" });
    }
    setUserDialogOpen(true);
  }

  async function handleSaveUser() {
    setSavingUser(true);
    try {
      if (editingUser) {
        await userService.update(editingUser.business_id, {
          full_name: userForm.full_name,
          role: userForm.role,
          phone: userForm.phone || undefined,
        });
      } else {
        if (!userForm.email || !userForm.full_name) {
          toast({ title: "Error", description: "Email and name are required", variant: "destructive" });
          setSavingUser(false);
          return;
        }
        await userService.create({
          email: userForm.email,
          full_name: userForm.full_name,
          role: userForm.role,
          password: userForm.password || undefined,
          phone: userForm.phone || undefined,
        });
      }
      toast({ title: "Saved", description: editingUser ? "User updated" : "User created", variant: "success" });
      setUserDialogOpen(false);
      loadUsers(userSearch);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save user";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setSavingUser(false); }
  }

  async function handleToggleUserStatus(u: ManagedUser) {
    const newStatus = u.status === "active" ? "inactive" : "active";
    try {
      await userService.updateStatus(u.business_id, newStatus);
      toast({ title: "Updated", description: `User ${newStatus === "active" ? "activated" : "deactivated"}`, variant: "success" });
      loadUsers(userSearch);
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  }

  function openResetPwdDialog(u: ManagedUser) {
    setResetPwdUser(u);
    setResetPwdForm({ newPassword: "", confirmPassword: "" });
    setResetPwdDialogOpen(true);
  }

  async function handleResetPassword() {
    if (resetPwdForm.newPassword !== resetPwdForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (resetPwdForm.newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setSavingResetPwd(true);
    try {
      await userService.adminResetPassword(resetPwdUser!.business_id, resetPwdForm.newPassword);
      toast({ title: "Success", description: `Password reset for ${resetPwdUser!.email}`, variant: "success" });
      setResetPwdDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    } finally { setSavingResetPwd(false); }
  }

  async function handleInviteUser() {
    if (!inviteForm.email || !inviteForm.full_name) {
      toast({ title: "Error", description: "Email and name are required", variant: "destructive" });
      return;
    }
    setSavingInvite(true);
    try {
      await userService.invite({ email: inviteForm.email, full_name: inviteForm.full_name, role: inviteForm.role });
      toast({ title: "Invited", description: `Invite sent to ${inviteForm.email}`, variant: "success" });
      setInviteDialogOpen(false);
      setInviteForm({ email: "", full_name: "", role: "employee" });
      loadUsers(userSearch);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to invite user";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setSavingInvite(false); }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, workspace, and security controls</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Signed in as {user?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || "No email available"}</p>
          </div>
          <Badge variant="secondary">Role: {user?.role?.replace("_", " ") || "member"}</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue={canManageUsers ? "users" : "profile"} className="space-y-6" onValueChange={(v) => {
        if (v === "users" && !managedUsers.length) loadUsers();
        if (v === "branches" && !branches.length) loadBranches();
        if (v === "designations" && !designations.length) loadDesignations();
        if (v === "shifts" && !shifts.length) loadShifts();
      }}>
        <TabsList className="flex-wrap">
          {canManageUsers && <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>}
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="organization"><Building2 className="mr-2 h-4 w-4" />Organization</TabsTrigger>
          {canManageOrg && <TabsTrigger value="branches"><MapPin className="mr-2 h-4 w-4" />Branches</TabsTrigger>}
          {canManageOrg && <TabsTrigger value="designations"><Briefcase className="mr-2 h-4 w-4" />Designations</TabsTrigger>}
          {canManageOrg && <TabsTrigger value="shifts"><Clock className="mr-2 h-4 w-4" />Shifts</TabsTrigger>}
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
        </TabsList>

        {/* ── Users Tab ──────────────────────────────────────── */}
        {canManageUsers && (
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> User Management</CardTitle>
                <CardDescription>Create, edit, and manage user accounts for your organization</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setInviteForm({ email: "", full_name: "", role: "employee" }); setInviteDialogOpen(true); }}>
                  <Mail className="mr-2 h-4 w-4" />Invite User
                </Button>
                <Button onClick={() => openUserDialog()}>
                  <UserPlus className="mr-2 h-4 w-4" />Create User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    className="pl-10"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") loadUsers(userSearch); }}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => loadUsers(userSearch)}>Search</Button>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : managedUsers.length > 0 ? (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="hidden items-center gap-4 rounded-lg bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                    <span>User</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Last Login</span>
                    <span>Actions</span>
                  </div>
                  {managedUsers.map((u) => (
                    <div key={u.business_id} className="flex flex-col gap-2 rounded-lg border p-3 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4">
                      <div>
                        <p className="font-medium text-sm">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.employee}`}>
                          {u.role.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[u.status] || STATUS_COLORS.inactive}`}>
                          {u.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" title="Edit" onClick={() => openUserDialog(u)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" title="Reset Password" onClick={() => openResetPwdDialog(u)}><Key className="h-3.5 w-3.5" /></Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={u.status === "active" ? "Deactivate" : "Activate"}
                          className={u.status === "active" ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}
                          onClick={() => handleToggleUserStatus(u)}
                        >
                          {u.status === "active" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 h-10 w-10" />
                  <p className="font-medium">No users found</p>
                  <p className="text-xs mt-1">Create or invite users to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={user?.email || ""} disabled />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Configure your company profile and workspace defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canManageOrg && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  You can view organization information, but only workspace owners and HR admins can save changes.
                </div>
              )}
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="Your company name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input value={orgForm.industry} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} placeholder="e.g. Technology" />
                </div>
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Input value={orgForm.size} onChange={(e) => setOrgForm({ ...orgForm, size: e.target.value })} placeholder="e.g. 200-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={orgForm.timezone} onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })} placeholder="e.g. Asia/Kolkata" />
              </div>
              <Button onClick={handleSaveOrg} disabled={saving || !canManageOrg}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Branches Tab ───────────────────────────────────── */}
        <TabsContent value="branches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Branches</CardTitle>
                <CardDescription>Manage office locations and branches</CardDescription>
              </div>
              <Button onClick={() => openBranchDialog()} disabled={!canManageOrg}>
                <Plus className="mr-2 h-4 w-4" />Add Branch
              </Button>
            </CardHeader>
            <CardContent>
              {loadingBranches ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : branches.length > 0 ? (
                <div className="space-y-2">
                  {branches.map((b) => (
                    <div key={b.business_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{b.name}{b.code ? ` (${b.code})` : ""}</p>
                        <p className="text-xs text-muted-foreground">{[b.city, b.state, b.country].filter(Boolean).join(", ") || "No location set"} · {b.branch_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.employee_count !== undefined && <Badge variant="secondary">{b.employee_count} employees</Badge>}
                        <Button size="sm" variant="ghost" onClick={() => openBranchDialog(b)}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteBranch(b.business_id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <MapPin className="mx-auto mb-2 h-8 w-8" />
                  <p>No branches configured.</p>
                  <p className="text-xs">Add your office locations to organize employees by branch.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Designations Tab ───────────────────────────────── */}
        <TabsContent value="designations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Designations</CardTitle>
                <CardDescription>Job titles and hierarchy levels</CardDescription>
              </div>
              <Button onClick={() => openDesignationDialog()} disabled={!canManageOrg}>
                <Plus className="mr-2 h-4 w-4" />Add Designation
              </Button>
            </CardHeader>
            <CardContent>
              {loadingDesignations ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : designations.length > 0 ? (
                <div className="space-y-2">
                  {designations.map((d) => (
                    <div key={d.business_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{d.name}{d.code ? ` (${d.code})` : ""}</p>
                        <p className="text-xs text-muted-foreground">Level: {d.level || "—"}{d.description ? ` · ${d.description}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openDesignationDialog(d)}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteDesignation(d.business_id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Briefcase className="mx-auto mb-2 h-8 w-8" />
                  <p>No designations configured.</p>
                  <p className="text-xs">Add job titles like &quot;Software Engineer&quot;, &quot;HR Manager&quot;, etc.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Shifts Tab ─────────────────────────────────────── */}
        <TabsContent value="shifts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Shifts</CardTitle>
                <CardDescription>Define work shift schedules</CardDescription>
              </div>
              <Button onClick={() => openShiftDialog()} disabled={!canManageOrg}>
                <Plus className="mr-2 h-4 w-4" />Add Shift
              </Button>
            </CardHeader>
            <CardContent>
              {loadingShifts ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : shifts.length > 0 ? (
                <div className="space-y-2">
                  {shifts.map((s) => (
                    <div key={s.business_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{s.name}{s.code ? ` (${s.code})` : ""}</p>
                        <p className="text-xs text-muted-foreground">{s.start_time} – {s.end_time} · {s.work_hours}h · {s.shift_type}{s.is_night_shift ? " 🌙" : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.is_default && <Badge variant="secondary">Default</Badge>}
                        <Button size="sm" variant="ghost" onClick={() => openShiftDialog(s)}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteShift(s.business_id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-2 h-8 w-8" />
                  <p>No shifts configured.</p>
                  <p className="text-xs">Define shifts like &quot;Morning&quot;, &quot;Night&quot;, &quot;Flexible&quot;, etc.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage password and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>
              <Button onClick={handleChangePassword} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update Password
              </Button>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of protection for owner and admin accounts</p>
                </div>
                <Button variant="outline" onClick={handleEnableMFA}>Enable MFA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Leave approvals", desc: "Get notified when leave requests need attention" },
                { label: "Payroll updates", desc: "Notifications about payroll processing" },
                { label: "New candidates", desc: "When new applications are received" },
                { label: "Performance reviews", desc: "Review cycle reminders and submissions" },
                { label: "System announcements", desc: "Important platform updates" },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[pref.label] ?? true}
                    onCheckedChange={(checked) => setNotifPrefs((prev) => ({ ...prev, [pref.label]: checked }))}
                  />
                </div>
              ))}
              <Button onClick={() => toast({ title: "Saved", description: "Notification preferences updated", variant: "success" })}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingBranch ? "Edit" : "New"} Branch</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="e.g. Hyderabad HQ" />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} placeholder="e.g. HYD" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={branchForm.state} onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={branchForm.country} onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={branchForm.timezone} onChange={(e) => setBranchForm({ ...branchForm, timezone: e.target.value })} placeholder="e.g. Asia/Kolkata" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBranch} disabled={savingBranch || !branchForm.name}>
              {savingBranch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingBranch ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Designation Dialog */}
      <Dialog open={designationDialogOpen} onOpenChange={setDesignationDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDesignation ? "Edit" : "New"} Designation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={designationForm.name} onChange={(e) => setDesignationForm({ ...designationForm, name: e.target.value })} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={designationForm.code} onChange={(e) => setDesignationForm({ ...designationForm, code: e.target.value })} placeholder="e.g. SSE" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Input type="number" min={0} value={designationForm.level} onChange={(e) => setDesignationForm({ ...designationForm, level: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={designationForm.description} onChange={(e) => setDesignationForm({ ...designationForm, description: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesignationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDesignation} disabled={savingDesignation || !designationForm.name}>
              {savingDesignation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingDesignation ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingShift ? "Edit" : "New"} Shift</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} placeholder="e.g. Morning Shift" />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={shiftForm.code} onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })} placeholder="e.g. MRN" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Work Hours</Label>
                <Input type="number" min={0} step={0.5} value={shiftForm.work_hours} onChange={(e) => setShiftForm({ ...shiftForm, work_hours: parseFloat(e.target.value) || 8 })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Break (min)</Label>
                <Input type="number" min={0} value={shiftForm.break_duration_minutes} onChange={(e) => setShiftForm({ ...shiftForm, break_duration_minutes: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Grace (min)</Label>
                <Input type="number" min={0} value={shiftForm.grace_minutes} onChange={(e) => setShiftForm({ ...shiftForm, grace_minutes: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={shiftForm.shift_type} onValueChange={(v) => setShiftForm({ ...shiftForm, shift_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="shift-night" checked={shiftForm.is_night_shift} onChange={(e) => setShiftForm({ ...shiftForm, is_night_shift: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="shift-night">Night Shift</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="shift-default" checked={shiftForm.is_default} onChange={(e) => setShiftForm({ ...shiftForm, is_default: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="shift-default">Default Shift</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveShift} disabled={savingShift || !shiftForm.name}>
              {savingShift && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingShift ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Create/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingUser && (
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="user@company.com" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Leave blank to require activation" />
                <p className="text-xs text-muted-foreground">If omitted, user will need to set password via invite link.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={savingUser || !userForm.full_name || (!editingUser && !userForm.email)}>
              {savingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUser ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwdDialogOpen} onOpenChange={setResetPwdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Resetting password for <span className="font-medium text-foreground">{resetPwdUser?.full_name}</span> ({resetPwdUser?.email})
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Password *</Label>
              <Input type="password" value={resetPwdForm.newPassword} onChange={(e) => setResetPwdForm({ ...resetPwdForm, newPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <Input type="password" value={resetPwdForm.confirmPassword} onChange={(e) => setResetPwdForm({ ...resetPwdForm, confirmPassword: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwdDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={savingResetPwd || !resetPwdForm.newPassword || !resetPwdForm.confirmPassword}>
              {savingResetPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send an invitation to join your organization. The user will receive a link to set up their account.
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="user@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={inviteForm.full_name} onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInviteUser} disabled={savingInvite || !inviteForm.email || !inviteForm.full_name}>
              {savingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
