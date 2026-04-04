import api from "@/lib/api";
import type {
  Employee, Department, PaginatedResponse, PayrollRun, Payslip,
  JobPosting, Candidate, Goal, PerformanceReview, LeaveRequest,
  LeaveType, AttendanceRecord, Notification,
} from "@/types";

// ─── Employees ──────────────────────────────────────────────
export const employeeService = {
  async list(params?: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const { data } = await api.get("/core-hr/employees", { params });
    return data.data as PaginatedResponse<Employee>;
  },
  async getById(id: string) {
    const { data } = await api.get(`/core-hr/employees/${id}`);
    return data.data as Employee;
  },
  async create(employee: Partial<Employee>) {
    const { data } = await api.post("/core-hr/employees", employee);
    return data.data as Employee;
  },
  async update(id: string, employee: Partial<Employee>) {
    const { data } = await api.put(`/core-hr/employees/${id}`, employee);
    return data.data as Employee;
  },
  async delete(id: string) {
    await api.delete(`/core-hr/employees/${id}`);
  },
  async exportCsv() {
    const { data } = await api.get("/core-hr/employees/export", { responseType: "blob" });
    return data;
  },
};

// ─── Departments ────────────────────────────────────────────
export const departmentService = {
  async list() {
    const { data } = await api.get("/core-hr/departments");
    return data.data as Department[];
  },
  async getById(id: string) {
    const { data } = await api.get(`/core-hr/departments/${id}`);
    return data.data as Department;
  },
  async create(department: Partial<Department>) {
    const { data } = await api.post("/core-hr/departments", department);
    return data.data as Department;
  },
  async update(id: string, department: Partial<Department>) {
    const { data } = await api.put(`/core-hr/departments/${id}`, department);
    return data.data as Department;
  },
  async delete(id: string) {
    await api.delete(`/core-hr/departments/${id}`);
  },
};

// ─── Attendance ─────────────────────────────────────────────
export const attendanceService = {
  async clockIn(payload?: { source?: string; clockInLocation?: { lat: number; lng: number } }) {
    const { data } = await api.post("/attendance/clock-in", payload);
    return data.data;
  },
  async clockOut(payload?: { clockOutLocation?: { lat: number; lng: number } }) {
    const { data } = await api.post("/attendance/clock-out", payload);
    return data.data;
  },
  async getToday() {
    const { data } = await api.get("/attendance/today");
    return data.data;
  },
  async getHistory(params?: { startDate?: string; endDate?: string; employeeId?: string }) {
    const { data } = await api.get("/attendance/history", { params });
    return data.data as AttendanceRecord[];
  },
  async getTeamDashboard(params?: { date?: string; departmentId?: string }) {
    const { data } = await api.get("/attendance/team-dashboard", { params });
    return data.data;
  },
  async getMonthlySummary(params: { month: number; year: number; employeeId?: string }) {
    const { data } = await api.get("/attendance/monthly-summary", { params });
    return data.data;
  },
  async requestCorrection(payload: { date: string; reason: string; clockIn?: string; clockOut?: string }) {
    const { data } = await api.post("/attendance/corrections", payload);
    return data.data;
  },
  async approveCorrection(id: string) {
    const { data } = await api.put(`/attendance/corrections/${id}/approve`);
    return data.data;
  },
};

// ─── Leave ─────────────────────────────────────────────────
export const leaveService = {
  async getTypes() {
    const { data } = await api.get("/attendance/leave-types");
    return data.data as LeaveType[];
  },
  async getBalance() {
    const { data } = await api.get("/attendance/leave-balance");
    return data.data;
  },
  async getRequests(params?: { status?: string }) {
    const { data } = await api.get("/attendance/leaves", { params });
    return data.data as LeaveRequest[];
  },
  async apply(payload: { leaveTypeId: string; startDate: string; endDate: string; reason: string }) {
    const { data } = await api.post("/attendance/leaves", payload);
    return data.data as LeaveRequest;
  },
  async approve(id: string) {
    const { data } = await api.put(`/attendance/leaves/${id}/approve`);
    return data.data;
  },
  async reject(id: string, reason?: string) {
    const { data } = await api.put(`/attendance/leaves/${id}/reject`, { reason });
    return data.data;
  },
  async upsertType(leaveType: Partial<LeaveType>) {
    const { data } = await api.post("/attendance/leave-types", leaveType);
    return data.data as LeaveType;
  },
};

// ─── Payroll ────────────────────────────────────────────────
export const payrollService = {
  async getRuns(params?: { status?: string }) {
    const { data } = await api.get("/payroll/runs", { params });
    return data.data as PayrollRun[];
  },
  async getRunById(id: string) {
    const { data } = await api.get(`/payroll/runs/${id}`);
    return data.data as PayrollRun;
  },
  async initiate(month: number, year: number) {
    const { data } = await api.post("/payroll/initiate", { month, year });
    return data.data as PayrollRun;
  },
  async process(id: string) {
    const { data } = await api.put(`/payroll/runs/${id}/process`);
    return data.data as PayrollRun;
  },
  async approve(id: string) {
    const { data } = await api.put(`/payroll/runs/${id}/approve`);
    return data.data as PayrollRun;
  },
  async getPayslips(runId: string) {
    const { data } = await api.get(`/payroll/runs/${runId}/payslips`);
    return data.data as Payslip[];
  },
  async getMyPayslips() {
    const { data } = await api.get("/payroll/my-payslips");
    return data.data as Payslip[];
  },
  async getStats() {
    const { data } = await api.get("/payroll/stats");
    return data.data;
  },
  async getSalaryStructures() {
    const { data } = await api.get("/payroll/salary-structures");
    return data.data;
  },
  async upsertSalaryStructure(payload: Record<string, unknown>) {
    const { data } = await api.post("/payroll/salary-structures", payload);
    return data.data;
  },
};

// ─── Recruitment ────────────────────────────────────────────
export const recruitmentService = {
  async getJobs(params?: { status?: string }) {
    const { data } = await api.get("/recruitment/jobs", { params });
    return data.data as JobPosting[];
  },
  async getJobById(id: string) {
    const { data } = await api.get(`/recruitment/jobs/${id}`);
    return data.data as JobPosting;
  },
  async createJob(job: Partial<JobPosting>) {
    const { data } = await api.post("/recruitment/jobs", job);
    return data.data as JobPosting;
  },
  async updateJob(id: string, job: Partial<JobPosting>) {
    const { data } = await api.put(`/recruitment/jobs/${id}`, job);
    return data.data as JobPosting;
  },
  async getCandidates(params?: { jobId?: string; stage?: string }) {
    const { data } = await api.get("/recruitment/candidates", { params });
    return data.data as Candidate[];
  },
  async getCandidateById(id: string) {
    const { data } = await api.get(`/recruitment/candidates/${id}`);
    return data.data as Candidate;
  },
  async createCandidate(candidate: Partial<Candidate>) {
    const { data } = await api.post("/recruitment/candidates", candidate);
    return data.data as Candidate;
  },
  async updateCandidate(id: string, candidate: Partial<Candidate>) {
    const { data } = await api.put(`/recruitment/candidates/${id}`, candidate);
    return data.data as Candidate;
  },
  async getInterviews(params?: { candidateId?: string }) {
    const { data } = await api.get("/recruitment/interviews", { params });
    return data.data;
  },
  async scheduleInterview(payload: Record<string, unknown>) {
    const { data } = await api.post("/recruitment/interviews", payload);
    return data.data;
  },
};

// ─── Performance ────────────────────────────────────────────
export const performanceService = {
  async getGoals(params?: { employeeId?: string; status?: string }) {
    const { data } = await api.get("/performance/goals", { params });
    return data.data as Goal[];
  },
  async createGoal(goal: Partial<Goal>) {
    const { data } = await api.post("/performance/goals", goal);
    return data.data as Goal;
  },
  async updateGoal(id: string, goal: Partial<Goal>) {
    const { data } = await api.put(`/performance/goals/${id}`, goal);
    return data.data as Goal;
  },
  async getReviews(params?: { cycleId?: string; employeeId?: string }) {
    const { data } = await api.get("/performance/reviews", { params });
    return data.data as PerformanceReview[];
  },
  async createReview(review: Partial<PerformanceReview>) {
    const { data } = await api.post("/performance/reviews", review);
    return data.data as PerformanceReview;
  },
  async submitReview(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/performance/reviews/${id}/submit`, payload);
    return data.data as PerformanceReview;
  },
  async getCycles() {
    const { data } = await api.get("/performance/cycles");
    return data.data;
  },
  async getReviewCycles() {
    const { data } = await api.get("/performance/cycles");
    return data.data;
  },
  async createCycle(cycle: Record<string, unknown>) {
    const { data } = await api.post("/performance/cycles", cycle);
    return data.data;
  },
  async getSkills() {
    const { data } = await api.get("/performance/skills");
    return data.data;
  },
};

// ─── Analytics ──────────────────────────────────────────────
export const analyticsService = {
  async getExecutiveDashboard(params?: Record<string, unknown>) {
    const { data } = await api.get("/analytics/dashboards/executive", { params });
    return data.data;
  },
  async getWorkforceAnalytics(params?: Record<string, unknown>) {
    const { data } = await api.get("/analytics/workforce", { params });
    return data.data;
  },
  async getRecruitmentAnalytics(params?: Record<string, unknown>) {
    const { data } = await api.get("/analytics/recruitment", { params });
    return data.data;
  },
  async getAttendanceAnalytics(params?: Record<string, unknown>) {
    const { data } = await api.get("/analytics/attendance", { params });
    return data.data;
  },
  async generateReport(params: Record<string, unknown>) {
    const { data } = await api.post("/analytics/reports/generate", params);
    return data.data;
  },
};

// ─── Notifications ──────────────────────────────────────────
export const notificationService = {
  async list(params?: { read?: boolean }) {
    const { data } = await api.get("/notifications", { params });
    return data.data as Notification[];
  },
  async markRead(id: string) {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data.data;
  },
  async markAllRead() {
    const { data } = await api.put("/notifications/read-all");
    return data.data;
  },
};

// ─── Settings / Company ─────────────────────────────────────
export const settingsService = {
  async getCompanyProfile() {
    const { data } = await api.get("/auth/tenants/current");
    return data.data;
  },
  async updateCompany(payload: Record<string, unknown>) {
    const { data } = await api.put("/auth/tenants/current", payload);
    return data.data;
  },
  async updateCompanyProfile(payload: Record<string, unknown>) {
    const { data } = await api.put("/auth/tenants/current", payload);
    return data.data;
  },
  async updateProfile(payload: { firstName: string; lastName: string }) {
    const { data } = await api.put("/auth/users/me", payload);
    return data.data;
  },
  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const { data } = await api.post("/auth/change-password", payload);
    return data.data;
  },
  async enableMFA() {
    const { data } = await api.post("/auth/mfa/enable");
    return data.data;
  },
  async enableMfa() {
    const { data } = await api.post("/auth/mfa/enable");
    return data.data;
  },
  async disableMfa() {
    const { data } = await api.post("/auth/mfa/disable");
    return data.data;
  },
};
