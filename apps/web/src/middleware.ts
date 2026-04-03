import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to extract tenant slug from subdomain
 * e.g., acme.hrms.srpailabs.com -> tenant = "acme"
 * Sets X-Tenant-Slug header for downstream use
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const response = NextResponse.next();

  // Extract tenant from subdomain
  // Patterns: {tenant}.hrms.srpailabs.com or {tenant}.localhost:3000
  let tenant: string | null = null;

  if (hostname.includes('.hrms.srpailabs.com')) {
    const subdomain = hostname.split('.hrms.srpailabs.com')[0];
    // Skip known subdomains
    if (!['api', 'app', 'grafana', 'monitoring', 'n8n', 'www'].includes(subdomain)) {
      tenant = subdomain;
    }
  } else if (hostname.includes('.localhost')) {
    // Dev mode: tenant.localhost:3000
    const subdomain = hostname.split('.localhost')[0];
    if (subdomain && subdomain !== 'localhost') {
      tenant = subdomain;
    }
  }

  // Also check for X-Tenant-Slug header from Nginx
  const nginxTenant = request.headers.get('x-tenant-slug');
  if (nginxTenant) {
    tenant = nginxTenant;
  }

  if (tenant) {
    response.headers.set('x-tenant-slug', tenant);
    // Pass tenant to the app via cookie for client-side access
    response.cookies.set('tenant-slug', tenant, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
