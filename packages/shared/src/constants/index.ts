// ============================================================
// SRP AI HRMS - Shared Constants
// ============================================================

export const APP_NAME = 'SRP AI HRMS';
export const APP_DESCRIPTION = 'AI-Powered Human Resource Management System';
export const APP_URL = 'https://hrms.srpailabs.com';
export const APP_COMPANY = 'SRP AI Labs';

// Service Ports
export const SERVICE_PORTS = {
  API_GATEWAY: 4000,
  AUTH_SERVICE: 4001,
  CORE_HR_SERVICE: 4002,
  ATTENDANCE_SERVICE: 4003,
  PAYROLL_SERVICE: 4004,
  RECRUITMENT_SERVICE: 4005,
  PERFORMANCE_SERVICE: 4006,
  NOTIFICATION_SERVICE: 4007,
  ANALYTICS_SERVICE: 4008,
  AI_ENGINE: 8000,
  WEB_APP: 3000,
} as const;

// Service Names (for NATS/event bus)
export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  AUTH_SERVICE: 'auth-service',
  CORE_HR_SERVICE: 'core-hr-service',
  ATTENDANCE_SERVICE: 'attendance-service',
  PAYROLL_SERVICE: 'payroll-service',
  RECRUITMENT_SERVICE: 'recruitment-service',
  PERFORMANCE_SERVICE: 'performance-service',
  NOTIFICATION_SERVICE: 'notification-service',
  ANALYTICS_SERVICE: 'analytics-service',
  AI_ENGINE: 'ai-engine',
} as const;

// Event Names
export const EVENTS = {
  // Auth Events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',

  // Tenant Events
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  TENANT_SUSPENDED: 'tenant.suspended',

  // Employee Events
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_UPDATED: 'employee.updated',
  EMPLOYEE_TERMINATED: 'employee.terminated',
  EMPLOYEE_PROMOTED: 'employee.promoted',
  EMPLOYEE_TRANSFERRED: 'employee.transferred',

  // Attendance Events
  ATTENDANCE_CLOCK_IN: 'attendance.clock_in',
  ATTENDANCE_CLOCK_OUT: 'attendance.clock_out',
  ATTENDANCE_ANOMALY: 'attendance.anomaly',

  // Leave Events
  LEAVE_REQUESTED: 'leave.requested',
  LEAVE_APPROVED: 'leave.approved',
  LEAVE_REJECTED: 'leave.rejected',
  LEAVE_CANCELLED: 'leave.cancelled',

  // Payroll Events
  PAYROLL_INITIATED: 'payroll.initiated',
  PAYROLL_PROCESSED: 'payroll.processed',
  PAYROLL_APPROVED: 'payroll.approved',
  PAYROLL_FINALIZED: 'payroll.finalized',
  PAYSLIP_GENERATED: 'payslip.generated',

  // Recruitment Events
  JOB_POSTED: 'job.posted',
  APPLICATION_RECEIVED: 'application.received',
  CANDIDATE_STAGE_CHANGED: 'candidate.stage_changed',
  OFFER_EXTENDED: 'offer.extended',
  OFFER_ACCEPTED: 'offer.accepted',

  // Performance Events
  GOAL_CREATED: 'goal.created',
  GOAL_UPDATED: 'goal.updated',
  REVIEW_SUBMITTED: 'review.submitted',
  REVIEW_CYCLE_STARTED: 'review.cycle_started',

  // Notification Events
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_BULK_SEND: 'notification.bulk_send',

  // AI Events
  AI_ANALYSIS_REQUESTED: 'ai.analysis_requested',
  AI_ANALYSIS_COMPLETED: 'ai.analysis_completed',
  AI_CHAT_MESSAGE: 'ai.chat_message',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_RESUME_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// System Roles (default roles created per tenant)
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  HR_ADMIN: 'hr_admin',
  HR_MANAGER: 'hr_manager',
  DEPARTMENT_HEAD: 'department_head',
  TEAM_MANAGER: 'team_manager',
  EMPLOYEE: 'employee',
  CONTRACTOR: 'contractor',
  RECRUITER: 'recruiter',
  FINANCE_ADMIN: 'finance_admin',
  COMPLIANCE_OFFICER: 'compliance_officer',
  LD_ADMIN: 'ld_admin',
} as const;

// Default permissions per system role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*:*'],
  tenant_admin: ['*:*'],
  hr_admin: [
    'employees:*',
    'departments:*',
    'positions:*',
    'attendance:*',
    'leave:*',
    'payroll:read',
    'recruitment:*',
    'performance:*',
    'documents:*',
    'reports:*',
  ],
  hr_manager: [
    'employees:read',
    'employees:update',
    'departments:read',
    'attendance:*',
    'leave:*',
    'performance:*',
    'reports:read',
  ],
  department_head: [
    'employees:read',
    'attendance:read',
    'leave:read',
    'leave:approve',
    'performance:read',
    'performance:update',
    'reports:read',
  ],
  team_manager: [
    'employees:read',
    'attendance:read',
    'leave:read',
    'leave:approve',
    'performance:read',
    'performance:update',
  ],
  employee: [
    'employees:read:own',
    'attendance:read:own',
    'attendance:create:own',
    'leave:read:own',
    'leave:create:own',
    'payroll:read:own',
    'performance:read:own',
    'documents:read:own',
    'documents:create:own',
  ],
  recruiter: [
    'recruitment:*',
    'candidates:*',
    'interviews:*',
    'employees:read',
  ],
  finance_admin: [
    'payroll:*',
    'salary:*',
    'expense:*',
    'budget:*',
    'reports:read',
  ],
};
