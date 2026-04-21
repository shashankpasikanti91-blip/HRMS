/**
 * SRP AI HRMS – API Services
 * All endpoints target the FastAPI backend at /api/v1/...
 * Response shapes match the Pydantic schemas (snake_case + business_id).
 */
import api from "@/lib/api";
import type {
  Employee, EmployeeSummary, Department, DepartmentSummary,
  AttendanceRecord, LeaveRequest,
  JobPosting, Candidate, Application, Interview, Offer,
  PayrollRun, PayrollItem, PayslipDetail,
  PerformanceReview,
  Document, Notification,
  GlobalSearchResponse,
  DashboardStats, AttendanceSummaryItem, RecruitmentFunnelItem,
  HeadcountByDept, LeaveSummaryItem, PayrollSummaryItem,
  Page,
  LoginResponse, Company,
  AIScreeningResult, AIJobPosts,
  Holiday,
  DocumentTypeTemplate, EmployeeDocument,
  OnboardingChecklist, OnboardingChecklistItem,
  ExitChecklist, ExitChecklistItem,
  BankAccount, DocumentVaultSummary,
} from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post("/auth/login", { email, password });
    return data as LoginResponse;
  },
  async refresh(refreshToken: string) {
    const { data } = await api.post("/auth/refresh", { refresh_token: refreshToken });
    return data;
  },
  async forgotPassword(email: string) {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },
  async resetPassword(token: string, newPassword: string) {
    const { data } = await api.post("/auth/reset-password", { token, new_password: newPassword });
    return data;
  },
  async registerCompany(payload: {
    company_name: string; company_email: string;
    admin_full_name: string; admin_email: string; admin_password: string;
    phone?: string; country?: string; timezone?: string;
  }) {
    const { data } = await api.post("/auth/register-company", payload);
    return data;
  },
};

// ─── Company ─────────────────────────────────────────────────────────────────
export const companyService = {
  async getMe(): Promise<Company> {
    const { data } = await api.get("/companies/me");
    return data as Company;
  },
  async updateMe(payload: Partial<Company>): Promise<Company> {
    const { data } = await api.put("/companies/me", payload);
    return data as Company;
  },
  async uploadLogo(file: File): Promise<Company> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/companies/me/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as Company;
  },
};

// ─── Departments ─────────────────────────────────────────────────────────────
export const departmentService = {
  async list(params?: { page?: number; page_size?: number; q?: string }): Promise<Page<DepartmentSummary>> {
    const { data } = await api.get("/departments", { params: { page_size: 100, ...params } });
    // Returns Page<DepartmentSummary>
    return data as Page<DepartmentSummary>;
  },
  async listAll(): Promise<DepartmentSummary[]> {
    const { data } = await api.get("/departments", { params: { page_size: 200 } });
    const page = data as Page<DepartmentSummary>;
    return page.data ?? [];
  },
  async getByBusinessId(businessId: string): Promise<Department> {
    const { data } = await api.get(`/departments/${businessId}`);
    return data as Department;
  },
  async create(payload: {
    name: string; code?: string; description?: string;
    parent_department_id?: string; head_employee_id?: string;
  }): Promise<Department> {
    const { data } = await api.post("/departments", payload);
    return data as Department;
  },
  async update(businessId: string, payload: Partial<{
    name: string; code: string; description: string;
    parent_department_id: string; head_employee_id: string;
  }>): Promise<Department> {
    const { data } = await api.put(`/departments/${businessId}`, payload);
    return data as Department;
  },
  async delete(businessId: string): Promise<void> {
    await api.delete(`/departments/${businessId}`);
  },
};

// ─── Employees ───────────────────────────────────────────────────────────────
export const employeeService = {
  async list(params?: {
    page?: number; page_size?: number; q?: string;
    department_id?: string; employment_status?: string;
    manager_id?: string; work_mode?: string;
    sort_by?: string; sort_order?: string;
  }): Promise<Page<EmployeeSummary>> {
    const { data } = await api.get("/employees", { params });
    return data as Page<EmployeeSummary>;
  },
  async getByBusinessId(businessId: string): Promise<Employee> {
    const { data } = await api.get(`/employees/${businessId}`);
    return data as Employee;
  },
  /** @deprecated use getByBusinessId */
  async getById(id: string): Promise<Employee> {
    return this.getByBusinessId(id);
  },
  async create(payload: {
    full_name: string; work_email: string; phone?: string;
    joining_date?: string; employment_type?: string; work_mode?: string;
    department_id?: string; designation?: string; manager_id?: string;
    location?: string; gender?: string; date_of_birth?: string;
    personal_email?: string; emergency_contact_name?: string;
    emergency_contact_phone?: string; employee_code?: string;
  }): Promise<Employee> {
    const { data } = await api.post("/employees", payload);
    return data as Employee;
  },
  async update(businessId: string, payload: Partial<{
    full_name: string; phone: string; personal_email: string;
    gender: string; date_of_birth: string; joining_date: string;
    employment_type: string; work_mode: string; department_id: string;
    designation: string; manager_id: string; location: string;
    employment_status: string; notes: string; profile_photo_url: string;
    emergency_contact_name: string; emergency_contact_phone: string;
  }>): Promise<Employee> {
    const { data } = await api.put(`/employees/${businessId}`, payload);
    return data as Employee;
  },
  async delete(businessId: string): Promise<void> {
    await api.delete(`/employees/${businessId}`);
  },
  async getSummary(businessId: string) {
    const { data } = await api.get(`/employees/${businessId}/summary`);
    return data;
  },
  async getMe(): Promise<Employee> {
    const { data } = await api.get("/employees/me");
    return data as Employee;
  },
  async uploadPhoto(businessId: string, file: File): Promise<Employee> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(`/employees/${businessId}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as Employee;
  },
  /** Start the exit/resignation workflow for an employee. */
  async startExit(businessId: string, payload: {
    resignation_date?: string;
    last_working_day?: string;
    exit_reason?: string;
    notes?: string;
  }): Promise<Employee> {
    const { data } = await api.post(`/employees/${businessId}/start-exit`, payload);
    return data as Employee;
  },
  /** Confirm a probationary employee as active. */
  async confirmProbation(businessId: string): Promise<Employee> {
    const { data } = await api.post(`/employees/${businessId}/confirm-probation`);
    return data as Employee;
  },
};

// ─── Attendance ──────────────────────────────────────────────────────────────
export const attendanceService = {
  async checkIn(payload?: {
    employee_id?: string; check_in_method?: string;
    check_in_location?: string; remarks?: string;
  }): Promise<AttendanceRecord> {
    const { data } = await api.post("/attendance/check-in", payload ?? {});
    return data as AttendanceRecord;
  },
  async checkOut(payload?: {
    employee_id?: string; check_out_method?: string;
    check_out_location?: string; remarks?: string;
  }): Promise<AttendanceRecord> {
    const { data } = await api.post("/attendance/check-out", payload ?? {});
    return data as AttendanceRecord;
  },
  async manualEntry(payload: {
    employee_id?: string; attendance_date: string;
    check_in_time?: string; check_out_time?: string;
    status: string; remarks?: string;
  }): Promise<AttendanceRecord> {
    const { data } = await api.post("/attendance/manual-entry", payload);
    return data as AttendanceRecord;
  },
  async list(params?: {
    page?: number; page_size?: number; q?: string;
    employee_id?: string; attendance_date?: string; status?: string;
    sort_by?: string; sort_order?: string;
  }): Promise<Page<AttendanceRecord>> {
    const { data } = await api.get("/attendance", { params });
    return data as Page<AttendanceRecord>;
  },
  async getByBusinessId(businessId: string): Promise<AttendanceRecord> {
    const { data } = await api.get(`/attendance/${businessId}`);
    return data as AttendanceRecord;
  },
  async getByEmployee(employeeBusinessId: string, params?: {
    page?: number; page_size?: number;
    start_date?: string; end_date?: string;
  }): Promise<Page<AttendanceRecord>> {
    const { data } = await api.get(`/attendance/employee/${employeeBusinessId}`, { params });
    return data as Page<AttendanceRecord>;
  },
  async approve(businessId: string, remarks?: string): Promise<AttendanceRecord> {
    const { data } = await api.put(`/attendance/${businessId}/approve`, { remarks });
    return data as AttendanceRecord;
  },
  // Legacy aliases
  async clockIn(payload?: Record<string, unknown>) {
    return this.checkIn(payload as Parameters<typeof this.checkIn>[0]);
  },
  async clockOut(payload?: Record<string, unknown>) {
    return this.checkOut(payload as Parameters<typeof this.checkOut>[0]);
  },
  async getMyToday(): Promise<AttendanceRecord | null | "no_profile"> {
    try {
      const { data } = await api.get("/attendance/me/today");
      return data ?? null;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return "no_profile";
      return null;
    }
  },
  async getMyHistory(params?: { page?: number; page_size?: number }): Promise<Page<AttendanceRecord>> {
    const { data } = await api.get("/attendance/me/history", { params });
    return data as Page<AttendanceRecord>;
  },
  async getToday() {
    // Fetch today's attendance for the current user by getting recent records
    const today = new Date().toISOString().split("T")[0];
    const result = await this.list({ attendance_date: today, page_size: 1 });
    return result.data?.[0] ?? null;
  },
  async getTeamDashboard() {
    // Derive team summary from list endpoint
    const today = new Date().toISOString().split("T")[0];
    const result = await this.list({ attendance_date: today, page_size: 200 });
    const records = result.data ?? [];
    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const onLeave = records.filter((r) => r.status === "on_leave").length;
    const absent = records.filter((r) => r.status === "absent").length;
    return { present, late, onLeave, absent, records };
  },
  async getHistory(params?: {
    start_date?: string; end_date?: string; employee_id?: string;
  }): Promise<AttendanceRecord[]> {
    const result = await this.list({ ...params, page_size: 100 });
    return result.data ?? [];
  },
};

// ─── Leave ───────────────────────────────────────────────────────────────────
export const leaveService = {
  async list(params?: {
    page?: number; page_size?: number; q?: string;
    employee_id?: string; status?: string;
  }): Promise<Page<LeaveRequest>> {
    const { data } = await api.get("/leaves", { params });
    return data as Page<LeaveRequest>;
  },
  async getMyLeaves(params?: { page?: number; page_size?: number; status?: string }): Promise<LeaveRequest[]> {
    const { data } = await api.get("/leaves/me", { params: { page_size: 100, ...params } });
    return (data as Page<LeaveRequest>).data ?? [];
  },
  async getByBusinessId(businessId: string): Promise<LeaveRequest> {
    const { data } = await api.get(`/leaves/${businessId}`);
    return data as LeaveRequest;
  },
  async getByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    const result = await this.list({ employee_id: employeeId, page_size: 100 });
    return result.data ?? [];
  },
  async apply(payload: {
    leave_type: string; start_date: string; end_date: string; reason?: string;
  }): Promise<LeaveRequest> {
    const { data } = await api.post("/leaves", payload);
    return data as LeaveRequest;
  },
  async approve(businessId: string, remarks?: string): Promise<LeaveRequest> {
    const { data } = await api.put(`/leaves/${businessId}/approve`, { remarks });
    return data as LeaveRequest;
  },
  async reject(businessId: string, rejectionReason: string): Promise<LeaveRequest> {
    const { data } = await api.put(`/leaves/${businessId}/reject`, { rejection_reason: rejectionReason });
    return data as LeaveRequest;
  },
  // Legacy alias
  async getRequests(params?: { status?: string }) {
    const result = await this.list({ status: params?.status, page_size: 50 });
    return result.data ?? [];
  },
};

// ─── Jobs ────────────────────────────────────────────────────────────────────
export const jobService = {
  async list(params?: {
    page?: number; page_size?: number; q?: string;
    status?: string; department_id?: string;
  }): Promise<Page<JobPosting>> {
    const { data } = await api.get("/jobs", { params });
    return data as Page<JobPosting>;
  },
  async getByBusinessId(businessId: string): Promise<JobPosting> {
    const { data } = await api.get(`/jobs/${businessId}`);
    return data as JobPosting;
  },
  async create(payload: {
    title: string; department_id?: string; description?: string;
    employment_type?: string; openings?: number; location?: string;
    requirements?: string; closing_date?: string;
  }): Promise<JobPosting> {
    const { data } = await api.post("/jobs", payload);
    return data as JobPosting;
  },
  async update(businessId: string, payload: Partial<JobPosting>): Promise<JobPosting> {
    const { data } = await api.put(`/jobs/${businessId}`, payload);
    return data as JobPosting;
  },
  async updateStatus(businessId: string, status: string): Promise<JobPosting> {
    const { data } = await api.patch(`/jobs/${businessId}/status`, { status });
    return data as JobPosting;
  },
};

// ─── Candidates ──────────────────────────────────────────────────────────────
export const candidateService = {
  async list(params?: {
    page?: number; page_size?: number; q?: string; status?: string;
  }): Promise<Page<Candidate>> {
    const { data } = await api.get("/candidates", { params });
    return data as Page<Candidate>;
  },
  async getByBusinessId(businessId: string): Promise<Candidate> {
    const { data } = await api.get(`/candidates/${businessId}`);
    return data as Candidate;
  },
  async create(payload: {
    full_name: string; email: string; phone?: string;
    current_role?: string; years_of_experience?: number;
    source?: string; resume_url?: string;
  }): Promise<Candidate> {
    const { data } = await api.post("/candidates", payload);
    return data as Candidate;
  },
  async update(businessId: string, payload: Partial<Candidate>): Promise<Candidate> {
    const { data } = await api.put(`/candidates/${businessId}`, payload);
    return data as Candidate;
  },
  async uploadResume(businessId: string, file: File): Promise<Candidate> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(`/candidates/${businessId}/resume`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as Candidate;
  },
};

// ─── Applications ─────────────────────────────────────────────────────────────
export const applicationService = {
  async list(params?: {
    page?: number; page_size?: number; q?: string;
    stage?: string; job_posting_id?: string; candidate_id?: string;
  }): Promise<Page<Application>> {
    const { data } = await api.get("/applications", { params });
    return data as Page<Application>;
  },
  async getByBusinessId(businessId: string): Promise<Application> {
    const { data } = await api.get(`/applications/${businessId}`);
    return data as Application;
  },
  async create(payload: {
    candidate_id: string; job_posting_id: string; notes?: string;
  }): Promise<Application> {
    const { data } = await api.post("/applications", payload);
    return data as Application;
  },
  async updateStage(businessId: string, stage: string): Promise<Application> {
    const { data } = await api.put(`/applications/${businessId}/stage`, { stage });
    return data as Application;
  },
  async updateStatus(businessId: string, status: string): Promise<Application> {
    const { data } = await api.put(`/applications/${businessId}/status`, { status });
    return data as Application;
  },
};

// ─── Interviews ──────────────────────────────────────────────────────────────
export const interviewService = {
  async list(params?: {
    page?: number; page_size?: number; q?: string;
    application_id?: string; candidate_id?: string; status?: string;
  }): Promise<Page<Interview>> {
    const { data } = await api.get("/interviews", { params });
    return data as Page<Interview>;
  },
  async getByBusinessId(businessId: string): Promise<Interview> {
    const { data } = await api.get(`/interviews/${businessId}`);
    return data as Interview;
  },
  async create(payload: {
    application_id: string; round_name?: string; interview_type?: string;
    scheduled_at?: string; duration_minutes?: number; interviewer_ids?: string[];
  }): Promise<Interview> {
    const { data } = await api.post("/interviews", payload);
    return data as Interview;
  },
  async update(businessId: string, payload: Partial<Interview>): Promise<Interview> {
    const { data } = await api.put(`/interviews/${businessId}`, payload);
    return data as Interview;
  },
};

// ─── Offers ──────────────────────────────────────────────────────────────────
export const offerService = {
  async list(params?: {
    page?: number; page_size?: number; q?: string; offer_status?: string;
  }): Promise<Page<Offer>> {
    const { data } = await api.get("/offers", { params });
    return data as Page<Offer>;
  },
  async getByBusinessId(businessId: string): Promise<Offer> {
    const { data } = await api.get(`/offers/${businessId}`);
    return data as Offer;
  },
  async create(payload: Partial<Offer>): Promise<Offer> {
    const { data } = await api.post("/offers", payload);
    return data as Offer;
  },
  async updateStatus(businessId: string, status: string): Promise<Offer> {
    const { data } = await api.put(`/offers/${businessId}/status`, { status });
    return data as Offer;
  },
};

// ─── Payroll ─────────────────────────────────────────────────────────────────
export const payrollService = {
  async listRuns(params?: {
    page?: number; page_size?: number; status?: string;
  }): Promise<Page<PayrollRun>> {
    const { data } = await api.get("/payroll/runs", { params });
    return data as Page<PayrollRun>;
  },
  async getRunByBusinessId(businessId: string): Promise<PayrollRun> {
    const { data } = await api.get(`/payroll/runs/${businessId}`);
    return data as PayrollRun;
  },
  async createRun(payload: { period_month: number; period_year: number }): Promise<PayrollRun> {
    const { data } = await api.post("/payroll/runs", payload);
    return data as PayrollRun;
  },
  async processRun(businessId: string): Promise<PayrollRun> {
    const { data } = await api.post(`/payroll/runs/${businessId}/process`);
    return data as PayrollRun;
  },
  async approveRun(businessId: string): Promise<PayrollRun> {
    const { data } = await api.post(`/payroll/runs/${businessId}/approve`);
    return data as PayrollRun;
  },
  async getItems(runBusinessId: string, params?: { page?: number; page_size?: number }): Promise<Page<PayrollItem>> {
    const { data } = await api.get(`/payroll/runs/${runBusinessId}/items`, { params });
    return data as Page<PayrollItem>;
  },
  async getItemByBusinessId(businessId: string): Promise<PayrollItem> {
    const { data } = await api.get(`/payroll/items/${businessId}`);
    return data as PayrollItem;
  },
  async getItemDetail(itemBusinessId: string): Promise<PayslipDetail> {
    const { data } = await api.get(`/payroll/items/${itemBusinessId}`);
    return data as PayslipDetail;
  },
  async getMyPayslips(): Promise<Array<{
    business_id: string; period_month: number; period_year: number;
    run_status: string; gross_salary: number; allowances: number;
    deductions: number; tax_amount: number; net_salary: number;
    currency: string; payment_status: string; payment_date: string | null;
  }>> {
    const { data } = await api.get("/payroll/me/payslips");
    return data as Array<{
      business_id: string; period_month: number; period_year: number;
      run_status: string; gross_salary: number; allowances: number;
      deductions: number; tax_amount: number; net_salary: number;
      currency: string; payment_status: string; payment_date: string | null;
    }>;
  },
};

// ─── Performance ─────────────────────────────────────────────────────────────
// Backend performance routes are at /performance (not /performance/reviews)
export const performanceService = {
  async listReviews(params?: {
    page?: number; page_size?: number; employee_id?: string;
    status?: string; review_period?: string;
  }): Promise<Page<PerformanceReview>> {
    const { data } = await api.get("/performance", { params });
    return data as Page<PerformanceReview>;
  },
  async getReviewByBusinessId(businessId: string): Promise<PerformanceReview> {
    const { data } = await api.get(`/performance/${businessId}`);
    return data as PerformanceReview;
  },
  async createReview(payload: {
    employee_id: string;
    reviewer_id?: string;
    review_period?: string;
    review_year?: number;
    goal_score?: number;
    behavior_score?: number;
    comments?: string;
    employee_self_review?: string;
  }): Promise<PerformanceReview> {
    const { data } = await api.post("/performance", payload);
    return data as PerformanceReview;
  },
  async updateReview(businessId: string, payload: {
    goal_score?: number;
    behavior_score?: number;
    comments?: string;
    employee_self_review?: string;
    status?: string;
  }): Promise<PerformanceReview> {
    const { data } = await api.put(`/performance/${businessId}`, payload);
    return data as PerformanceReview;
  },
  async deleteReview(businessId: string): Promise<void> {
    await api.delete(`/performance/${businessId}`);
  },
  // Legacy aliases — goals/cycles are not yet in backend; return empty safely
  async getGoals(_params?: Record<string, unknown>) {
    return [];
  },
  async createGoal(_goal: Record<string, unknown>) {
    return null;
  },
  async updateGoal(_id: string, _goal: Record<string, unknown>) {
    return null;
  },
  async getCycles() {
    return [];
  },
  async getSkills() {
    return [];
  },
  // Convenience wrappers
  async getReviews(params?: { employee_id?: string; status?: string; review_period?: string }) {
    const result = await this.listReviews({ ...params, page_size: 100 });
    return result.data ?? [];
  },
  async getReviewCycles() {
    return [];
  },
};

// ─── Documents ───────────────────────────────────────────────────────────────
export const documentService = {
  async list(params?: {
    page?: number; page_size?: number;
    employee_id?: string; document_type?: string;
  }): Promise<Page<Document>> {
    const { data } = await api.get("/documents", { params });
    return data as Page<Document>;
  },
  async getByBusinessId(businessId: string): Promise<Document> {
    const { data } = await api.get(`/documents/${businessId}`);
    return data as Document;
  },
  async upload(formData: FormData): Promise<Document> {
    const { data } = await api.post("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as Document;
  },
  async delete(businessId: string): Promise<void> {
    await api.delete(`/documents/${businessId}`);
  },
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationService = {
  async list(params?: {
    page?: number; page_size?: number; is_read?: boolean;
  }): Promise<Notification[]> {
    const queryParams = {
      page: params?.page,
      page_size: params?.page_size,
      unread_only: params?.is_read === false ? true : undefined,
    };
    const { data } = await api.get("/notifications", { params: queryParams });
    const page = data as { data?: Notification[] };
    return page.data ?? (data as Notification[]) ?? [];
  },
  async listPaged(params?: { page?: number; page_size?: number; is_read?: boolean }) {
    const queryParams = {
      page: params?.page,
      page_size: params?.page_size,
      unread_only: params?.is_read === false ? true : undefined,
    };
    const { data } = await api.get("/notifications", { params: queryParams });
    return data as { data: Notification[]; meta: { total: number } };
  },
  async markRead(businessId: string): Promise<void> {
    await api.put(`/notifications/${businessId}/read`);
  },
  async markAllRead(): Promise<void> {
    await api.put("/notifications/read-all");
  },
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsService = {
  async getDashboard(): Promise<DashboardStats> {
    const { data } = await api.get("/analytics/dashboard");
    return data as DashboardStats;
  },
  async getAttendanceSummary(days = 30): Promise<AttendanceSummaryItem[]> {
    const { data } = await api.get("/analytics/attendance", { params: { days } });
    const r = data as { data?: AttendanceSummaryItem[] };
    return r.data ?? (data as AttendanceSummaryItem[]) ?? [];
  },
  async getRecruitmentFunnel(): Promise<{ stages: RecruitmentFunnelItem[]; total_applications: number }> {
    const { data } = await api.get("/analytics/recruitment-funnel");
    return data;
  },
  async getHeadcount(): Promise<HeadcountByDept[]> {
    const { data } = await api.get("/analytics/headcount");
    const r = data as { data?: HeadcountByDept[] };
    return r.data ?? (data as HeadcountByDept[]) ?? [];
  },
  async getLeaveSummary(): Promise<LeaveSummaryItem[]> {
    const { data } = await api.get("/analytics/leave-summary");
    const r = data as { data?: LeaveSummaryItem[] };
    return r.data ?? (data as LeaveSummaryItem[]) ?? [];
  },
  async getPayrollSummary(): Promise<PayrollSummaryItem[]> {
    const { data } = await api.get("/analytics/payroll-summary");
    const r = data as { data?: PayrollSummaryItem[] };
    return r.data ?? (data as PayrollSummaryItem[]) ?? [];
  },
  // Legacy aliases used by existing pages
  async getExecutiveDashboard(_params?: Record<string, unknown>) {
    return this.getDashboard();
  },
  async getWorkforceAnalytics(_params?: Record<string, unknown>) {
    return this.getHeadcount();
  },
  async getRecruitmentAnalytics(_params?: Record<string, unknown>) {
    return this.getRecruitmentFunnel();
  },
  async getAttendanceAnalytics(_params?: Record<string, unknown>) {
    const items = await this.getAttendanceSummary();
    if (!items.length) return {};
    const last = items[items.length - 1];
    return {
      avgAttendance: last.attendance_percentage,
      latePercentage: last.total_employees ? (last.late / last.total_employees) * 100 : 0,
    };
  },
};

// ─── Global Search ───────────────────────────────────────────────────────────
export const searchService = {
  async global(q: string): Promise<GlobalSearchResponse> {
    const { data } = await api.get("/search/global", { params: { q } });
    return data as GlobalSearchResponse;
  },
};

// ─── Legacy combined service exports (kept for compatibility) ─────────────────
export const recruitmentService = {
  async getJobs(params?: Record<string, unknown>) {
    const result = await jobService.list(params as Parameters<typeof jobService.list>[0]);
    return result.data ?? [];
  },
  async getJobById(id: string) { return jobService.getByBusinessId(id); },
  async createJob(payload: Parameters<typeof jobService.create>[0]) { return jobService.create(payload); },
  async updateJob(id: string, payload: Partial<JobPosting>) { return jobService.update(id, payload); },
  async getCandidates(params?: Record<string, unknown>) {
    const result = await candidateService.list(params as Parameters<typeof candidateService.list>[0]);
    return result.data ?? [];
  },
  async getCandidateById(id: string) { return candidateService.getByBusinessId(id); },
  async createCandidate(payload: Parameters<typeof candidateService.create>[0]) { return candidateService.create(payload); },
  async updateCandidate(id: string, payload: Partial<Candidate>) { return candidateService.update(id, payload); },
  async getInterviews(params?: Record<string, unknown>) {
    const result = await interviewService.list(params as Parameters<typeof interviewService.list>[0]);
    return result.data ?? [];
  },
  async scheduleInterview(payload: Parameters<typeof interviewService.create>[0]) { return interviewService.create(payload); },
};

export const settingsService = {
  async getCompanyProfile() { return companyService.getMe(); },
  async updateCompany(payload: Partial<Company>) { return companyService.updateMe(payload); },
  async updateCompanyProfile(payload: Partial<Company>) { return companyService.updateMe(payload); },
  async updateProfile(payload: { firstName?: string; lastName?: string; full_name?: string }) {
    const fullName = payload.full_name ?? [payload.firstName, payload.lastName].filter(Boolean).join(" ");
    const { data } = await api.put("/users/me", { full_name: fullName });
    return data;
  },
  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const { data } = await api.post("/auth/change-password", {
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
    });
    return data;
  },
  async enableMFA() {
    const { data } = await api.post("/auth/mfa/enable");
    return data;
  },
};

// ─── User Management ─────────────────────────────────────────────────────────
export const userService = {
  async list(params?: { page?: number; page_size?: number; q?: string }) {
    const { data } = await api.get("/users", { params });
    return data;
  },
  async getByBusinessId(businessId: string) {
    const { data } = await api.get(`/users/${businessId}`);
    return data;
  },
  async create(payload: { email: string; full_name: string; role?: string; password?: string; phone?: string }) {
    const { data } = await api.post("/users", payload);
    return data;
  },
  async update(businessId: string, payload: { full_name?: string; role?: string; phone?: string }) {
    const { data } = await api.put(`/users/${businessId}`, payload);
    return data;
  },
  async updateStatus(businessId: string, status: string) {
    const { data } = await api.patch(`/users/${businessId}/status`, { status });
    return data;
  },
  async adminResetPassword(businessId: string, newPassword: string) {
    const { data } = await api.post(`/users/${businessId}/reset-password`, { new_password: newPassword });
    return data;
  },
  async invite(payload: { email: string; full_name: string; role?: string }) {
    const { data } = await api.post("/auth/invite-user", payload);
    return data;
  },
};

// ─── AI Recruitment ──────────────────────────────────────────────────────────
export const aiRecruitmentService = {
  async screenCandidate(jobDescription: string, resumeText: string): Promise<AIScreeningResult> {
    const { data } = await api.post("/recruitment-ai/screen", {
      job_description: jobDescription,
      resume_text: resumeText,
    });
    return data as AIScreeningResult;
  },
  async screenCandidateFile(jobDescription: string, resumeFile: File): Promise<AIScreeningResult> {
    const formData = new FormData();
    formData.append("job_description", jobDescription);
    formData.append("resume", resumeFile);
    const { data } = await api.post("/recruitment-ai/screen-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as AIScreeningResult;
  },
  async screenApplication(applicationBusinessId: string): Promise<AIScreeningResult> {
    const { data } = await api.post(`/recruitment-ai/screen-application/${applicationBusinessId}`);
    return data as AIScreeningResult;
  },
  async generateJobPosts(jobDescription: string): Promise<AIJobPosts> {
    const { data } = await api.post("/recruitment-ai/generate-job-posts", {
      job_description: jobDescription,
    });
    return data as AIJobPosts;
  },
  async generateJobPostsFile(jdFile: File): Promise<AIJobPosts> {
    const formData = new FormData();
    formData.append("jd_file", jdFile);
    const { data } = await api.post("/recruitment-ai/generate-job-posts-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as AIJobPosts;
  },
};

// ─── Holidays ────────────────────────────────────────────────────────────────
export const holidayService = {
  async list(params?: {
    page?: number; page_size?: number; year?: number;
    country?: string; state?: string;
  }): Promise<Page<Holiday>> {
    const { data } = await api.get("/holidays", { params });
    return data as Page<Holiday>;
  },
  async getByBusinessId(businessId: string): Promise<Holiday> {
    const { data } = await api.get(`/holidays/${businessId}`);
    return data as Holiday;
  },
  async create(payload: {
    name: string; date: string; holiday_type?: string;
    country?: string; state?: string; description?: string; is_paid?: boolean;
  }): Promise<Holiday> {
    const { data } = await api.post("/holidays", payload);
    return data as Holiday;
  },
  async update(businessId: string, payload: Partial<Holiday>): Promise<Holiday> {
    const { data } = await api.put(`/holidays/${businessId}`, payload);
    return data as Holiday;
  },
  async delete(businessId: string): Promise<void> {
    await api.delete(`/holidays/${businessId}`);
  },
};

// ─── Organization Settings ───────────────────────────────────────────────────
export const organizationService = {
  async getSettings() {
    const { data } = await api.get("/organization/settings");
    return data;
  },
  async updateSettings(payload: Record<string, unknown>) {
    const { data } = await api.put("/organization/settings", payload);
    return data;
  },
  // Branches
  async listBranches(params?: { page?: number; page_size?: number }) {
    const { data } = await api.get("/branches", { params });
    return data;
  },
  async createBranch(payload: {
    name: string; code?: string; branch_type?: string;
    address?: string; city?: string; state?: string; country?: string;
    timezone?: string; phone?: string; email?: string;
  }) {
    const { data } = await api.post("/branches", payload);
    return data;
  },
  async updateBranch(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/branches/${id}`, payload);
    return data;
  },
  async deleteBranch(id: string) {
    await api.delete(`/branches/${id}`);
  },
  // Designations
  async listDesignations(params?: { page?: number; page_size?: number }) {
    const { data } = await api.get("/designations", { params });
    return data;
  },
  async createDesignation(payload: { name: string; code?: string; level?: number; description?: string }) {
    const { data } = await api.post("/designations", payload);
    return data;
  },
  async updateDesignation(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/designations/${id}`, payload);
    return data;
  },
  async deleteDesignation(id: string) {
    await api.delete(`/designations/${id}`);
  },
  // Shifts
  async listShifts(params?: { page?: number; page_size?: number }) {
    const { data } = await api.get("/shifts", { params });
    return data;
  },
  async createShift(payload: {
    name: string; code?: string; start_time: string; end_time: string;
    break_duration_minutes?: number; is_night_shift?: boolean;
  }) {
    const { data } = await api.post("/shifts", payload);
    return data;
  },
  async updateShift(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/shifts/${id}`, payload);
    return data;
  },
  async deleteShift(id: string) {
    await api.delete(`/shifts/${id}`);
  },
};

// ─── Policies ────────────────────────────────────────────────────────────────
export const policyService = {
  // Leave policies
  async listLeavePolicies(params?: { page?: number; page_size?: number }) {
    const { data } = await api.get("/leave-policies", { params });
    return data;
  },
  async createLeavePolicy(payload: { name: string; description?: string; is_default?: boolean }) {
    const { data } = await api.post("/leave-policies", payload);
    return data;
  },
  async updateLeavePolicy(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/leave-policies/${id}`, payload);
    return data;
  },
  // Leave types
  async listLeaveTypes(params?: { policy_id?: string; page?: number; page_size?: number }) {
    const { data } = await api.get("/leave-types", { params });
    return data;
  },
  async createLeaveType(payload: {
    leave_policy_id: string; name: string; code: string;
    annual_quota: number; is_paid?: boolean; is_carry_forward?: boolean;
    max_carry_forward?: number; requires_attachment?: boolean;
    applicable_gender?: string; color?: string;
  }) {
    const { data } = await api.post("/leave-types", payload);
    return data;
  },
  async updateLeaveType(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/leave-types/${id}`, payload);
    return data;
  },
  // Leave balances
  async getEmployeeLeaveBalances(employeeId: string) {
    const { data } = await api.get(`/leave-balances/${employeeId}`);
    return data;
  },
  async allocateLeaveBalance(employeeId: string, payload: { year?: number }) {
    const { data } = await api.post(`/leave-balances/${employeeId}`, payload);
    return data;
  },
  // Attendance policy
  async getAttendancePolicy() {
    const { data } = await api.get("/attendance-policy");
    return data;
  },
  async updateAttendancePolicy(payload: Record<string, unknown>) {
    const { data } = await api.put("/attendance-policy", payload);
    return data;
  },
  // Country configs
  async listCountryConfigs() {
    const { data } = await api.get("/country-configs");
    return data;
  },
};

// ─── Salary & Payroll Engine ─────────────────────────────────────────────────
export const salaryService = {
  // Salary structures
  async listStructures(params?: { page?: number; page_size?: number }) {
    const { data } = await api.get("/salary-structures", { params });
    return data;
  },
  async createStructure(payload: {
    name: string; code?: string; description?: string;
    currency?: string; is_default?: boolean; payroll_cycle?: string;
  }) {
    const { data } = await api.post("/salary-structures", payload);
    return data;
  },
  async updateStructure(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/salary-structures/${id}`, payload);
    return data;
  },
  async deleteStructure(id: string) {
    await api.delete(`/salary-structures/${id}`);
  },
  // Salary components
  async createComponent(payload: {
    salary_structure_id: string; name: string; code: string;
    component_type: string; calculation_type: string;
    amount?: number; percentage?: number; formula?: string;
    is_taxable?: boolean; is_mandatory?: boolean; priority?: number;
    max_amount?: number; min_amount?: number;
  }) {
    const { data } = await api.post("/salary-components", payload);
    return data;
  },
  async updateComponent(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/salary-components/${id}`, payload);
    return data;
  },
  async deleteComponent(id: string) {
    await api.delete(`/salary-components/${id}`);
  },
  // Employee salary
  async upsertEmployeeSalary(payload: {
    employee_id: string; salary_structure_id: string;
    ctc: number; basic_salary?: number; gross_salary?: number;
    net_salary?: number; component_overrides?: Record<string, number>;
    effective_from?: string;
  }) {
    const { data } = await api.post("/employee-salary", payload);
    return data;
  },
  async getEmployeeSalary(employeeId: string) {
    const { data } = await api.get(`/employee-salary/${employeeId}`);
    return data;
  },
  async getEmployeeSalaryBreakdown(employeeId: string) {
    const { data } = await api.get(`/employee-salary/${employeeId}/breakdown`);
    return data;
  },
};

// ─── Employee Import ──────────────────────────────────────────────────────────
export const employeeImportService = {
  async downloadTemplate(): Promise<Blob> {
    const { data } = await api.get("/employees/import/template", { responseType: "blob" });
    return data as Blob;
  },
  async validate(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/employees/import/validate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  async bulkImport(file: File, skipErrors = false) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(`/employees/import?skip_errors=${skipErrors}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

// ─── LOP (Loss of Pay) ───────────────────────────────────────────────────────
export const lopService = {
  // Policy
  async getPolicy() {
    const { data } = await api.get("/lop/policy");
    return data;
  },
  async updatePolicy(payload: Record<string, unknown>) {
    const { data } = await api.put("/lop/policy", payload);
    return data;
  },
  // Records
  async listRecords(params?: { year?: number; month?: number; employee_id?: string; status?: string; page?: number; page_size?: number }) {
    const { data } = await api.get("/lop/records", { params });
    return data;
  },
  async calculateForEmployee(employee_business_id: string, year: number, month: number, recalculate = false) {
    const { data } = await api.post("/lop/records/calculate", null, {
      params: { employee_business_id, year, month, recalculate },
    });
    return data;
  },
  async bulkCalculate(year: number, month: number, recalculate = false) {
    const { data } = await api.post("/lop/records/bulk-calculate", null, {
      params: { year, month, recalculate },
    });
    return data;
  },
  async getRecord(businessId: string) {
    const { data } = await api.get(`/lop/records/${businessId}`);
    return data;
  },
  async approveRecord(businessId: string) {
    const { data } = await api.post(`/lop/records/${businessId}/approve`);
    return data;
  },
  // Overrides
  async listOverrides(params?: { employee_id?: string; year?: number; month?: number; page?: number; page_size?: number }) {
    const { data } = await api.get("/lop/overrides", { params });
    return data;
  },
  async createOverride(payload: {
    employee_id: string; year: number; month: number;
    original_lop_days: number; adjusted_lop_days: number; reason: string;
  }) {
    const { data } = await api.post("/lop/overrides", payload);
    return data;
  },
  async approveOverride(businessId: string) {
    const { data } = await api.post(`/lop/overrides/${businessId}/approve`);
    return data;
  },
};

// ─── Document Vault ──────────────────────────────────────────────────────────
export const documentVaultService = {
  // Templates
  async seedTemplates(): Promise<{ seeded: number; message: string }> {
    const { data } = await api.post("/vault/templates/seed");
    return data;
  },
  async listTemplates(params?: { country_code?: string; category?: string }): Promise<DocumentTypeTemplate[]> {
    const { data } = await api.get("/vault/templates", { params });
    return data as DocumentTypeTemplate[];
  },

  // Employee Documents
  async uploadDocument(formData: FormData): Promise<EmployeeDocument> {
    const { data } = await api.post("/vault/employee-documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as EmployeeDocument;
  },
  async listDocuments(params: {
    employee_id: string;
    page?: number;
    page_size?: number;
    category?: string;
    status?: string;
  }): Promise<Page<EmployeeDocument>> {
    const { data } = await api.get("/vault/employee-documents", { params });
    return data as Page<EmployeeDocument>;
  },
  async getDocument(businessId: string): Promise<EmployeeDocument> {
    const { data } = await api.get(`/vault/employee-documents/${businessId}`);
    return data as EmployeeDocument;
  },
  async reviewDocument(
    businessId: string,
    action: "approve" | "reject" | "request_resubmission",
    notes?: string,
    rejectionReason?: string,
  ): Promise<EmployeeDocument> {
    const { data } = await api.post(`/vault/employee-documents/${businessId}/review`, {
      action,
      notes,
      rejection_reason: rejectionReason,
    });
    return data as EmployeeDocument;
  },
  async deleteDocument(businessId: string): Promise<void> {
    await api.delete(`/vault/employee-documents/${businessId}`);
  },

  // Onboarding Checklists
  async getOnboardingChecklist(employeeId: string): Promise<OnboardingChecklist> {
    const { data } = await api.get(`/vault/onboarding/${employeeId}`);
    return data as OnboardingChecklist;
  },
  async updateOnboardingItem(
    checklistId: string,
    itemId: string,
    status: string,
    notes?: string,
  ): Promise<OnboardingChecklist> {
    const { data } = await api.patch(`/vault/onboarding/${checklistId}/items/${itemId}`, { status, notes });
    return data as OnboardingChecklist;
  },

  // Exit Checklists
  async createExitChecklist(payload: {
    employee_id: string;
    last_working_day?: string;
    resignation_date?: string;
    notes?: string;
  }): Promise<ExitChecklist> {
    const { data } = await api.post("/vault/exit-checklists", payload);
    return data as ExitChecklist;
  },
  async getExitChecklist(employeeId: string): Promise<ExitChecklist | null> {
    try {
      const { data } = await api.get(`/vault/exit-checklists/${employeeId}`);
      return data as ExitChecklist;
    } catch {
      return null;
    }
  },
  async updateExitChecklist(
    businessId: string,
    payload: Partial<ExitChecklist>,
  ): Promise<ExitChecklist> {
    const { data } = await api.patch(`/vault/exit-checklists/${businessId}`, payload);
    return data as ExitChecklist;
  },

  // Bank Accounts
  async listBankAccounts(employeeId: string): Promise<BankAccount[]> {
    const { data } = await api.get("/vault/bank-accounts", { params: { employee_id: employeeId } });
    return data as BankAccount[];
  },
  async createBankAccount(payload: {
    employee_id: string;
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    account_type: string;
    ifsc_code?: string;
    branch_name?: string;
    swift_code?: string;
    routing_number?: string;
    iban?: string;
    currency?: string;
    country_code?: string;
    is_primary?: boolean;
    upi_id?: string;
  }): Promise<BankAccount> {
    const { data } = await api.post("/vault/bank-accounts", payload);
    return data as BankAccount;
  },
  async updateBankAccount(businessId: string, payload: Partial<BankAccount>): Promise<BankAccount> {
    const { data } = await api.patch(`/vault/bank-accounts/${businessId}`, payload);
    return data as BankAccount;
  },
  async verifyBankAccount(businessId: string): Promise<BankAccount> {
    const { data } = await api.post(`/vault/bank-accounts/${businessId}/verify`);
    return data as BankAccount;
  },
  async deleteBankAccount(businessId: string): Promise<void> {
    await api.delete(`/vault/bank-accounts/${businessId}`);
  },

  // Vault Summary (Admin)
  async getVaultSummary(params?: { page?: number; page_size?: number }): Promise<Page<DocumentVaultSummary>> {
    const { data } = await api.get("/vault/summary", { params });
    return data as Page<DocumentVaultSummary>;
  },
};
