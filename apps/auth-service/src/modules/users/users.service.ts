// ============================================================
// SRP AI HRMS - Users Service
// ============================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { CreateUserDto, UpdateUserDto, ListUsersDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) throw new ConflictException('User already exists');

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : null;

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: dto.status || 'active',
      },
      select: this.userSelect,
    });

    // Assign roles
    if (dto.roleIds?.length) {
      await this.prisma.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ userId: user.id, roleId })),
        skipDuplicates: true,
      });
    }

    return user;
  }

  async findAll(tenantId: string, query: ListUsersDto) {
    const where: Record<string, unknown> = { tenantId };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.userSelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        ...this.userSelect,
        userRoles: {
          select: {
            role: { select: { id: true, name: true, slug: true } },
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            departmentId: true,
            positionId: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('User not found');

    const data: Record<string, unknown> = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelect,
    });

    // Update roles if provided
    if (dto.roleIds) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length) {
        await this.prisma.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }

    return user;
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('User not found');

    // Soft-delete by changing status
    await this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { deleted: true };
  }

  private userSelect = {
    id: true,
    tenantId: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    avatar: true,
    status: true,
    mfaEnabled: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  };
}
