/**
 * SRP AI HRMS - Data Protection & Compliance Configuration
 *
 * LEGAL COMPLIANCE REQUIREMENTS:
 * 1. Indian Digital Personal Data Protection Act (DPDPA) 2023
 * 2. GDPR (for EU employees/clients)
 * 3. IT Act 2000 (India) - Section 43A, 72A
 * 4. Labour law compliance for payroll/attendance data
 *
 * CRITICAL: All personal data must be:
 * - Collected with explicit consent
 * - Processed for stated purpose only
 * - Stored securely with encryption
 * - Deletable upon request (Right to Erasure)
 * - Auditable (who accessed what, when)
 */

export const complianceConfig = {
  // Data retention policies (in days)
  dataRetention: {
    employeeRecords: 365 * 8, // 8 years (Indian labour law requirement)
    payrollRecords: 365 * 8,  // 8 years
    attendanceRecords: 365 * 3, // 3 years
    recruitmentData: 365 * 2,  // 2 years after application
    auditLogs: 365 * 5,       // 5 years
    sessionLogs: 90,           // 90 days
    deletedUserData: 30,       // 30 days grace period before permanent deletion
  },

  // Consent requirements per feature
  consentRequired: {
    basicProfile: true,         // Name, email, phone
    biometricData: true,        // Fingerprint, face for attendance
    locationTracking: true,     // GPS-based attendance
    performanceData: true,      // Reviews, ratings
    salaryInformation: true,    // Payslips, CTC
    healthInformation: true,    // Medical insurance claims
    backgroundCheck: true,      // Criminal/education verification
    socialMediaLogin: true,     // LinkedIn, Google SSO
    communicationOptIn: true,   // WhatsApp, Telegram notifications
    analyticsTracking: true,    // Usage analytics
    aiProcessing: true,         // AI-based resume screening, performance analytics
  },

  // Encryption requirements
  encryption: {
    atRest: 'AES-256-GCM',            // Database field encryption
    inTransit: 'TLS 1.2+',            // All API communication
    passwords: 'bcrypt (12 rounds)',   // Password hashing
    pii: 'AES-256-GCM',               // PII fields encrypted at DB level
    backups: 'AES-256-CBC',            // Backup encryption
  },

  // Audit logging requirements
  auditEvents: [
    'user.login',
    'user.logout',
    'user.password_change',
    'user.role_change',
    'employee.create',
    'employee.update',
    'employee.delete',
    'employee.view_salary',
    'payroll.process',
    'payroll.approve',
    'attendance.override',
    'leave.approve',
    'leave.reject',
    'recruitment.view_resume',
    'recruitment.ai_screen',
    'data.export',
    'data.bulk_download',
    'admin.settings_change',
    'integration.api_call',
    'tenant.create',
    'tenant.deactivate',
  ],

  // Third-party data sharing restrictions
  thirdPartyDataSharing: {
    // NEVER share PII with third parties without explicit consent
    neverShare: [
      'aadhaarNumber',
      'panNumber',
      'bankAccountNumber',
      'ifscCode',
      'medicalRecords',
      'salary',
      'biometricData',
    ],
    // Only share with consent + legal basis
    consentRequired: [
      'name',
      'email',
      'phone',
      'resume',
      'employmentHistory',
    ],
    // Safe to share for integrations
    safeToShare: [
      'jobTitle',
      'department',
      'publicProfileUrl',
    ],
  },

  // Terms of Service requirements
  termsOfService: {
    version: '1.0.0',
    lastUpdated: '2026-04-03',
    requiredAcceptance: true, // Must accept before using platform
    sections: [
      'dataCollection',
      'dataProcessing',
      'dataRetention',
      'thirdPartySharing',
      'userRights',
      'cookiePolicy',
      'securityMeasures',
      'breachNotification',
      'governingLaw',
      'disputeResolution',
    ],
  },

  // Data breach notification requirements
  breachNotification: {
    regulatoryBodyNotificationHours: 72,  // DPDPA: 72 hours
    affectedUsersNotificationHours: 72,   // Notify users within 72 hours
    reportingAuthority: 'Data Protection Board of India',
  },

  // Anti-scraping / Anti-abuse measures
  antiAbuse: {
    // Rate limiting per tenant
    maxApiCallsPerMinute: 100,
    maxBulkExportRecords: 1000,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,

    // Job portal integration safeguards
    jobPortalRules: [
      'ONLY use official partner APIs',
      'NEVER scrape job portal websites',
      'NEVER store third-party user credentials',
      'Respect API rate limits from providers',
      'Cache job listing data for max 24 hours',
      'Delete candidate data if they withdraw application',
      'Include clear attribution for imported job listings',
    ],
  },
};

export type ComplianceConfig = typeof complianceConfig;
