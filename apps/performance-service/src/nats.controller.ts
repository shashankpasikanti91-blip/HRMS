// ============================================================
// SRP AI HRMS - Performance NATS Message Handler
// Handles messages from API Gateway via NATS
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GoalsService } from './modules/goals/goals.service';
import { ReviewsService } from './modules/reviews/reviews.service';
import { CyclesService } from './modules/cycles/cycles.service';
import { SkillsService } from './modules/skills/skills.service';

@Controller()
export class PerformanceNatsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly reviewsService: ReviewsService,
    private readonly cyclesService: CyclesService,
    private readonly skillsService: SkillsService,
  ) {}

  // ── Goals ──

  @MessagePattern('goals.findAll')
  async findAllGoals(@Payload() data: any) {
    return this.goalsService.findAll(data.tenantId, data.employeeId, data.status, data.cycleId);
  }

  @MessagePattern('goals.create')
  async createGoal(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.goalsService.create(tenantId, dto);
  }

  @MessagePattern('goals.findOne')
  async findOneGoal(@Payload() data: any) {
    return this.goalsService.findOne(data.tenantId, data.id);
  }

  @MessagePattern('goals.update')
  async updateGoal(@Payload() data: any) {
    const { tenantId, id, ...dto } = data;
    return this.goalsService.update(tenantId, id, dto);
  }

  // ── Reviews ──

  @MessagePattern('reviews.findAll')
  async findAllReviews(@Payload() data: any) {
    return this.reviewsService.findAll(data.tenantId, data.cycleId, data.employeeId, data.status);
  }

  @MessagePattern('reviews.create')
  async createReview(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.reviewsService.create(tenantId, dto);
  }

  @MessagePattern('reviews.submit')
  async submitReview(@Payload() data: any) {
    const { tenantId, id, ...dto } = data;
    return this.reviewsService.submitReview(tenantId, id, dto);
  }

  // ── Review Cycles ──

  @MessagePattern('cycles.findAll')
  async findAllCycles(@Payload() data: any) {
    return this.cyclesService.findAll(data.tenantId);
  }

  @MessagePattern('cycles.create')
  async createCycle(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.cyclesService.create(tenantId, dto);
  }

  @MessagePattern('cycles.activate')
  async activateCycle(@Payload() data: any) {
    return this.cyclesService.activate(data.tenantId, data.id);
  }

  // ── Skills ──

  @MessagePattern('skills.findAll')
  async findAllSkills(@Payload() data: any) {
    return this.skillsService.findAllSkills(data.tenantId, data.category);
  }

  @MessagePattern('skills.create')
  async createSkill(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.skillsService.createSkill(tenantId, dto);
  }

  @MessagePattern('skills.assign')
  async assignSkill(@Payload() data: any) {
    return this.skillsService.assignSkill(data.tenantId, data.employeeId, data.skillId, data.level);
  }

  @MessagePattern('skills.gapAnalysis')
  async getSkillGap(@Payload() data: any) {
    return this.skillsService.getSkillGap(data.tenantId, data.positionId);
  }
}
