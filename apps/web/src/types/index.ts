export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: string[];
  tenantId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  department?: Department;
  positionId?: string;
  position?: Position;
  managerId?: string;
  dateOfJoining: string;
  status: "active" | "inactive" | "on_leave" | "terminated" | "probation";
  employmentType: "full_time" | "part_time" | "contract" | "intern";
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  headId?: string;
  description?: string;
  _count?: { employees: number };
}

export interface Position {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  grade?: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: "present" | "absent" | "late" | "half_day" | "on_leave";
  hoursWorked?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType?: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  maxDays: number;
  carryForward: boolean;
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: "draft" | "processing" | "completed" | "approved";
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employee?: Employee;
  payrollRunId: string;
  basicSalary: number;
  hra: number;
  da: number;
  allowances: number;
  grossSalary: number;
  pf: number;
  esi: number;
  tds: number;
  deductions: number;
  netSalary: number;
}

export interface JobPosting {
  id: string;
  title: string;
  departmentId: string;
  department?: Department;
  description: string;
  requirements: string[];
  location: string;
  type: "full_time" | "part_time" | "contract" | "intern";
  status: "draft" | "open" | "closed" | "on_hold";
  openings: number;
  applicationsCount: number;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobPostingId: string;
  stage: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  resumeUrl?: string;
  aiScore?: number;
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  targetDate: string;
  progress: number;
  status: "not_started" | "in_progress" | "completed" | "cancelled";
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employee?: Employee;
  reviewerId: string;
  cycleId: string;
  rating?: number;
  status: "draft" | "submitted" | "approved";
  selfRating?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  newJoinsThisMonth: number;
  attendanceRate: number;
  openPositions: number;
  pendingLeaves: number;
  payrollTotal: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
