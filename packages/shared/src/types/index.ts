// ============================================================
// SRP AI HRMS - Shared Types
// Core type definitions used across all microservices
// ============================================================

// ---- Tenant Types ----
export interface ITenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  settings: ITenantSettings;
  subscription: ISubscription;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITenantSettings {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    favicon?: string;
  };
  locale: {
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  features: {
    enabledModules: ModuleType[];
    aiFeatures: boolean;
    maxEmployees: number;
  };
  security: {
    mfaRequired: boolean;
    passwordPolicy: IPasswordPolicy;
    sessionTimeout: number;
    ipWhitelist: string[];
  };
}

export interface IPasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // last N passwords
}

export interface ISubscription {
  plan: SubscriptionPlan;
  modules: ModuleType[];
  maxUsers: number;
  billingCycle: 'monthly' | 'annual';
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
}

// ---- User Types ----
export interface IUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  roles: IRole[];
  status: UserStatus;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRole {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  permissions: IPermission[];
  isSystem: boolean;
  createdAt: Date;
}

export interface IPermission {
  id: string;
  resource: string;
  action: PermissionAction;
  conditions?: Record<string, unknown>;
}

// ---- Employee Types ----
export interface IEmployee {
  id: string;
  tenantId: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  personalEmail?: string;
  phone: string;
  dateOfBirth: Date;
  gender: Gender;
  maritalStatus: MaritalStatus;
  nationality?: string;
  bloodGroup?: string;
  address: IAddress;
  emergencyContacts: IEmergencyContact[];
  departmentId: string;
  positionId: string;
  managerId?: string;
  employmentType: EmploymentType;
  dateOfJoining: Date;
  dateOfConfirmation?: Date;
  dateOfSeparation?: Date;
  probationEndDate?: Date;
  noticePeriod: number; // days
  status: EmployeeStatus;
  salary?: ISalaryInfo;
  bankDetails?: IBankDetails;
  documents: IDocument[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface ISalaryInfo {
  basic: number;
  hra?: number;
  allowances: ISalaryComponent[];
  deductions: ISalaryComponent[];
  grossSalary: number;
  netSalary: number;
  currency: string;
  effectiveDate: Date;
}

export interface ISalaryComponent {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  baseComponent?: string; // for percentage-based
}

export interface IBankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  ifscCode?: string;
  swiftCode?: string;
  accountType: 'savings' | 'checking' | 'current';
}

export interface IDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  mimeType: string;
  size: number;
  expiryDate?: Date;
  uploadedAt: Date;
}

// ---- Department Types ----
export interface IDepartment {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  headId?: string;
  costCenterId?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// ---- Position Types ----
export interface IPosition {
  id: string;
  tenantId: string;
  title: string;
  code: string;
  departmentId: string;
  grade?: string;
  band?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  description?: string;
  requirements?: string[];
  status: 'active' | 'inactive' | 'frozen';
  createdAt: Date;
  updatedAt: Date;
}

// ---- Attendance Types ----
export interface IAttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  totalHours?: number;
  overtimeHours?: number;
  status: AttendanceStatus;
  source: AttendanceSource;
  location?: IGeolocation;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGeolocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

// ---- Leave Types ----
export interface ILeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approverComment?: string;
  approvedAt?: Date;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveType {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  annualQuota: number;
  carryForwardLimit: number;
  encashable: boolean;
  requiresApproval: boolean;
  requiresAttachment: boolean;
  minConsecutiveDays?: number;
  maxConsecutiveDays?: number;
  applicableGenders?: Gender[];
  isPaid: boolean;
  status: 'active' | 'inactive';
}

export interface ILeaveBalance {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalQuota: number;
  used: number;
  pending: number;
  carryForwarded: number;
  available: number;
}

// ---- Payroll Types ----
export interface IPayrollRun {
  id: string;
  tenantId: string;
  period: string; // YYYY-MM
  runDate: Date;
  status: PayrollStatus;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  currency: string;
  processedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: Date;
}

export interface IPayslip {
  id: string;
  tenantId: string;
  employeeId: string;
  payrollRunId: string;
  period: string;
  earnings: IPayComponent[];
  deductions: IPayComponent[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  currency: string;
  bankDetails: IBankDetails;
  status: 'draft' | 'finalized' | 'paid';
  paidAt?: Date;
  createdAt: Date;
}

export interface IPayComponent {
  name: string;
  code: string;
  type: 'earning' | 'deduction';
  calculationType: 'fixed' | 'percentage' | 'formula';
  amount: number;
  taxable: boolean;
}

// ---- Recruitment Types ----
export interface IJobPosting {
  id: string;
  tenantId: string;
  title: string;
  code: string;
  departmentId: string;
  positionId?: string;
  description: string;
  requirements: string[];
  niceToHave?: string[];
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryRange?: { min: number; max: number; currency: string };
  location: string;
  remotePolicy: 'onsite' | 'remote' | 'hybrid';
  vacancies: number;
  hiringManagerId: string;
  recruiterId?: string;
  status: JobStatus;
  publishedChannels: string[];
  applicationDeadline?: Date;
  aiScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICandidate {
  id: string;
  tenantId: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  source: CandidateSource;
  stage: CandidateStage;
  aiScore?: number;
  aiAnalysis?: ICandidateAIAnalysis;
  notes?: string;
  tags?: string[];
  status: CandidateStatus;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICandidateAIAnalysis {
  overallScore: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  cultureFitScore?: number;
  strengths: string[];
  concerns: string[];
  summary: string;
}

// ---- Performance Types ----
export interface IGoal {
  id: string;
  tenantId: string;
  employeeId: string;
  title: string;
  description: string;
  type: 'objective' | 'key_result' | 'kpi';
  parentGoalId?: string;
  metricType: 'percentage' | 'number' | 'boolean' | 'currency';
  targetValue: number;
  currentValue: number;
  weight: number;
  startDate: Date;
  dueDate: Date;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPerformanceReview {
  id: string;
  tenantId: string;
  employeeId: string;
  reviewCycleId: string;
  reviewerId: string;
  type: ReviewType;
  overallRating: number;
  ratings: IRating[];
  strengths: string;
  improvements: string;
  comments: string;
  aiDraftGenerated?: boolean;
  biasFlags?: string[];
  status: ReviewStatus;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRating {
  competencyId: string;
  competencyName: string;
  rating: number;
  comment?: string;
}

// ---- Notification Types ----
export interface INotification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  sentAt: Date;
  createdAt: Date;
}

// ---- AI Types ----
export interface IChatMessage {
  id: string;
  tenantId: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
    model?: string;
    tokens?: number;
  };
  createdAt: Date;
}

export interface IAIAnalysisResult {
  type: string;
  score: number;
  confidence: number;
  insights: string[];
  recommendations: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ---- Enums ----
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum SubscriptionPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIAL = 'trial',
}

export enum ModuleType {
  CORE_HR = 'core_hr',
  PAYROLL = 'payroll',
  ATTENDANCE = 'attendance',
  LEAVE = 'leave',
  RECRUITMENT = 'recruitment',
  PERFORMANCE = 'performance',
  LMS = 'lms',
  ANALYTICS = 'analytics',
  COMPLIANCE = 'compliance',
  BENEFITS = 'benefits',
  ONBOARDING = 'onboarding',
  OFFBOARDING = 'offboarding',
  SUCCESSION = 'succession',
  DEI = 'dei',
  EMPLOYEE_RELATIONS = 'employee_relations',
  CONTRACTOR = 'contractor',
  GLOBAL_HR = 'global_hr',
  DOCUMENTS = 'documents',
  COMMUNICATIONS = 'communications',
  EXPENSE = 'expense',
  PROJECT = 'project',
  HEALTH_SAFETY = 'health_safety',
  ORG_DESIGN = 'org_design',
  COMPENSATION = 'compensation',
  EXIT = 'exit',
  TALENT_MARKETPLACE = 'talent_marketplace',
  MEETING = 'meeting',
  TRAVEL = 'travel',
  SERVICE_DESK = 'service_desk',
  VERIFICATION = 'verification',
  ASSET = 'asset',
  BUDGET = 'budget',
  RECOGNITION = 'recognition',
  SHIFT = 'shift',
  LABOR_LAW = 'labor_law',
  ETHICS = 'ethics',
  SKILLS = 'skills',
  PREDICTIVE = 'predictive',
  INTEGRATIONS = 'integrations',
  AI_CHATBOT = 'ai_chatbot',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  EXPORT = 'export',
  IMPORT = 'import',
  MANAGE = 'manage',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  FREELANCE = 'freelance',
  TEMPORARY = 'temporary',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  PROBATION = 'probation',
  NOTICE_PERIOD = 'notice_period',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  RESIGNED = 'resigned',
  RETIRED = 'retired',
  ABSCONDED = 'absconded',
}

export enum DocumentType {
  RESUME = 'resume',
  ID_PROOF = 'id_proof',
  ADDRESS_PROOF = 'address_proof',
  EDUCATION = 'education',
  EXPERIENCE = 'experience',
  OFFER_LETTER = 'offer_letter',
  CONTRACT = 'contract',
  POLICY = 'policy',
  CERTIFICATE = 'certificate',
  TAX = 'tax',
  BANK = 'bank',
  OTHER = 'other',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  LATE = 'late',
  ON_LEAVE = 'on_leave',
  HOLIDAY = 'holiday',
  WEEKEND = 'weekend',
  WORK_FROM_HOME = 'work_from_home',
}

export enum AttendanceSource {
  BIOMETRIC = 'biometric',
  GPS = 'gps',
  WIFI = 'wifi',
  QR_CODE = 'qr_code',
  WEB = 'web',
  MOBILE = 'mobile',
  MANUAL = 'manual',
  INTEGRATION = 'integration',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  WITHDRAWN = 'withdrawn',
}

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  FINALIZED = 'finalized',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum JobStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  ON_HOLD = 'on_hold',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  FILLED = 'filled',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  PRINCIPAL = 'principal',
  EXECUTIVE = 'executive',
}

export enum CandidateSource {
  CAREER_PAGE = 'career_page',
  LINKEDIN = 'linkedin',
  INDEED = 'indeed',
  REFERRAL = 'referral',
  AGENCY = 'agency',
  DIRECT = 'direct',
  AI_SOURCED = 'ai_sourced',
  OTHER = 'other',
}

export enum CandidateStage {
  APPLIED = 'applied',
  SCREENING = 'screening',
  PHONE_SCREEN = 'phone_screen',
  TECHNICAL = 'technical',
  ONSITE = 'onsite',
  FINAL = 'final',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum CandidateStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  REJECTED = 'rejected',
  HIRED = 'hired',
  WITHDRAWN = 'withdrawn',
}

export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  AT_RISK = 'at_risk',
  ON_TRACK = 'on_track',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ReviewType {
  SELF = 'self',
  MANAGER = 'manager',
  PEER = 'peer',
  DIRECT_REPORT = 'direct_report',
  EXTERNAL = 'external',
}

export enum ReviewStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  CALIBRATED = 'calibrated',
  FINALIZED = 'finalized',
}

export enum NotificationType {
  LEAVE_REQUEST = 'leave_request',
  LEAVE_APPROVED = 'leave_approved',
  LEAVE_REJECTED = 'leave_rejected',
  ATTENDANCE_ALERT = 'attendance_alert',
  PAYSLIP_GENERATED = 'payslip_generated',
  PERFORMANCE_REVIEW = 'performance_review',
  GOAL_UPDATE = 'goal_update',
  ONBOARDING_TASK = 'onboarding_task',
  APPROVAL_REQUIRED = 'approval_required',
  SYSTEM_ALERT = 'system_alert',
  ANNOUNCEMENT = 'announcement',
  CHAT_MESSAGE = 'chat_message',
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  DOCUMENT_EXPIRY = 'document_expiry',
  GENERAL = 'general',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  SLACK = 'slack',
  TEAMS = 'teams',
}
