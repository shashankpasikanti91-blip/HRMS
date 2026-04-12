// ─── Shared base ────────────────────────────────────────────
export interface BaseRecord {
  id: string;
  business_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

// ─── Auth / User ─────────────────────────────────────────────
export interface AuthUser {
  id: string;
  business_id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  role: string;
  company_id: string;
  company_name?: string;
  avatar_url?: string;
  // legacy alias kept for compatibility
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

// ─── Company ─────────────────────────────────────────────────
export interface Company extends BaseRecord {
  name: string;
  legal_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  industry?: string;
  size?: string;
  logo_url?: string;
  currency?: string;
  company_size?: string;
}

// ─── Department ──────────────────────────────────────────────
export interface Department extends BaseRecord {
  company_id: string;
  name: string;
  code?: string;
  description?: string;
  parent_department_id?: string;
  head_employee_id?: string;
  employee_count?: number;
}

export interface DepartmentSummary {
  id: string;
  business_id: string;
  name: string;
  code?: string;
  description?: string;
  employee_count?: number;
}

// ─── Employee ────────────────────────────────────────────────
export interface Employee extends BaseRecord {
  company_id: string;
  user_id?: string;
  employee_code: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  work_email: string;
  personal_email?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  joining_date?: string;
  employment_type?: string;
  work_mode?: string;
  department_id?: string;
  department_name?: string;
  designation?: string;
  manager_id?: string;
  manager_name?: string;
  employment_status: string;
  location?: string;
  profile_photo_url?: string;
  documents_count?: number;
  visa_status?: string;
  visa_type?: string;
  visa_expiry_date?: string;
  passport_number?: string;
  passport_expiry_date?: string;
  nationality?: string;
  // Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  // Bank details
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_branch?: string;
  // Organization links
  branch_id?: string;
  branch_name?: string;
  designation_id?: string;
  designation_name?: string;
}

export interface EmployeeSummary {
  id: string;
  business_id: string;
  employee_code: string;
  full_name: string;
  work_email: string;
  department_name?: string;
  designation?: string;
  employment_status: string;
  joining_date?: string;
}

// ─── Attendance ──────────────────────────────────────────────
export interface AttendanceRecord extends BaseRecord {
  company_id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  total_hours?: number;
  overtime_hours?: number;
  late_minutes?: number;
  status: string;
  check_in_method?: string;
  check_out_method?: string;
  check_in_location?: string;
  check_out_location?: string;
  remarks?: string;
  is_approved: boolean;
}

// ─── Leave ───────────────────────────────────────────────────
export interface LeaveRequest extends BaseRecord {
  company_id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days?: number;
  reason?: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

// ─── Job Posting ─────────────────────────────────────────────
export interface JobPosting extends BaseRecord {
  company_id: string;
  title: string;
  department_id?: string;
  department_name?: string;
  hiring_manager_id?: string;
  recruiter_id?: string;
  employment_type?: string;
  experience_level?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  openings: number;
  description?: string;
  requirements?: string;
  status: string;
  posted_at?: string;
  closing_date?: string;
  applications_count?: number;
}

// ─── Candidate ───────────────────────────────────────────────
export interface Candidate extends BaseRecord {
  company_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  current_location?: string;
  years_of_experience?: number;
  current_company?: string;
  current_role?: string;
  expected_salary?: number;
  notice_period?: number;
  resume_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  source?: string;
  ai_score?: number;
  ai_summary?: string;
  status: string;
}

// ─── Application ─────────────────────────────────────────────
export type ApplicationStage =
  | "applied" | "screening" | "shortlisted" | "interview"
  | "offer" | "hired" | "rejected" | "on_hold";

export interface Application extends BaseRecord {
  company_id: string;
  candidate_id: string;
  job_posting_id: string;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  current_stage: ApplicationStage;
  application_status: string;
  ai_screening_score?: number;
  ai_screening_status?: string;
  applied_at?: string;
  notes?: string;
}

// ─── Interview ───────────────────────────────────────────────
export interface Interview extends BaseRecord {
  company_id: string;
  application_id: string;
  candidate_id?: string;
  candidate_name?: string;
  job_posting_id?: string;
  job_title?: string;
  round_name?: string;
  interview_type?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  interviewer_ids?: string[];
  status: string;
  feedback?: string;
  score?: number;
}

// ─── Offer ───────────────────────────────────────────────────
export interface Offer extends BaseRecord {
  company_id: string;
  application_id: string;
  candidate_id: string;
  candidate_name?: string;
  job_posting_id?: string;
  offered_role?: string;
  offered_salary?: number;
  currency: string;
  joining_date?: string;
  offer_status: string;
  valid_until?: string;
  sent_at?: string;
  accepted_at?: string;
}

// ─── Payroll ─────────────────────────────────────────────────
export interface PayrollRun extends BaseRecord {
  company_id: string;
  period_month: number;
  period_year: number;
  status: string;
  total_employees?: number;
  total_gross?: number;
  total_deductions?: number;
  total_net?: number;
  currency: string;
  processed_at?: string;
  approved_at?: string;
}

export interface PayrollItem extends BaseRecord {
  company_id: string;
  payroll_run_id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  basic_salary: number;
  gross_salary: number;
  allowances?: number;
  deductions?: number;
  tax_amount?: number;
  total_deductions: number;
  net_salary: number;
  currency: string;
  status: string;
  payment_status?: string;
}

// ─── Payslip Detail ──────────────────────────────────────────
export interface PayslipDetail {
  payslip: {
    business_id: string;
    gross_salary: number;
    allowances: number;
    deductions: number;
    tax_amount: number;
    net_salary: number;
    currency: string;
    payment_status: string;
    payment_date: string | null;
  };
  employee: {
    business_id: string;
    full_name: string;
    employee_code: string;
    work_email: string;
    department_name: string | null;
    designation: string | null;
    joining_date: string | null;
  } | null;
  payroll_run: {
    business_id: string;
    period_month: number;
    period_year: number;
    status: string;
  } | null;
  company: {
    name: string;
    legal_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    logo_url: string | null;
  } | null;
}

// ─── AI Screening ────────────────────────────────────────────
export interface AIScreeningResult {
  name: string;
  email: string;
  contact_number: string;
  current_company: string;
  score: number;
  decision: string;
  error?: string;
  evaluation: {
    candidate_strengths: string[];
    high_match_skills: string[];
    medium_match_skills: string[];
    low_or_missing_match_skills: string[];
    candidate_weaknesses: string[];
    risk_level: string;
    risk_explanation: string;
    reward_level: string;
    reward_explanation: string;
    overall_fit_rating: number;
    justification: string;
  };
}

// ─── AI Job Posts ────────────────────────────────────────────
export interface AIJobPosts {
  client_project: string;
  recruitment_type: string;
  role: string;
  experience: string;
  location: string;
  contract_duration: string;
  key_skills: string[];
  no_of_submissions: number;
  linkedin_post: string;
  indeed_post: string;
  email_post: string;
  whatsapp_post: string;
  error?: string;
}

// ─── Performance ─────────────────────────────────────────────
export interface PerformanceReview extends BaseRecord {
  company_id: string;
  employee_id: string;
  employee_name?: string;
  reviewer_id?: string;
  cycle_id?: string;
  status: string;
  overall_rating?: number;
  submitted_at?: string;
}

// ─── Document ────────────────────────────────────────────────
export interface Document extends BaseRecord {
  company_id: string;
  employee_id?: string;
  candidate_id?: string;
  document_type?: string;
  file_name: string;
  file_url: string;
  mime_type?: string;
  file_size?: number;
  uploaded_by?: string;
  verification_status: string;
  description?: string;
}

// ─── Notification ────────────────────────────────────────────
export interface Notification extends BaseRecord {
  company_id: string;
  user_id: string;
  title: string;
  message?: string;
  category: string;
  is_read: boolean;
  action_url?: string;
  entity_type?: string;
  entity_id?: string;
}

// ─── Holiday ─────────────────────────────────────────────────
export interface Holiday extends BaseRecord {
  company_id: string;
  name: string;
  date: string;
  holiday_type: string; // public, restricted, optional
  country?: string;
  state?: string;
  description?: string;
  is_paid: boolean;
}

// ─── Search ──────────────────────────────────────────────────
export interface SearchResultItem {
  entity_type: string;
  id: string;
  business_id: string;
  title: string;
  subtitle?: string;
  status?: string;
  open_route: string;
  extra?: Record<string, unknown>;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
}

// ─── Analytics ───────────────────────────────────────────────
export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  open_jobs: number;
  total_candidates: number;
  candidates_in_screening: number;
  interviews_scheduled: number;
  offers_pending: number;
  hires_this_month: number;
  leave_requests_pending: number;
  departments_count: number;
  new_employees_this_month: number;
}

export interface AttendanceSummaryItem {
  date: string;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  on_leave: number;
  work_from_home: number;
  total_employees: number;
  attendance_percentage: number;
}

export interface RecruitmentFunnelItem {
  stage: string;
  count: number;
  percentage: number;
}

export interface HeadcountByDept {
  department_id: string;
  department_name: string;
  total: number;
  active: number;
}

export interface LeaveSummaryItem {
  leave_type: string;
  total_requests: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface PayrollSummaryItem {
  period_month: number;
  period_year: number;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  currency: string;
  status: string;
}

// ─── Branch ──────────────────────────────────────────────────
export interface Branch extends BaseRecord {
  company_id: string;
  name: string;
  code?: string;
  branch_type: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  employee_count?: number;
}

// ─── Designation ─────────────────────────────────────────────
export interface Designation extends BaseRecord {
  company_id: string;
  name: string;
  code?: string;
  level?: number;
  description?: string;
}

// ─── Organization Settings ───────────────────────────────────
export interface OrganizationSettings {
  business_id: string;
  company_id: string;
  working_days?: number[];
  weekend_days?: number[];
  work_start_time?: string;
  work_end_time?: string;
  daily_work_hours: number;
  weekly_work_hours: number;
  late_threshold_minutes: number;
  overtime_threshold_hours: number;
  overtime_multiplier: number;
  payroll_cycle: string;
  payroll_process_day: number;
  default_currency: string;
  probation_period_days: number;
  notice_period_days: number;
  date_format: string;
  time_format: string;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_number: boolean;
  password_require_special: boolean;
  password_expiry_days: number;
  enable_overtime: boolean;
  enable_shifts: boolean;
  enable_geo_tracking: boolean;
  enable_client_billing: boolean;
  enable_telegram_bot: boolean;
  custom_config?: Record<string, unknown>;
}

// ─── Leave Policy ────────────────────────────────────────────
export interface LeavePolicy extends BaseRecord {
  company_id: string;
  name: string;
  description?: string;
  is_default: boolean;
}

// ─── Leave Type (Policy Engine) ──────────────────────────────
export interface LeavePolicyType extends BaseRecord {
  leave_policy_id: string;
  name: string;
  code: string;
  annual_quota: number;
  max_consecutive_days?: number;
  min_days_per_request: number;
  is_paid: boolean;
  is_carry_forward: boolean;
  max_carry_forward?: number;
  accrual_frequency: string;
  requires_approval: boolean;
  requires_attachment: boolean;
  applicable_gender?: string;
  probation_eligible: boolean;
  encashable: boolean;
  color?: string;
}

// ─── Leave Balance ───────────────────────────────────────────
export interface LeaveBalance {
  business_id: string;
  employee_id: string;
  leave_type_id: string;
  leave_type_name?: string;
  leave_type_code?: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  carried_forward: number;
  available: number;
}

// ─── Attendance Policy ───────────────────────────────────────
export interface AttendancePolicy {
  business_id: string;
  company_id: string;
  name: string;
  check_in_required: boolean;
  auto_checkout: boolean;
  auto_checkout_time?: string;
  allow_manual_entry: boolean;
  require_approval_for_corrections: boolean;
  track_breaks: boolean;
  max_break_minutes?: number;
  grace_period_minutes: number;
  half_day_hours: number;
  min_hours_for_full_day: number;
  enable_geo_fencing: boolean;
  geo_fence_radius_meters?: number;
  allowed_check_in_methods?: string[];
}

// ─── Country Config ──────────────────────────────────────────
export interface CountryConfig {
  business_id: string;
  country_code: string;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  date_format: string;
  timezone: string;
  default_weekend_days?: number[];
  default_work_hours: number;
  minimum_wage?: number;
}

// ─── Salary Structure ────────────────────────────────────────
export interface SalaryStructure extends BaseRecord {
  company_id: string;
  name: string;
  code?: string;
  description?: string;
  currency: string;
  is_default: boolean;
  payroll_cycle: string;
  components?: SalaryComponent[];
}

// ─── Salary Component ────────────────────────────────────────
export interface SalaryComponent extends BaseRecord {
  salary_structure_id: string;
  name: string;
  code: string;
  component_type: string;
  calculation_type: string;
  amount?: number;
  percentage?: number;
  formula?: string;
  is_taxable: boolean;
  is_mandatory: boolean;
  priority: number;
  max_amount?: number;
  min_amount?: number;
  description?: string;
}

// ─── Employee Salary ─────────────────────────────────────────
export interface EmployeeSalary extends BaseRecord {
  employee_id: string;
  salary_structure_id: string;
  ctc: number;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  currency: string;
  component_overrides?: Record<string, unknown>;
  effective_from?: string;
}

// ─── Shift ───────────────────────────────────────────────────
export interface Shift extends BaseRecord {
  company_id: string;
  name: string;
  code?: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  work_hours: number;
  is_night_shift: boolean;
  grace_minutes: number;
  is_default: boolean;
  applicable_days?: number[];
}

// ─── Client / Staffing ──────────────────────────────────────
export interface Client extends BaseRecord {
  company_id: string;
  name: string;
  legal_name?: string;
  industry?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  billing_address?: string;
  status: string;
}

export interface ClientProject extends BaseRecord {
  client_id: string;
  name: string;
  code?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  billing_rate?: number;
  billing_currency?: string;
  status: string;
}

// ─── Legacy aliases (kept to avoid breaking non-updated pages) ──────────────
/** @deprecated use AuthUser */
export type User = AuthUser;
/** @deprecated use LeaveRequest */
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  maxDays: number;
  carryForward: boolean;
}
/** @deprecated */
export interface Goal {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  targetDate: string;
  progress: number;
  status: string;
}
/** @deprecated */
export interface Payslip {
  id: string;
  employee_id: string;
  payrollRunId: string;
  grossSalary: number;
  netSalary: number;
}
/** @deprecated */
export interface PerformanceReviewLegacy {
  id: string;
  employee_id: string;
  status: string;
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
