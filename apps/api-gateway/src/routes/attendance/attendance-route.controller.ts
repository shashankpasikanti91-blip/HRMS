import { Controller, Get, Post, Put, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Attendance & Leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceRouteController {
  constructor(@Inject('ATTENDANCE_SERVICE') private readonly client: ClientProxy) {}

  // ── Attendance ──
  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in' })
  clockIn(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('attendance.clockIn', body));
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out' })
  clockOut(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('attendance.clockOut', body));
  }

  @Get('today/:employeeId')
  @ApiOperation({ summary: 'Today attendance' })
  getToday(@Param('employeeId') employeeId: string) {
    return firstValueFrom(this.client.send('attendance.today', { employeeId }));
  }

  @Get('history/:employeeId')
  @ApiOperation({ summary: 'Attendance history' })
  getHistory(@Param('employeeId') employeeId: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('attendance.history', { employeeId, ...query }));
  }

  @Get('team/:managerId')
  @ApiOperation({ summary: 'Team attendance' })
  getTeamAttendance(@Param('managerId') managerId: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('attendance.team', { managerId, ...query }));
  }

  // ── Leaves ──
  @Post('leaves/apply')
  @ApiOperation({ summary: 'Apply for leave' })
  applyLeave(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('leaves.apply', body));
  }

  @Put('leaves/:id/approve')
  @ApiOperation({ summary: 'Approve leave' })
  approveLeave(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('leaves.approve', { id, ...body }));
  }

  @Put('leaves/:id/reject')
  @ApiOperation({ summary: 'Reject leave' })
  rejectLeave(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('leaves.reject', { id, ...body }));
  }

  @Get('leaves/pending')
  @ApiOperation({ summary: 'Pending leave approvals' })
  getPendingLeaves(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('leaves.pending', query));
  }

  @Get('leaves/balance/:employeeId')
  @ApiOperation({ summary: 'Leave balance' })
  getLeaveBalance(@Param('employeeId') employeeId: string) {
    return firstValueFrom(this.client.send('leaves.balance', { employeeId }));
  }

  // ── Holidays ──
  @Get('holidays')
  @ApiOperation({ summary: 'List holidays' })
  getHolidays(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('holidays.findAll', query));
  }

  @Post('holidays')
  @ApiOperation({ summary: 'Create holiday' })
  createHoliday(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('holidays.create', body));
  }
}
