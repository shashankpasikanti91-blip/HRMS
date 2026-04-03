// ============================================================
// SRP AI HRMS - Employees Service
// ============================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { CreateEmployeeDto, UpdateEmployeeDto, ListEmployeesDto } from './dto';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(tenantId: string, dto: CreateEmployeeDto) {
    // Generate employee code
    const count = await this.prisma.employee.count({ where: { tenantId } });
    const employeeCode = `EMP${String(count + 1).padStart(5, '0')}`;

    // Check duplicate
    if (dto.userId) {
      const existing = await this.prisma.employee.findFirst({
        where: { tenantId, userId: dto.userId },
      });
      if (existing) throw new ConflictException('Employee profile already exists for this user');
    }

    const employee = await this.prisma.employee.create({
      data: {
        tenantId,
        userId: dto.userId,
        employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender,
        maritalStatus: dto.maritalStatus,
        nationality: dto.nationality,
        address: dto.address,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        managerId: dto.managerId,
        employmentType: dto.employmentType || 'full-time',
        joinDate: new Date(dto.joinDate),
        probationEndDate: dto.probationEndDate ? new Date(dto.probationEndDate) : null,
        status: 'active',
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Invalidate cache
    await this.redis.delPattern(`employees:${tenantId}:*`);

    return employee;
  }

  async findAll(tenantId: string, query: ListEmployeesDto) {
    const where: Record<string, unknown> = { tenantId };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.positionId) where.positionId = query.positionId;
    if (query.status) where.status = query.status;
    if (query.employmentType) where.employmentType = query.employmentType;
    if (query.managerId) where.managerId = query.managerId;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
          manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        directReports: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        skills: { include: { skill: true } },
        user: {
          select: { id: true, email: true, status: true, mfaEnabled: true },
        },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Employee not found');

    const data: Record<string, unknown> = {};
    const fields = [
      'firstName', 'lastName', 'email', 'phone', 'gender',
      'maritalStatus', 'nationality', 'address', 'departmentId',
      'positionId', 'managerId', 'employmentType', 'status',
    ];

    for (const field of fields) {
      if (dto[field] !== undefined) data[field] = dto[field];
    }
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.joinDate) data.joinDate = new Date(dto.joinDate);
    if (dto.probationEndDate) data.probationEndDate = new Date(dto.probationEndDate);
    if (dto.exitDate) data.exitDate = new Date(dto.exitDate);
    if (dto.exitReason) data.exitReason = dto.exitReason;

    const employee = await this.prisma.employee.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
      },
    });

    await this.redis.delPattern(`employees:${tenantId}:*`);
    return employee;
  }

  async getOrgChart(tenantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'active' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        managerId: true,
        departmentId: true,
        positionId: true,
        department: { select: { name: true } },
        position: { select: { title: true } },
      },
      orderBy: { firstName: 'asc' },
    });

    // Build tree structure
    const map = new Map(employees.map((e) => [e.id, { ...e, children: [] as typeof employees }]));
    const roots: (typeof employees[0] & { children: typeof employees })[] = [];

    for (const emp of map.values()) {
      if (emp.managerId && map.has(emp.managerId)) {
        map.get(emp.managerId)!.children.push(emp);
      } else {
        roots.push(emp);
      }
    }

    return roots;
  }

  async getDirectReports(tenantId: string, managerId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId, managerId, status: 'active' },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getHeadcount(tenantId: string) {
    const [total, byDepartment, byType, byStatus] = await Promise.all([
      this.prisma.employee.count({ where: { tenantId } }),
      this.prisma.employee.groupBy({
        by: ['departmentId'],
        where: { tenantId, status: 'active' },
        _count: true,
      }),
      this.prisma.employee.groupBy({
        by: ['employmentType'],
        where: { tenantId, status: 'active' },
        _count: true,
      }),
      this.prisma.employee.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    // Resolve department names
    const deptIds = byDepartment.map((d) => d.departmentId).filter(Boolean) as string[];
    const depts = await this.prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true },
    });
    const deptMap = new Map(depts.map((d) => [d.id, d.name]));

    return {
      total,
      byDepartment: byDepartment.map((d) => ({
        departmentId: d.departmentId,
        departmentName: d.departmentId ? deptMap.get(d.departmentId) : 'Unassigned',
        count: d._count,
      })),
      byType: byType.map((t) => ({ type: t.employmentType, count: t._count })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  }
}
