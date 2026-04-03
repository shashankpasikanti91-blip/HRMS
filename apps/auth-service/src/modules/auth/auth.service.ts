// ============================================================
// SRP AI HRMS - Auth Service (Business Logic)
// ============================================================

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { LoginDto, RegisterDto, RefreshTokenDto, EnableMfaDto, VerifyMfaDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  // ---- Register ----
  async register(dto: RegisterDto) {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }
    if (tenant.status !== 'active' && tenant.status !== 'trial') {
      throw new ForbiddenException('Tenant is not active');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: dto.tenantId, email: dto.email } },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: 'pending',
      },
    });

    // Assign default employee role
    const employeeRole = await this.prisma.role.findUnique({
      where: { tenantId_slug: { tenantId: dto.tenantId, slug: 'employee' } },
    });
    if (employeeRole) {
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId: employeeRole.id },
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
    };
  }

  // ---- Login ----
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: dto.tenantId, email: dto.email } },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked. Try again later.');
    }

    // Check if user is active
    if (user.status !== 'active' && user.status !== 'pending') {
      throw new ForbiddenException('Account is suspended or inactive');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new UnauthorizedException('Password login not configured. Use SSO.');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = user.failedAttempts + 1;
      const updateData: Record<string, unknown> = { failedAttempts };

      // Lock account after 5 failed attempts (30 min lockout)
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.failedAttempts = 0;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Check MFA
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return { mfaRequired: true, userId: user.id };
      }
      const isValid = authenticator.verify({
        token: dto.mfaCode,
        secret: user.mfaSecret!,
      });
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Build permissions list
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`),
    );

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'login',
        resource: 'auth',
        ipAddress,
        userAgent,
      },
    });

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles: user.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          slug: ur.role.slug,
        })),
        permissions: [...new Set(permissions)],
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        logo: user.tenant.logo,
      },
      tokens,
    };
  }

  // ---- Refresh Token ----
  async refreshToken(dto: RefreshTokenDto) {
    // Validate refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Store new refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        token: tokens.refreshToken,
        userAgent: storedToken.userAgent,
        ipAddress: storedToken.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { tokens };
  }

  // ---- Logout ----
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }

    // Invalidate user session in Redis
    await this.redisService.del(`user:session:${userId}`);
  }

  // ---- Logout All Sessions ----
  async logoutAllSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.redisService.delPattern(`user:session:${userId}*`);
  }

  // ---- Enable MFA ----
  async enableMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'SRP AI HRMS', secret);
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // Temporarily store secret in Redis (not saved to DB until verified)
    await this.redisService.set(`mfa:setup:${userId}`, secret, 600); // 10 min

    return { secret, qrCode };
  }

  // ---- Verify & Activate MFA ----
  async verifyMfa(userId: string, dto: VerifyMfaDto) {
    const secret = await this.redisService.get(`mfa:setup:${userId}`);
    if (!secret) {
      throw new BadRequestException('MFA setup expired. Please start again.');
    }

    const isValid = authenticator.verify({ token: dto.code, secret });
    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    // Save to DB
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaSecret: secret },
    });

    // Clean up Redis
    await this.redisService.del(`mfa:setup:${userId}`);

    return { enabled: true };
  }

  // ---- Disable MFA ----
  async disableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled');
    }

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    return { disabled: true };
  }

  // ---- Validate User (for Passport) ----
  async validateUser(tenantId: string, email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });

    if (user && user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (isValid) {
        return user;
      }
    }
    return null;
  }

  // ---- Get current user profile ----
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        tenant: true,
        employee: true,
      },
    });

    if (!user) throw new BadRequestException('User not found');

    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`),
    );

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      mfaEnabled: user.mfaEnabled,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        slug: ur.role.slug,
      })),
      permissions: [...new Set(permissions)],
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            departmentId: user.employee.departmentId,
            positionId: user.employee.positionId,
          }
        : null,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        logo: user.tenant.logo,
      },
    };
  }

  // ---- Private: Generate JWT Tokens ----
  private async generateTokens(user: { id: string; tenantId: string; email: string }) {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'srp-hrms-refresh-secret'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ---- Change Password ----
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new BadRequestException('User not found or password not set');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens (force re-login)
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password changed successfully' };
  }

  // ---- Forgot Password ----
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: dto.tenantId, email: dto.email } },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = randomBytes(32).toString('hex');
    await this.redisService.set(`password:reset:${token}`, user.id, 3600); // 1hr

    // TODO: Send email via Notification service (NATS event)
    // For now, log the token
    console.log(`Password reset token for ${user.email}: ${token}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  // ---- Reset Password ----
  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.redisService.get(`password:reset:${dto.token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Clean up token
    await this.redisService.del(`password:reset:${dto.token}`);

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  }
}
