import api from "@/lib/api";
import type { Employee, Department, PaginatedResponse } from "@/types";

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
};

export const departmentService = {
  async list() {
    const { data } = await api.get("/core-hr/departments");
    return data.data as Department[];
  },
  async create(department: Partial<Department>) {
    const { data } = await api.post("/core-hr/departments", department);
    return data.data as Department;
  },
};

export const attendanceService = {
  async clockIn() {
    const { data } = await api.post("/attendance/clock-in");
    return data.data;
  },
  async clockOut() {
    const { data } = await api.post("/attendance/clock-out");
    return data.data;
  },
  async getToday() {
    const { data } = await api.get("/attendance/today");
    return data.data;
  },
};

export const payrollService = {
  async getRuns() {
    const { data } = await api.get("/payroll/runs");
    return data.data;
  },
  async initiate(month: number, year: number) {
    const { data } = await api.post("/payroll/initiate", { month, year });
    return data.data;
  },
};

export const recruitmentService = {
  async getJobs() {
    const { data } = await api.get("/recruitment/jobs");
    return data.data;
  },
  async createJob(job: Record<string, unknown>) {
    const { data } = await api.post("/recruitment/jobs", job);
    return data.data;
  },
};

export const analyticsService = {
  async getExecutiveDashboard() {
    const { data } = await api.get("/analytics/dashboards/executive");
    return data.data;
  },
  async generateReport(params: Record<string, unknown>) {
    const { data } = await api.post("/analytics/reports/generate", params);
    return data.data;
  },
};
