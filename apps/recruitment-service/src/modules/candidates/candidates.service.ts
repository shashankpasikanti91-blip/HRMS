import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    jobPostingId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    coverLetter?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    currentCompany?: string;
    currentTitle?: string;
    experienceYears?: number;
    expectedSalary?: number;
    source?: string;
    skills?: string[];
  }) {
    const candidate = await this.prisma.candidate.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        resumeUrl: data.resumeUrl,
        coverLetter: data.coverLetter,
        linkedinUrl: data.linkedinUrl,
        portfolioUrl: data.portfolioUrl,
        currentCompany: data.currentCompany,
        currentTitle: data.currentTitle,
        experienceYears: data.experienceYears,
        expectedSalary: data.expectedSalary,
        source: data.source || 'direct',
        skills: data.skills || [],
        stage: 'applied',
      },
    });

    // Link to job posting
    await this.prisma.jobPosting.update({
      where: { id: data.jobPostingId },
      data: { candidates: { connect: { id: candidate.id } } },
    });

    return candidate;
  }

  async findAll(tenantId: string, jobPostingId?: string, stage?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (stage) where.stage = stage;

    if (jobPostingId) {
      where.jobPostings = { some: { id: jobPostingId } };
    }

    return this.prisma.candidate.findMany({
      where,
      include: {
        jobPostings: { select: { id: true, title: true } },
        _count: { select: { interviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id, tenantId },
      include: {
        jobPostings: { select: { id: true, title: true, status: true } },
        interviews: {
          include: { interviewers: { select: { firstName: true, lastName: true } } },
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async updateStage(tenantId: string, id: string, stage: string, notes?: string) {
    const candidate = await this.prisma.candidate.findFirst({ where: { id, tenantId } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    return this.prisma.candidate.update({
      where: { id },
      data: {
        stage,
        ...(stage === 'rejected' && { rejectedAt: new Date(), rejectionReason: notes }),
        ...(stage === 'hired' && { hiredAt: new Date() }),
      },
    });
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>) {
    const candidate = await this.prisma.candidate.findFirst({ where: { id, tenantId } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return this.prisma.candidate.update({ where: { id }, data });
  }
}
