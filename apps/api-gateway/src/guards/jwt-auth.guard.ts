import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const secret = process.env.JWT_SECRET || 'srp-hrms-jwt-secret-change-in-production';
      const payload = jwt.verify(token, secret) as JwtPayload;

      (request as any).user = payload;
      (request as any).tenantId = payload.tenantId;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
