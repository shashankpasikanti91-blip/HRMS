import { Controller, Post, Get, Put, Delete, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthRouteController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('auth.register', body));
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with credentials' })
  login(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('auth.login', body));
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refreshToken(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('auth.refresh', body));
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate token' })
  logout(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('auth.logout', body));
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  forgotPassword(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('auth.forgot-password', body));
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('auth.reset-password', body));
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable MFA' })
  enableMfa(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('auth.mfa.enable', body));
  }

  @Post('mfa/verify')
  @ApiOperation({ summary: 'Verify MFA token' })
  verifyMfa(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('auth.mfa.verify', body));
  }

  // ── Users ──
  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users' })
  getUsers(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('users.findAll', query));
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  getUser(@Param('id') id: string) {
    return firstValueFrom(this.authClient.send('users.findOne', { id }));
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  updateUser(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('users.update', { id, ...body }));
  }

  // ── Roles ──
  @Get('roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List roles' })
  getRoles(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('roles.findAll', query));
  }

  @Post('roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create role' })
  createRole(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.authClient.send('roles.create', body));
  }
}
