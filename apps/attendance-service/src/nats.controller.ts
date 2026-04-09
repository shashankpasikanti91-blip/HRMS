// ============================================================
// SRP AI HRMS - Attendance NATS Message Handler
// Handles messages from API Gateway via NATS
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AttendanceService } from './modules/attendance/attendance.service';
import { LeavesService } from './modules/leaves/leaves.service';
import { HolidaysService } from './modules/holidays/holidays.service';

@Controller()
export class AttendanceNatsController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly leavesService: LeavesService,
    private readonly holidaysService: HolidaysService,
  ) {}

  // ── Attendance ──

  @MessagePattern('attendance.clockIn')
  async clockIn(@Payload() data: any) {
    return this.attendanceService.clockIn(data.tenantId, data.employeeId, data);
  }

  @MessagePattern('attendance.clockOut')
  async clockOut(@Payload() data: any) {
    return this.attendanceService.clockOut(data.tenantId, data.employeeId, data);
  }

  @MessagePattern('attendance.today')
  async getTodayStatus(@Payload() data: any) {
    return this.attendanceService.getTodayStatus(data.tenantId, data.employeeId);
  }

  @MessagePattern('attendance.history')
  async getHistory(@Payload() data: any) {
    return this.attendanceService.getEmployeeAttendance(data.tenantId, data.employeeId, data.startDate, data.endDate);
  }

  @MessagePattern('attendance.team')
  async getTeamAttendance(@Payload() data: any) {
    return this.attendanceService.getTeamAttendance(data.tenantId, data.date || new Date().toISOString().split('T')[0], data.departmentId);
  }

  @MessagePattern('attendance.summary')
  async getMonthlySummary(@Payload() data: any) {
    return this.attendanceService.getMonthlySummary(data.tenantId, data.employeeId, data.year, data.month);
  }

  @MessagePattern('attendance.bulk')
  async bulkMark(@Payload() data: any) {
    return this.attendanceService.bulkMarkAttendance(data.tenantId, data.entries);
  }

  // ── Leaves ──

  @MessagePattern('leaves.apply')
  async applyLeave(@Payload() data: any) {
    return this.leavesService.applyLeave(data.tenantId, data);
  }

  @MessagePattern('leaves.approve')
  async approveLeave(@Payload() data: any) {
    return this.leavesService.updateLeaveStatus(data.tenantId, data.id, 'approved', data.approverId, data.comments);
  }

  @MessagePattern('leaves.reject')
  async rejectLeave(@Payload() data: any) {
    return this.leavesService.updateLeaveStatus(data.tenantId, data.id, 'rejected', data.approverId, data.comments);
  }

  @MessagePattern('leaves.pending')
  async getPendingLeaves(@Payload() data: any) {
    return this.leavesService.getPendingApprovals(data.tenantId, data.managerId);
  }

  @MessagePattern('leaves.balance')
  async getLeaveBalance(@Payload() data: any) {
    return this.leavesService.getLeaveBalances(data.tenantId, data.employeeId);
  }

  @MessagePattern('leaves.types')
  async getLeaveTypes(@Payload() data: any) {
    return this.leavesService.getLeaveTypes(data.tenantId);
  }

  @MessagePattern('leaves.employee')
  async getEmployeeLeaves(@Payload() data: any) {
    return this.leavesService.getEmployeeLeaves(data.tenantId, data.employeeId, data.year);
  }

  // ── Holidays ──

  @MessagePattern('holidays.findAll')
  async findAllHolidays(@Payload() data: any) {
    return this.holidaysService.findAll(data.tenantId, data.year);
  }

  @MessagePattern('holidays.create')
  async createHoliday(@Payload() data: any) {
    const { tenantId, ...dto } = data;
    return this.holidaysService.create(tenantId, dto);
  }
}
