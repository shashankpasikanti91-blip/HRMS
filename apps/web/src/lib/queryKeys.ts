/**
 * Centralized React Query key factory.
 * Keep all query keys here to avoid cache collisions and ensure consistent invalidation.
 */

export const QK = {
  // Auth
  me: () => ["me"] as const,

  // Company
  company: () => ["company"] as const,

  // Dashboard
  dashboard: () => ["dashboard"] as const,
  analyticsAttendance: (days?: number) => ["analytics", "attendance", days ?? 30] as const,
  analyticsRecruitmentFunnel: () => ["analytics", "recruitment-funnel"] as const,
  analyticsHeadcount: () => ["analytics", "headcount"] as const,
  analyticsLeaveSummary: () => ["analytics", "leave-summary"] as const,
  analyticsPayrollSummary: () => ["analytics", "payroll-summary"] as const,

  // Employees
  employees: (filters?: Record<string, unknown>) => ["employees", filters ?? {}] as const,
  employee: (businessId: string) => ["employee", businessId] as const,
  employeeSummary: (businessId: string) => ["employee-summary", businessId] as const,

  // Departments
  departments: (filters?: Record<string, unknown>) => ["departments", filters ?? {}] as const,
  department: (businessId: string) => ["department", businessId] as const,

  // Attendance
  attendance: (filters?: Record<string, unknown>) => ["attendance", filters ?? {}] as const,
  attendanceRecord: (businessId: string) => ["attendance-record", businessId] as const,
  attendanceByEmployee: (empId: string, filters?: Record<string, unknown>) =>
    ["attendance-employee", empId, filters ?? {}] as const,
  today: () => ["attendance-today"] as const,

  // Leave
  leaves: (filters?: Record<string, unknown>) => ["leaves", filters ?? {}] as const,
  leave: (businessId: string) => ["leave", businessId] as const,
  leavesByEmployee: (empId: string) => ["leaves-employee", empId] as const,

  // Jobs
  jobs: (filters?: Record<string, unknown>) => ["jobs", filters ?? {}] as const,
  job: (businessId: string) => ["job", businessId] as const,

  // Candidates
  candidates: (filters?: Record<string, unknown>) => ["candidates", filters ?? {}] as const,
  candidate: (businessId: string) => ["candidate", businessId] as const,

  // Applications
  applications: (filters?: Record<string, unknown>) => ["applications", filters ?? {}] as const,
  application: (businessId: string) => ["application", businessId] as const,

  // Interviews
  interviews: (filters?: Record<string, unknown>) => ["interviews", filters ?? {}] as const,
  interview: (businessId: string) => ["interview", businessId] as const,

  // Offers
  offers: (filters?: Record<string, unknown>) => ["offers", filters ?? {}] as const,
  offer: (businessId: string) => ["offer", businessId] as const,

  // Payroll
  payrollRuns: (filters?: Record<string, unknown>) => ["payroll-runs", filters ?? {}] as const,
  payrollRun: (businessId: string) => ["payroll-run", businessId] as const,
  payrollItems: (runId: string) => ["payroll-items", runId] as const,

  // Performance
  performanceReviews: (filters?: Record<string, unknown>) => ["performance-reviews", filters ?? {}] as const,
  performanceReview: (businessId: string) => ["performance-review", businessId] as const,

  // Documents
  documents: (filters?: Record<string, unknown>) => ["documents", filters ?? {}] as const,
  document: (businessId: string) => ["document", businessId] as const,

  // Notifications
  notifications: (params?: Record<string, unknown>) => ["notifications", params ?? {}] as const,
  unreadNotifications: () => ["notifications-unread"] as const,

  // Search
  globalSearch: (q: string) => ["global-search", q] as const,
} as const;
