// ============================================================
// SRP AI HRMS - Shared Utilities
// ============================================================

import { PAGINATION } from '../constants';

/**
 * Standardized API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: PaginationMeta,
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta,
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ApiResponse {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Normalize pagination params with defaults
 */
export function normalizePagination(query: PaginationQuery): Required<PaginationQuery> {
  return {
    page: Math.max(1, query.page || PAGINATION.DEFAULT_PAGE),
    limit: Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, query.limit || PAGINATION.DEFAULT_LIMIT),
    ),
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder || 'desc',
    search: query.search || '',
  };
}

/**
 * Generate a tenant-prefixed cache key
 */
export function cacheKey(tenantId: string, ...parts: string[]): string {
  return `tenant:${tenantId}:${parts.join(':')}`;
}

/**
 * Generate employee code
 */
export function generateEmployeeCode(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, '0')}`;
}

/**
 * Calculate working days between two dates (excludes weekends)
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Mask sensitive data (e.g., bank account, SSN)
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars) return '*'.repeat(value.length);
  const masked = '*'.repeat(value.length - visibleChars);
  return masked + value.slice(-visibleChars);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a random string for codes/tokens
 */
export function generateRandomCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Omit keys from an object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pick keys from an object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}
