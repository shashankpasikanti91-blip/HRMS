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
  PayrollRun, PayrollItem,
  PerformanceReview,
  Document, Notification,
  GlobalSearchResponse,
  DashboardStats, AttendanceSummaryItem, RecruitmentFunnelItem,
  HeadcountByDept, LeaveSummaryItem, PayrollSummaryItem,
  Page,
  LoginResponse, Company,
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
    employee_id: string; attendance_date: string;
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
  async getItems(runBusinessId: string, params?: { page?: number; page_size?: number }): Promise<Page<PayrollItem>> {
    const { data } = await api.get("/payroll/items", { params: { payroll_run_id: runBusinessId, ...params } });
    return data as Page<PayrollItem>;
  },
  async getItemByBusinessId(businessId: string): Promise<PayrollItem> {
    const { data } = await api.get(`/payroll/items/${businessId}`);
    return data as PayrollItem;
  },
};

// ─── Performance ─────────────────────────────────────────────────────────────
export const performanceService = {
  async listReviews(params?: {
    page?: number; page_size?: number; employee_id?: string; cycle_id?: string;
  }): Promise<Page<PerformanceReview>> {
    const { data } = await api.get("/performance/reviews", { params });
    return data as Page<PerformanceReview>;
  },
  async getReviewByBusinessId(businessId: string): Promise<PerformanceReview> {
    const { data } = await api.get(`/performance/reviews/${businessId}`);
    return data as PerformanceReview;
  },
  async createReview(payload: Partial<PerformanceReview>): Promise<PerformanceReview> {
    const { data } = await api.post("/performance/reviews", payload);
    return data as PerformanceReview;
  },
  // Legacy aliases used by existing pages
  async getGoals(params?: Record<string, unknown>) {
    const { data } = await api.get("/performance/goals", { params });
    return data?.data ?? data ?? [];
  },
  async createGoal(goal: Record<string, unknown>) {
    const { data } = await api.post("/performance/goals", goal);
    return data;
  },
  async updateGoal(id: string, goal: Record<string, unknown>) {
    const { data } = await api.put(`/performance/goals/${id}`, goal);
    return data;
  },
  async getCycles() {
    const { data } = await api.get("/performance/cycles");
    return data?.data ?? data ?? [];
  },
  async getSkills() {
    const { data } = await api.get("/performance/skills");
    return data?.data ?? data ?? [];
  },
  // Legacy aliases
  async getReviews(params?: Record<string, unknown>) {
    const result = await this.listReviews(params as Parameters<typeof this.listReviews>[0]);
    return result.data ?? [];
  },
  async getReviewCycles() {
    return this.getCycles();
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
    const { data } = await api.get("/notifications", { params });
    const page = data as { data?: Notification[] };
    return page.data ?? (data as Notification[]) ?? [];
  },
  async listPaged(params?: { page?: number; page_size?: number; is_read?: boolean }) {
    const { data } = await api.get("/notifications", { params });
    return data as { data: Notification[]; meta: { total: number } };
  },
  async markRead(businessId: string): Promise<void> {
    await api.patch(`/notifications/${businessId}/read`);
  },
  async markAllRead(): Promise<void> {
    await api.patch("/notifications/read-all");
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

