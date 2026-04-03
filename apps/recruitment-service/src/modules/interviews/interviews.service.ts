import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class InterviewsService {
  constructor(private prisma: PrismaService) {}

  async schedule(tenantId: string, data: {
    candidateId: string;
    jobPostingId: string;
    round: number;
    type: string;
    scheduledAt: string;
    duration?: number;
    location?: string;
    meetingLink?: string;
    interviewerIds: string[];
    notes?: string;
  }) {
    return this.prisma.interview.create({
      data: {
        tenantId,
        candidateId: data.candidateId,
        jobPostingId: data.jobPostingId,
        round: data.round,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration || 60,
        location: data.location,
        meetingLink: data.meetingLink,
        notes: data.notes,
        status: 'scheduled',
        interviewers: { connect: data.interviewerIds.map((id) => ({ id })) },
      },
      include: {
        candidate: { select: { firstName: true, lastName: true, email: true } },
        interviewers: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(tenantId: string, filters?: { candidateId?: string; jobPostingId?: string; status?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.jobPostingId) where.jobPostingId = filters.jobPostingId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.interview.findMany({
      where,
      include: {
        candidate: { select: { firstName: true, lastName: true, email: true } },
        jobPosting: { select: { title: true } },
        interviewers: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async submitFeedback(tenantId: string, id: string, data: {
    rating: number;
    feedback: string;
    recommendation: string;
    status: string;
  }) {
    const interview = await this.prisma.interview.findFirst({ where: { id, tenantId } });
    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.interview.update({
      where: { id },
      data: {
        rating: data.rating,
        feedback: data.feedback,
        recommendation: data.recommendation,
        status: data.status,
      },
    });
  }

  async getUpcoming(tenantId: string, interviewerId: string) {
    return this.prisma.interview.findMany({
      where: {
        tenantId,
        interviewers: { some: { id: interviewerId } },
        status: 'scheduled',
        scheduledAt: { gte: new Date() },
      },
      include: {
        candidate: { select: { firstName: true, lastName: true } },
        jobPosting: { select: { title: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });
  }
}
