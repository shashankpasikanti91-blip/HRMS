"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import GlobalSearch from "@/components/search/GlobalSearch";
import NotificationBell from "@/components/layout/NotificationBell";
import {
  LayoutDashboard, Users, Building2, Clock, DollarSign,
  Target, Bell, BarChart3, Settings, LogOut, ChevronLeft, Menu, CalendarDays,
  Activity, FileText, Landmark, Umbrella, MinusCircle,
} from "lucide-react";

// Roles that can manage the organization (admin/HR tier)
const ADMIN_ROLES = ["super_admin", "company_admin", "hr_manager"];
const MANAGEMENT_ROLES = [...ADMIN_ROLES, "team_manager"];

const navItems = [
  { href: "/dashboard",                  label: "Dashboard",    icon: LayoutDashboard, roles: null },
  { href: "/dashboard/employees",        label: "Employees",    icon: Users,            roles: ADMIN_ROLES },
  { href: "/dashboard/departments",      label: "Departments",  icon: Building2,        roles: [...ADMIN_ROLES, "finance", "team_manager"] },
  { href: "/dashboard/attendance",       label: "Attendance",   icon: Clock,            roles: null },
  { href: "/dashboard/leave",            label: "Leave",        icon: Umbrella,         roles: null },
  { href: "/dashboard/holidays",         label: "Holidays",     icon: CalendarDays,     roles: null },
  { href: "/dashboard/payroll",          label: "Payroll",      icon: DollarSign,       roles: [...ADMIN_ROLES, "finance", "payroll_admin"] },
  { href: "/dashboard/lop",              label: "LOP",          icon: MinusCircle,      roles: [...ADMIN_ROLES, "finance", "payroll_admin"] },
  { href: "/dashboard/taxation",         label: "Taxation",     icon: Landmark,         roles: [...ADMIN_ROLES, "finance", "payroll_admin"] },
  { href: "/dashboard/documents",        label: "Documents",    icon: FileText,         roles: null },
  { href: "/dashboard/performance",      label: "Performance",  icon: Target,           roles: [...MANAGEMENT_ROLES] },
  { href: "/dashboard/notifications",    label: "Notifications",icon: Bell,             roles: null },
  { href: "/dashboard/analytics",        label: "Analytics",    icon: BarChart3,        roles: ADMIN_ROLES },
  { href: "/dashboard/system-logs",      label: "System Logs",  icon: Activity,         roles: ["super_admin", "company_admin"] },
  { href: "/dashboard/settings",         label: "Settings",     icon: Settings,         roles: null },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    loadUser().finally(() => setAuthChecked(true));
  }, [loadUser]);

  useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authChecked, isLoading, isAuthenticated, router]);

  if (isLoading || !authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300 lg:relative ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            S
          </div>
          {!collapsed && <span className="text-lg font-bold">SRP AI HRMS</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems
            .filter((item) => !item.roles || (user?.role && item.roles.includes(user.role)))
            .map((item) => {
            const isActive = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full items-center justify-center rounded-lg p-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent lg:flex"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden flex-1 lg:flex lg:max-w-sm">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user ? getInitials(user.full_name ?? user.email) : "U"}
                </AvatarFallback>
              </Avatar>
              {user && (
                <div className="hidden text-sm lg:block">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
