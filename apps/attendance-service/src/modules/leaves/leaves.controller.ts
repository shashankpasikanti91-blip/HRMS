import {
  Controller, Get, Post, Patch, Body, Param, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { LeavesService } from './leaves.service';

@ApiTags('Leaves')
@Controller('leaves')
@ApiBearerAuth()
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Apply for leave' })
  apply(@Req() req: Request, @Body() dto: any) {
    return this.leavesService.applyLeave(req.headers['x-tenant-id'] as string, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve leave' })
  approve(@Req() req: Request, @Param('id') id: string, @Body() dto: { approverId: string; comments?: string }) {
    return this.leavesService.updateLeaveStatus(req.headers['x-tenant-id'] as string, id, 'approved', dto.approverId, dto.comments);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject leave' })
  reject(@Req() req: Request, @Param('id') id: string, @Body() dto: { approverId: string; comments?: string }) {
    return this.leavesService.updateLeaveStatus(req.headers['x-tenant-id'] as string, id, 'rejected', dto.approverId, dto.comments);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel leave' })
  cancel(@Req() req: Request, @Param('id') id: string, @Body() dto: { employeeId: string }) {
    return this.leavesService.cancelLeave(req.headers['x-tenant-id'] as string, id, dto.employeeId);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get employee leaves' })
  getEmployeeLeaves(@Req() req: Request, @Param('employeeId') eId: string, @Query('year') year?: number) {
    return this.leavesService.getEmployeeLeaves(req.headers['x-tenant-id'] as string, eId, year);
  }

  @Get('pending/:managerId')
  @ApiOperation({ summary: 'Get pending leave approvals' })
  getPendingApprovals(@Req() req: Request, @Param('managerId') managerId: string) {
    return this.leavesService.getPendingApprovals(req.headers['x-tenant-id'] as string, managerId);
  }

  @Get('balances/:employeeId')
  @ApiOperation({ summary: 'Get leave balances' })
  getBalances(@Req() req: Request, @Param('employeeId') eId: string, @Query('year') year?: number) {
    return this.leavesService.getLeaveBalances(req.headers['x-tenant-id'] as string, eId, year);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get leave types' })
  getTypes(@Req() req: Request) {
    return this.leavesService.getLeaveTypes(req.headers['x-tenant-id'] as string);
  }

  @Post('types')
  @ApiOperation({ summary: 'Create/update leave type' })
  upsertType(@Req() req: Request, @Body() dto: any) {
    return this.leavesService.upsertLeaveType(req.headers['x-tenant-id'] as string, dto);
  }

  @Post('initialize-balances')
  @ApiOperation({ summary: 'Initialize leave balances for a year' })
  initializeBalances(@Req() req: Request, @Body() dto: { year: number }) {
    return this.leavesService.initializeBalances(req.headers['x-tenant-id'] as string, dto.year);
  }
}
