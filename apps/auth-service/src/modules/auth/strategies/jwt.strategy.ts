// ============================================================
// SRP AI HRMS - JWT Strategy (Passport)
// ============================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../config/prisma.service';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'srp-hrms-jwt-secret-change-me'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        email: true,
        status: true,
        userRoles: {
          select: {
            role: {
              select: {
                slug: true,
                permissions: {
                  select: {
                    permission: {
                      select: { resource: true, action: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    const roles = user.userRoles.map((ur) => ur.role.slug);
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`),
    );

    return {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      permissions: [...new Set(permissions)],
    };
  }
}
