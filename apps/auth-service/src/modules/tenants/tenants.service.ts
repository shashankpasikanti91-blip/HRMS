// ============================================================
// SRP AI HRMS - Tenants Service
// ============================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Tenant slug already exists');

    // Create tenant with admin user in a transaction
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
          industry: dto.industry,
          country: dto.country,
          timezone: dto.timezone || 'UTC',
          settings: dto.settings || {},
          maxUsers: dto.maxUsers || 50,
          status: 'trial',
        },
      });

      // Create default permissions
      const resources = [
        'users', 'roles', 'employees', 'departments', 'positions',
        'attendance', 'leaves', 'payroll', 'recruitment', 'performance',
        'documents', 'reports', 'settings', 'announcements', 'audit-logs',
      ];
      const actions = ['create', 'read', 'update', 'delete', 'export', 'import', 'approve'];

      const permissions = resources.flatMap((resource) =>
        actions.map((action) => ({
          tenantId: tenant.id,
          resource,
          action,
          description: `${action} ${resource}`,
        })),
      );

      await tx.permission.createMany({ data: permissions });

      // Create default roles
      const allPerms = await tx.permission.findMany({ where: { tenantId: tenant.id } });
      const permMap = new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]));

      const roles = [
        { name: 'Super Admin', slug: 'super-admin', description: 'Full access', isSystem: true },
        { name: 'Admin', slug: 'admin', description: 'Administration access', isSystem: true },
        { name: 'HR Manager', slug: 'hr-manager', description: 'HR operations', isSystem: true },
        { name: 'Employee', slug: 'employee', description: 'Basic access', isSystem: true },
      ];

      for (const roleData of roles) {
        const role = await tx.role.create({
          data: { tenantId: tenant.id, ...roleData },
        });

        // Super admin gets all permissions
        if (roleData.slug === 'super-admin') {
          await tx.rolePermission.createMany({
            data: allPerms.map((p) => ({ roleId: role.id, permissionId: p.id })),
          });
        }

        // Create admin user for the tenant
        if (roleData.slug === 'super-admin' && dto.adminEmail) {
          const passwordHash = await bcrypt.hash(dto.adminPassword || 'Admin@123!', 12);
          const user = await tx.user.create({
            data: {
              tenantId: tenant.id,
              email: dto.adminEmail,
              passwordHash,
              firstName: dto.adminFirstName || 'Admin',
              lastName: dto.adminLastName || 'User',
              status: 'active',
            },
          });
          await tx.userRole.create({
            data: { userId: user.id, roleId: role.id },
          });
        }
      }

      return tenant;
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        industry: true,
        country: true,
        status: true,
        maxUsers: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, employees: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        status: true,
        settings: true,
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tenant not found');

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.domain && { domain: dto.domain }),
        ...(dto.logo && { logo: dto.logo }),
        ...(dto.industry && { industry: dto.industry }),
        ...(dto.country && { country: dto.country }),
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.settings && { settings: dto.settings }),
        ...(dto.status && { status: dto.status }),
        ...(dto.maxUsers && { maxUsers: dto.maxUsers }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tenant not found');

    // Soft delete — change status
    await this.prisma.tenant.update({
      where: { id },
      data: { status: 'suspended' },
    });

    return { deleted: true };
  }
}
