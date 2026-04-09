// ============================================================
// SRP AI HRMS - Recruitment NATS Message Handler
// Handles messages from API Gateway via NATS
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobsService } from './modules/jobs/jobs.service';
import { CandidatesService } from './modules/candidates/candidates.service';
import { InterviewsService } from './modules/interviews/interviews.service';

@Controller()
export class RecruitmentNatsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly candidatesService: CandidatesService,
    private readonly interviewsService: InterviewsService,
  ) {}

  // ── Jobs ──

  @MessagePattern('jobs.findAll')
  async findAllJobs(@Payload() data: any) {
    return this.jobsService.findAll(data.tenantId, data.status);
  }

  @MessagePattern('jobs.create')
  async createJob(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.jobsService.create(tenantId, dto);
  }

  @MessagePattern('jobs.findOne')
  async findOneJob(@Payload() data: any) {
    return this.jobsService.findOne(data.tenantId, data.id);
  }

  @MessagePattern('jobs.update')
  async updateJob(@Payload() data: any) {
    const { tenantId, id, ...dto } = data;
    return this.jobsService.update(tenantId, id, dto);
  }

  @MessagePattern('jobs.delete')
  async deleteJob(@Payload() data: any) {
    return this.jobsService.close(data.tenantId, data.id);
  }

  @MessagePattern('jobs.publish')
  async publishJob(@Payload() data: any) {
    return this.jobsService.publish(data.tenantId, data.id);
  }

  @MessagePattern('jobs.public')
  async getPublicJobs(@Payload() data: any) {
    return this.jobsService.getPublicJobs(data.tenantId);
  }

  @MessagePattern('jobs.pipeline')
  async getPipeline(@Payload() data: any) {
    return this.jobsService.getRecruitmentPipeline(data.tenantId);
  }

  // ── Candidates ──

  @MessagePattern('candidates.findAll')
  async findAllCandidates(@Payload() data: any) {
    return this.candidatesService.findAll(data.tenantId, data.jobPostingId, data.stage);
  }

  @MessagePattern('candidates.create')
  async createCandidate(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.candidatesService.create(tenantId, dto);
  }

  @MessagePattern('candidates.findOne')
  async findOneCandidate(@Payload() data: any) {
    return this.candidatesService.findOne(data.tenantId, data.id);
  }

  @MessagePattern('candidates.updateStage')
  async updateCandidateStage(@Payload() data: any) {
    return this.candidatesService.updateStage(data.tenantId, data.id, data.stage, data.notes);
  }

  @MessagePattern('candidates.update')
  async updateCandidate(@Payload() data: any) {
    const { tenantId, id, ...dto } = data;
    return this.candidatesService.update(tenantId, id, dto);
  }

  // ── Interviews ──

  @MessagePattern('interviews.findAll')
  async findAllInterviews(@Payload() data: any) {
    return this.interviewsService.findAll(data.tenantId, data);
  }

  @MessagePattern('interviews.create')
  async scheduleInterview(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.interviewsService.schedule(tenantId, dto);
  }

  @MessagePattern('interviews.feedback')
  async submitFeedback(@Payload() data: any) {
    const { tenantId, id, ...dto } = data;
    return this.interviewsService.submitFeedback(tenantId, id, dto);
  }
}
