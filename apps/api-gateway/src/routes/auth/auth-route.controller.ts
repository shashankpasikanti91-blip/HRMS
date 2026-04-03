import { Controller, Post, Get, Put, Delete, Body, Param, Query, Inject, UseGuards, Req, Res } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthRouteController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

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

  // ── Google OAuth ──
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleLogin(@Res() res: Response) {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI') || 'http://localhost:4000/api/v1/auth/google/callback';
    const scope = encodeURIComponent('openid email profile');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    res.redirect(url);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const code = req.query.code as string;
    const webUrl = this.configService.get('APP_URL') || 'http://localhost:3000';

    if (!code) {
      return res.redirect(`${webUrl}/login?error=Google+authentication+failed`);
    }

    try {
      const result = await firstValueFrom(
        this.authClient.send('auth.google.callback', {
          code,
          ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip,
          userAgent: req.headers['user-agent'],
        }),
      );

      const tokens = result.tokens || result;
      const tenantId = result.user?.tenantId || '';
      return res.redirect(
        `${webUrl}/auth/google/callback?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}&tenant_id=${tenantId}`,
      );
    } catch (error) {
      return res.redirect(`${webUrl}/login?error=Google+authentication+failed`);
    }
  }

  // ── Users /me ──
  @Get('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Req() req: Request) {
    const user = (req as any).user;
    return firstValueFrom(this.authClient.send('users.findOne', { id: user.sub || user.id }));
  }
}
