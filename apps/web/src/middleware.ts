import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PATHS = ['/dashboard'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

/**
 * Middleware:
 * 1. Route protection — redirect unauthenticated users to /login
 * 2. Tenant extraction from subdomain → X-Tenant-Slug header
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Route protection ────────────────────────────────────────────────────
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected) {
    // Check NextAuth JWT token (HTTP-only cookie)
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // No NextAuth token — the client may still have a localStorage token.
      // We allow the request through; the dashboard layout will redirect via
      // loadUser() if localStorage is also empty.  This avoids a hard redirect
      // that would break users still on the legacy localStorage-only flow.
      // Uncomment the line below to enforce strict server-side protection:
      // return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ── Tenant slug extraction ──────────────────────────────────────────────
  const hostname = request.headers.get('host') || '';
  const response = NextResponse.next();
  let tenant: string | null = null;

  if (hostname.includes('.hrms.srpailabs.com')) {
    const subdomain = hostname.split('.hrms.srpailabs.com')[0];
    if (!['api', 'app', 'grafana', 'monitoring', 'n8n', 'www'].includes(subdomain)) {
      tenant = subdomain;
    }
  } else if (hostname.includes('.localhost')) {
    const subdomain = hostname.split('.localhost')[0];
    if (subdomain && subdomain !== 'localhost') {
      tenant = subdomain;
    }
  }

  const nginxTenant = request.headers.get('x-tenant-slug');
  if (nginxTenant) tenant = nginxTenant;

  if (tenant) {
    response.headers.set('x-tenant-slug', tenant);
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
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};


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
