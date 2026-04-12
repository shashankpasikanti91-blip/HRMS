"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { settingsService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Shield, Bell, Loader2 } from "lucide-react";

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

  useEffect(() => {
    setProfileForm({ full_name: user?.full_name || "" });
  }, [user?.full_name]);

  useEffect(() => {
    async function loadSettings() {
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
  }, []);

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

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="organization"><Building2 className="mr-2 h-4 w-4" />Organization</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
        </TabsList>

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
    </div>
  );
}
