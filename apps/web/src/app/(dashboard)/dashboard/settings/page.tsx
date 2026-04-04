"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/auth-store";
import { settingsService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Shield, Bell, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  // Organization form
  const [orgForm, setOrgForm] = useState({
    name: "", industry: "", size: "", timezone: "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await settingsService.updateProfile(profileForm);
      toast({ title: "Saved", description: "Profile updated successfully", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOrg() {
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
      await settingsService.enableMFA();
      toast({ title: "MFA Enabled", description: "Scan the QR code in your authenticator app", variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to enable MFA", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and organization settings</p>
      </div>

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
                </div>
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
              <CardDescription>Configure your company profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button onClick={handleSaveOrg} disabled={saving}>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
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
                  <Switch defaultChecked />
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
