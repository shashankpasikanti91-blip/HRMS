// ============================================================
// SRP AI HRMS - Local Strategy (Passport)
// ============================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// @ts-ignore -- no @types/passport-local
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: any, email: string, password: string) {
    const tenantId = req.body?.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID is required');
    }

    const user = await this.authService.validateUser(tenantId, email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
