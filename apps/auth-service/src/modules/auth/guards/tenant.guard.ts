// ============================================================
// SRP AI HRMS - Tenant Guard
// ============================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Ensures the authenticated user belongs to the tenant being accessed.
 * Checks if the request path/body tenantId matches the JWT tenantId.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admin can access all tenants
    if (user.roles?.includes('super-admin')) {
      return true;
    }

    // Check route param
    const paramTenantId = request.params?.tenantId;
    if (paramTenantId && paramTenantId !== user.tenantId) {
      throw new ForbiddenException('Cannot access another tenant\'s data');
    }

    // Check body
    const bodyTenantId = request.body?.tenantId;
    if (bodyTenantId && bodyTenantId !== user.tenantId) {
      throw new ForbiddenException('Cannot modify another tenant\'s data');
    }

    // Inject tenantId into request for service layer
    request.tenantId = user.tenantId;

    return true;
  }
}
