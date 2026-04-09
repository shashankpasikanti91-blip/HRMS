// ============================================================
// SRP AI HRMS - Core HR NATS Message Handler
// Handles messages from API Gateway via NATS
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmployeesService } from './modules/employees/employees.service';
import { DepartmentsService } from './modules/departments/departments.service';
import { PositionsService } from './modules/positions/positions.service';
import { DocumentsService } from './modules/documents/documents.service';

@Controller()
export class CoreHrNatsController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly departmentsService: DepartmentsService,
    private readonly positionsService: PositionsService,
    private readonly documentsService: DocumentsService,
  ) {}

  // ── Employees ──

  @MessagePattern('employees.findAll')
  async findAllEmployees(@Payload() data: any) {
    return this.employeesService.findAll(data.tenantId, data);
  }

  @MessagePattern('employees.create')
  async createEmployee(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.employeesService.create(tenantId, dto);
  }

  @MessagePattern('employees.findOne')
  async findOneEmployee(@Payload() data: any) {
    return this.employeesService.findOne(data.tenantId, data.id);
  }

  @MessagePattern('employees.update')
  async updateEmployee(@Payload() data: any) {
    const { tenantId, id, ...dto } = data;
    return this.employeesService.update(tenantId, id, dto);
  }

  @MessagePattern('employees.delete')
  async deleteEmployee(@Payload() data: any) {
    return this.employeesService.update(data.tenantId, data.id, { status: 'inactive' });
  }

  @MessagePattern('employees.orgChart')
  async getOrgChart(@Payload() data: any) {
    return this.employeesService.getOrgChart(data.tenantId);
  }

  @MessagePattern('employees.headcount')
  async getHeadcount(@Payload() data: any) {
    return this.employeesService.getHeadcount(data.tenantId);
  }

  // ── Departments ──

  @MessagePattern('departments.findAll')
  async findAllDepartments(@Payload() data: any) {
    return this.departmentsService.findAll(data.tenantId);
  }

  @MessagePattern('departments.create')
  async createDepartment(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.departmentsService.create(tenantId, dto);
  }

  @MessagePattern('departments.findOne')
  async findOneDepartment(@Payload() data: any) {
    return this.departmentsService.findOne(data.tenantId, data.id);
  }

  @MessagePattern('departments.update')
  async updateDepartment(@Payload() data: any) {
    const { tenantId, id, ...dto } = data;
    return this.departmentsService.update(tenantId, id, dto);
  }

  @MessagePattern('departments.tree')
  async getDepartmentTree(@Payload() data: any) {
    return this.departmentsService.getTree(data.tenantId);
  }

  // ── Positions ──

  @MessagePattern('positions.findAll')
  async findAllPositions(@Payload() data: any) {
    return this.positionsService.findAll(data.tenantId, data.departmentId);
  }

  @MessagePattern('positions.create')
  async createPosition(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.positionsService.create(tenantId, dto);
  }

  // ── Documents ──

  @MessagePattern('documents.findAll')
  async findAllDocuments(@Payload() data: any) {
    return this.documentsService.findAll(data.tenantId, data.employeeId, data.category);
  }

  @MessagePattern('documents.create')
  async createDocument(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.documentsService.create(tenantId, dto);
  }
}
