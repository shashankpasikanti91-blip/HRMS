// ============================================================
// SRP AI HRMS - Jobs/Job Postings Service
// ============================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    title: string;
    departmentId?: string;
    positionId?: string;
    description: string;
    requirements?: string;
    location?: string;
    employmentType?: string;
    experienceMin?: number;
    experienceMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    openings?: number;
    hiringManagerId?: string;
    skills?: string[];
    createdById: string;
  }) {
    return this.prisma.jobPosting.create({
      data: {
        tenantId,
        title: data.title,
        departmentId: data.departmentId,
        positionId: data.positionId,
        description: data.description,
        requirements: data.requirements,
        location: data.location,
        employmentType: data.employmentType || 'full-time',
        experienceMin: data.experienceMin,
        experienceMax: data.experienceMax,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        openings: data.openings || 1,
        hiringManagerId: data.hiringManagerId,
        skills: data.skills || [],
        status: 'draft',
        createdById: data.createdById,
      },
      include: {
        department: { select: { name: true } },
        hiringManager: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(tenantId: string, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;

    return this.prisma.jobPosting.findMany({
      where,
      include: {
        department: { select: { name: true } },
        hiringManager: { select: { firstName: true, lastName: true } },
        _count: { select: { candidates: true, interviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const job = await this.prisma.jobPosting.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        position: true,
        hiringManager: { select: { firstName: true, lastName: true } },
        candidates: {
          include: { candidate: { select: { id: true, firstName: true, lastName: true, email: true, stage: true } } },
        },
        _count: { select: { candidates: true, interviews: true } },
      },
    });
    if (!job) throw new NotFoundException('Job posting not found');
    return job;
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.jobPosting.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Job posting not found');
    return this.prisma.jobPosting.update({ where: { id }, data });
  }

  async publish(tenantId: string, id: string) {
    return this.update(tenantId, id, { status: 'published', publishedAt: new Date() });
  }

  async close(tenantId: string, id: string) {
    return this.update(tenantId, id, { status: 'closed', closedAt: new Date() });
  }

  async getPublicJobs(tenantId: string) {
    return this.prisma.jobPosting.findMany({
      where: { tenantId, status: 'published' },
      select: {
        id: true, title: true, location: true, employmentType: true,
        experienceMin: true, experienceMax: true, salaryMin: true, salaryMax: true,
        description: true, requirements: true, skills: true, openings: true,
        publishedAt: true,
        department: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getRecruitmentPipeline(tenantId: string) {
    const candidates = await this.prisma.candidate.findMany({
      where: { tenantId },
      select: { stage: true },
    });

    const pipeline: Record<string, number> = {};
    for (const c of candidates) {
      pipeline[c.stage] = (pipeline[c.stage] || 0) + 1;
    }
    return pipeline;
  }
}
