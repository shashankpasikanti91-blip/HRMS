// ============================================================
// SRP AI HRMS - Google OAuth Strategy
// ============================================================

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: configService.get<string>('GOOGLE_REDIRECT_URI') || 'http://localhost:4000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      avatar: photos?.[0]?.value || null,
      accessToken,
    };
    done(null, user);
  }
}
