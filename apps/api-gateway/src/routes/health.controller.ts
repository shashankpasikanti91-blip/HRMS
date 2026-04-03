import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return {
      status: 'ok',
      service: 'api-gateway',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('services')
  @ApiOperation({ summary: 'List connected services' })
  services() {
    return {
      services: [
        { name: 'auth-service', port: 4001 },
        { name: 'core-hr-service', port: 4002 },
        { name: 'attendance-service', port: 4003 },
        { name: 'payroll-service', port: 4004 },
        { name: 'recruitment-service', port: 4005 },
        { name: 'performance-service', port: 4006 },
        { name: 'notification-service', port: 4007 },
        { name: 'analytics-service', port: 4008 },
      ],
    };
  }
}
