// ============================================================
// SRP AI HRMS - Roles Service
// ============================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });
    if (existing) throw new ConflictException('Role slug already exists');

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isSystem: false,
      },
    });

    // Assign permissions
    if (dto.permissionIds?.length) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(tenantId, role.id);
  }

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(tenantId: string, id: string, dto: UpdateRoleDto) {
    const existing = await this.prisma.role.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Role not found');
    if (existing.isSystem) throw new ConflictException('Cannot modify system roles');

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    await this.prisma.role.update({ where: { id }, data });

    // Update permissions
    if (dto.permissionIds) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (dto.permissionIds.length) {
        await this.prisma.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.role.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Role not found');
    if (existing.isSystem) throw new ConflictException('Cannot delete system roles');

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.userRole.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });

    return { deleted: true };
  }

  async getPermissions(tenantId: string) {
    return this.prisma.permission.findMany({
      where: { tenantId },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }
}
