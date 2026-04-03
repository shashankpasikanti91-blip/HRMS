// ============================================================
// SRP AI HRMS - Auth NATS Message Handler
// Handles messages from API Gateway via NATS
// ============================================================

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthNatsController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register')
  async register(@Payload() data: any) {
    return this.authService.register(data);
  }

  @MessagePattern('auth.login')
  async login(@Payload() data: any) {
    return this.authService.login(data, data.ipAddress, data.userAgent);
  }

  @MessagePattern('auth.refresh')
  async refresh(@Payload() data: any) {
    return this.authService.refreshToken(data);
  }

  @MessagePattern('auth.logout')
  async logout(@Payload() data: any) {
    return this.authService.logout(data.userId, data.refreshToken);
  }

  @MessagePattern('auth.forgot-password')
  async forgotPassword(@Payload() data: any) {
    return this.authService.forgotPassword(data);
  }

  @MessagePattern('auth.reset-password')
  async resetPassword(@Payload() data: any) {
    return this.authService.resetPassword(data);
  }

  @MessagePattern('auth.mfa.enable')
  async enableMfa(@Payload() data: any) {
    return this.authService.enableMfa(data.userId);
  }

  @MessagePattern('auth.mfa.verify')
  async verifyMfa(@Payload() data: any) {
    return this.authService.verifyMfa(data.userId, data);
  }

  @MessagePattern('auth.profile')
  async getProfile(@Payload() data: any) {
    return this.authService.getProfile(data.userId);
  }

  @MessagePattern('auth.google.callback')
  async googleCallback(@Payload() data: any) {
    // Exchange Google code for user info then login/register
    const { code, ipAddress, userAgent } = data;
    const googleUser = await this.exchangeGoogleCode(code);
    return this.authService.googleLogin(googleUser, ipAddress, userAgent);
  }

  private async exchangeGoogleCode(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/v1/auth/google/callback';

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to exchange Google auth code');
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userRes.json();

    return {
      googleId: userInfo.id,
      email: userInfo.email,
      firstName: userInfo.given_name || '',
      lastName: userInfo.family_name || '',
      avatar: userInfo.picture || null,
    };
  }
}
