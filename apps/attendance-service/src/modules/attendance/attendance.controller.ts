import {
  Controller, Get, Post, Body, Param, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@Controller('attendance')
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in' })
  clockIn(@Req() req: Request, @Body() dto: { employeeId: string; clockInLocation?: any; clockInPhoto?: string; source?: string }) {
    return this.attendanceService.clockIn(req.headers['x-tenant-id'] as string, dto.employeeId, dto);
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out' })
  clockOut(@Req() req: Request, @Body() dto: { employeeId: string; clockOutLocation?: any; clockOutPhoto?: string }) {
    return this.attendanceService.clockOut(req.headers['x-tenant-id'] as string, dto.employeeId, dto);
  }

  @Get('today/:employeeId')
  @ApiOperation({ summary: "Get today's status" })
  getTodayStatus(@Req() req: Request, @Param('employeeId') employeeId: string) {
    return this.attendanceService.getTodayStatus(req.headers['x-tenant-id'] as string, employeeId);
  }

  @Get('history/:employeeId')
  @ApiOperation({ summary: 'Get attendance history' })
  getHistory(
    @Req() req: Request,
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getEmployeeAttendance(req.headers['x-tenant-id'] as string, employeeId, startDate, endDate);
  }

  @Get('team')
  @ApiOperation({ summary: 'Get team attendance for a date' })
  getTeamAttendance(
    @Req() req: Request,
    @Query('date') date: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.attendanceService.getTeamAttendance(req.headers['x-tenant-id'] as string, date, departmentId);
  }

  @Get('summary/:employeeId')
  @ApiOperation({ summary: 'Get monthly summary' })
  getMonthlySummary(
    @Req() req: Request,
    @Param('employeeId') employeeId: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.attendanceService.getMonthlySummary(req.headers['x-tenant-id'] as string, employeeId, year, month);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk mark attendance' })
  bulkMark(@Req() req: Request, @Body() dto: { entries: any[] }) {
    return this.attendanceService.bulkMarkAttendance(req.headers['x-tenant-id'] as string, dto.entries);
  }
}
