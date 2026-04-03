import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    employeeId: string;
    reviewerId: string;
    reviewCycleId: string;
    type: string;
  }) {
    return this.prisma.performanceReview.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        reviewerId: data.reviewerId,
        reviewCycleId: data.reviewCycleId,
        type: data.type || 'manager',
        status: 'pending',
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        reviewer: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(tenantId: string, cycleId?: string, employeeId?: string, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (cycleId) where.reviewCycleId = cycleId;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    return this.prisma.performanceReview.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
        reviewer: { select: { firstName: true, lastName: true } },
        reviewCycle: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const review = await this.prisma.performanceReview.findFirst({
      where: { id, tenantId },
      include: {
        employee: { select: { firstName: true, lastName: true, department: { select: { name: true } }, position: { select: { title: true } } } },
        reviewer: { select: { firstName: true, lastName: true } },
        reviewCycle: true,
      },
    });
    if (!review) throw new NotFoundException('Performance review not found');
    return review;
  }

  async submitReview(tenantId: string, id: string, data: {
    goalRating?: number;
    competencyRating?: number;
    overallRating: number;
    strengths?: string;
    improvements?: string;
    comments?: string;
    managerComments?: string;
  }) {
    const review = await this.prisma.performanceReview.findFirst({ where: { id, tenantId } });
    if (!review) throw new NotFoundException('Performance review not found');

    return this.prisma.performanceReview.update({
      where: { id },
      data: {
        goalRating: data.goalRating,
        competencyRating: data.competencyRating,
        overallRating: data.overallRating,
        strengths: data.strengths,
        improvements: data.improvements,
        comments: data.comments,
        managerComments: data.managerComments,
        status: 'submitted',
        submittedAt: new Date(),
      },
    });
  }

  async approveReview(tenantId: string, id: string) {
    const review = await this.prisma.performanceReview.findFirst({ where: { id, tenantId, status: 'submitted' } });
    if (!review) throw new NotFoundException('Submitted review not found');

    return this.prisma.performanceReview.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date() },
    });
  }

  async getMyReviews(tenantId: string, employeeId: string) {
    return this.prisma.performanceReview.findMany({
      where: { tenantId, employeeId },
      include: { reviewer: { select: { firstName: true, lastName: true } }, reviewCycle: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingReviews(tenantId: string, reviewerId: string) {
    return this.prisma.performanceReview.findMany({
      where: { tenantId, reviewerId, status: 'pending' },
      include: { employee: { select: { firstName: true, lastName: true } }, reviewCycle: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getReviewStats(tenantId: string, cycleId: string) {
    const reviews = await this.prisma.performanceReview.findMany({
      where: { tenantId, reviewCycleId: cycleId },
      select: { status: true, overallRating: true },
    });

    const total = reviews.length;
    const completed = reviews.filter((r) => r.status === 'approved' || r.status === 'submitted').length;
    const rated = reviews.filter((r) => r.overallRating != null);
    const avgRating = rated.length > 0 ? rated.reduce((s, r) => s + (r.overallRating || 0), 0) / rated.length : 0;

    const distribution: Record<string, number> = {};
    for (const r of rated) {
      const bucket = Math.round(r.overallRating || 0).toString();
      distribution[bucket] = (distribution[bucket] || 0) + 1;
    }

    return { total, completed, pending: total - completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, avgRating: Math.round(avgRating * 100) / 100, distribution };
  }
}
