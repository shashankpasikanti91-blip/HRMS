/**
 * Role-based permission helpers.
 * Roles (from backend): super_admin, company_admin, hr_manager, recruiter, manager, employee
 */

export type UserRole =
  | "super_admin"
  | "company_admin"
  | "hr_manager"
  | "recruiter"
  | "manager"
  | "employee";

const ROLE_LEVELS: Record<UserRole, number> = {
  super_admin: 100,
  company_admin: 80,
  hr_manager: 60,
  recruiter: 50,
  manager: 40,
  employee: 10,
};

function level(role: string): number {
  return ROLE_LEVELS[role as UserRole] ?? 0;
}

export const can = {
  viewAllEmployees: (role: string) => level(role) >= 40,
  manageEmployees: (role: string) => level(role) >= 60,
  viewAllAttendance: (role: string) => level(role) >= 40,
  approveAttendance: (role: string) => level(role) >= 60,
  viewAllLeaves: (role: string) => level(role) >= 40,
  approveLeaves: (role: string) => level(role) >= 40,
  manageRecruitment: (role: string) => level(role) >= 50,
  managePayroll: (role: string) => level(role) >= 60,
  viewAnalytics: (role: string) => level(role) >= 40,
  manageSettings: (role: string) => level(role) >= 80,
  viewDepartments: (role: string) => level(role) >= 10,
  manageDepartments: (role: string) => level(role) >= 60,
  isHrOrAbove: (role: string) => level(role) >= 60,
  isAdminOrAbove: (role: string) => level(role) >= 80,
  isSuperAdmin: (role: string) => role === "super_admin",
};

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    company_admin: "Company Admin",
    hr_manager: "HR Manager",
    recruiter: "Recruiter",
    manager: "Manager",
    employee: "Employee",
  };
  return labels[role] ?? role;
}

export function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  if (role === "super_admin" || role === "company_admin") return "destructive";
  if (role === "hr_manager" || role === "recruiter") return "default";
  if (role === "manager") return "secondary";
  return "outline";
}
