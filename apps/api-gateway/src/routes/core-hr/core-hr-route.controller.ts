import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Core HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('core-hr')
export class CoreHrRouteController {
  constructor(@Inject('CORE_HR_SERVICE') private readonly client: ClientProxy) {}

  // ── Employees ──
  @Get('employees')
  @ApiOperation({ summary: 'List employees' })
  getEmployees(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('employees.findAll', query));
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create employee' })
  createEmployee(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('employees.create', body));
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee' })
  getEmployee(@Param('id') id: string) {
    return firstValueFrom(this.client.send('employees.findOne', { id }));
  }

  @Put('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  updateEmployee(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('employees.update', { id, ...body }));
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: 'Delete employee' })
  deleteEmployee(@Param('id') id: string) {
    return firstValueFrom(this.client.send('employees.delete', { id }));
  }

  @Get('employees/org-chart/:tenantId')
  @ApiOperation({ summary: 'Organization chart' })
  getOrgChart(@Param('tenantId') tenantId: string) {
    return firstValueFrom(this.client.send('employees.orgChart', { tenantId }));
  }

  // ── Departments ──
  @Get('departments')
  @ApiOperation({ summary: 'List departments' })
  getDepartments(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('departments.findAll', query));
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create department' })
  createDepartment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('departments.create', body));
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department' })
  getDepartment(@Param('id') id: string) {
    return firstValueFrom(this.client.send('departments.findOne', { id }));
  }

  @Put('departments/:id')
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('departments.update', { id, ...body }));
  }

  // ── Positions ──
  @Get('positions')
  @ApiOperation({ summary: 'List positions' })
  getPositions(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('positions.findAll', query));
  }

  @Post('positions')
  @ApiOperation({ summary: 'Create position' })
  createPosition(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('positions.create', body));
  }

  // ── Documents ──
  @Get('documents')
  @ApiOperation({ summary: 'List documents' })
  getDocuments(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.client.send('documents.findAll', query));
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload document' })
  createDocument(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.client.send('documents.create', body));
  }
}
