/**
 * Route helpers using business_id for all entity URLs.
 * All navigation should go through these functions.
 */

export const routes = {
  // ── Dashboard ─────────────────────────────────────────────
  dashboard: () => "/dashboard",

  // ── Employees ─────────────────────────────────────────────
  employees: () => "/dashboard/employees",
  employee: (businessId: string) => `/dashboard/employees/${businessId}`,
  employeeEdit: (businessId: string) => `/dashboard/employees/${businessId}/edit`,
  employeeCreate: () => "/dashboard/employees/new",

  // ── Departments ───────────────────────────────────────────
  departments: () => "/dashboard/departments",
  department: (businessId: string) => `/dashboard/departments/${businessId}`,

  // ── Attendance ────────────────────────────────────────────
  attendance: () => "/dashboard/attendance",
  attendanceRecord: (businessId: string) => `/dashboard/attendance/${businessId}`,

  // ── Leave ─────────────────────────────────────────────────
  leaves: () => "/dashboard/leave",
  leave: (businessId: string) => `/dashboard/leave/${businessId}`,

  // ── Recruitment ───────────────────────────────────────────
  recruitment: (tab?: string) => tab ? `/dashboard/recruitment?tab=${tab}` : "/dashboard/recruitment",
  job: (businessId: string) => `/dashboard/recruitment/jobs/${businessId}`,
  candidate: (businessId: string) => `/dashboard/recruitment/candidates/${businessId}`,
  application: (businessId: string) => `/dashboard/recruitment/applications/${businessId}`,
  interview: (businessId: string) => `/dashboard/recruitment/interviews/${businessId}`,
  offer: (businessId: string) => `/dashboard/recruitment/offers/${businessId}`,

  // ── Payroll ───────────────────────────────────────────────
  payroll: () => "/dashboard/payroll",
  payrollRun: (businessId: string) => `/dashboard/payroll/${businessId}`,
  payrollItem: (businessId: string) => `/dashboard/payroll/items/${businessId}`,

  // ── Performance ───────────────────────────────────────────
  performance: () => "/dashboard/performance",
  performanceReview: (businessId: string) => `/dashboard/performance/${businessId}`,

  // ── Notifications ─────────────────────────────────────────
  notifications: () => "/dashboard/notifications",

  // ── Analytics ─────────────────────────────────────────────
  analytics: () => "/dashboard/analytics",

  // ── AI Assistant ──────────────────────────────────────────
  aiAssistant: () => "/dashboard/ai-assistant",

  // ── Settings ──────────────────────────────────────────────
  settings: () => "/dashboard/settings",

  // ── Imports / Documents ───────────────────────────────────
  imports: () => "/dashboard/imports",

  // ── Auth ──────────────────────────────────────────────────
  login: () => "/login",
  forgotPassword: () => "/forgot-password",
};

/**
 * Resolve an open_route returned by the search API to a frontend URL.
 * The backend returns routes like /employees/EMP-000001.
 * We prepend /dashboard.
 */
export function resolveOpenRoute(openRoute: string): string {
  if (!openRoute) return "/dashboard";
  if (openRoute.startsWith("/dashboard")) return openRoute;
  return `/dashboard${openRoute}`;
}
