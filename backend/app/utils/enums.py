from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    HR_MANAGER = "hr_manager"
    HR_ADMIN = "hr_manager"
    RECRUITER = "recruiter"
    TEAM_MANAGER = "team_manager"
    EMPLOYEE = "employee"
    FINANCE = "finance"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    INVITED = "invited"
    SUSPENDED = "suspended"


class CompanyStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TRIAL = "trial"
    SUSPENDED = "suspended"


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    TRIAL = "trial"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class EmploymentType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"
    FREELANCE = "freelance"
    CONSULTANT = "consultant"


class WorkMode(str, enum.Enum):
    ONSITE = "onsite"
    REMOTE = "remote"
    HYBRID = "hybrid"


class EmploymentStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    RESIGNED = "resigned"
    PROBATION = "probation"
    NOTICE_PERIOD = "notice_period"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    LATE = "late"
    HOLIDAY = "holiday"
    WEEK_OFF = "week_off"
    ON_LEAVE = "on_leave"
    WORK_FROM_HOME = "work_from_home"


class CheckInMethod(str, enum.Enum):
    MANUAL = "manual"
    MOBILE = "mobile"
    BIOMETRIC = "biometric"
    WEB = "web"
    KIOSK = "kiosk"


class LeaveType(str, enum.Enum):
    ANNUAL = "annual"
    SICK = "sick"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    CASUAL = "casual"
    COMPENSATORY = "compensatory"
    UNPAID = "unpaid"
    BEREAVEMENT = "bereavement"
    PUBLIC_HOLIDAY = "public_holiday"
    OTHER = "other"


class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class PayrollStatus(str, enum.Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    PROCESSED = "processed"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    ON_HOLD = "on_hold"


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    PAUSED = "paused"
    CLOSED = "closed"
    CANCELLED = "cancelled"
    FILLED = "filled"


class ExperienceLevel(str, enum.Enum):
    INTERN = "intern"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"
    VP = "vp"
    C_LEVEL = "c_level"


class CandidateSource(str, enum.Enum):
    LINKEDIN = "linkedin"
    NAUKRI = "naukri"
    INDEED = "indeed"
    REFERRAL = "referral"
    COMPANY_WEBSITE = "company_website"
    WALK_IN = "walk_in"
    HEADHUNTER = "headhunter"
    JOB_FAIR = "job_fair"
    OTHER = "other"


class ApplicationStatus(str, enum.Enum):
    ACTIVE = "active"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    ON_HOLD = "on_hold"


class ApplicationStage(str, enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"


class InterviewType(str, enum.Enum):
    PHONE = "phone"
    VIDEO = "video"
    ONSITE = "onsite"
    TECHNICAL = "technical"
    HR = "hr"
    PANEL = "panel"
    ASSIGNMENT = "assignment"


class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class OfferStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    REVOKED = "revoked"


class DocumentType(str, enum.Enum):
    RESUME = "resume"
    OFFER_LETTER = "offer_letter"
    APPOINTMENT_LETTER = "appointment_letter"
    ID_PROOF = "id_proof"
    ADDRESS_PROOF = "address_proof"
    EDUCATIONAL_CERTIFICATE = "educational_certificate"
    EXPERIENCE_LETTER = "experience_letter"
    PAN_CARD = "pan_card"
    AADHAR_CARD = "aadhar_card"
    PASSPORT = "passport"
    PAYSLIP = "payslip"
    NDA = "nda"
    CONTRACT = "contract"
    OTHER = "other"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class PerformanceStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    ACKNOWLEDGED = "acknowledged"
    COMPLETED = "completed"


class ReviewPeriod(str, enum.Enum):
    Q1 = "Q1"
    Q2 = "Q2"
    Q3 = "Q3"
    Q4 = "Q4"
    ANNUAL = "annual"
    PROBATION = "probation"
    MID_YEAR = "mid_year"


class NotificationCategory(str, enum.Enum):
    SYSTEM = "system"
    ATTENDANCE = "attendance"
    LEAVE = "leave"
    PAYROLL = "payroll"
    RECRUITMENT = "recruitment"
    PERFORMANCE = "performance"
    HR = "hr"
    GENERAL = "general"


class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    VIEW = "view"
    APPROVE = "approve"
    REJECT = "reject"
    EXPORT = "export"


class AIScreeningStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


# ── Policy Engine Enums ───────────────────────────────────────────────────

class PolicyLevel(str, enum.Enum):
    GLOBAL = "global"
    COUNTRY = "country"
    STATE = "state"
    COMPANY = "company"


class SalaryComponentType(str, enum.Enum):
    EARNING = "earning"
    DEDUCTION = "deduction"
    EMPLOYER_CONTRIBUTION = "employer_contribution"
    REIMBURSEMENT = "reimbursement"
    BENEFIT = "benefit"
    TAX = "tax"


class SalaryComponentCalcType(str, enum.Enum):
    FIXED = "fixed"
    PERCENTAGE_OF_BASIC = "percentage_of_basic"
    PERCENTAGE_OF_GROSS = "percentage_of_gross"
    PERCENTAGE_OF_CTC = "percentage_of_ctc"
    FORMULA = "formula"


class ShiftType(str, enum.Enum):
    GENERAL = "general"
    MORNING = "morning"
    AFTERNOON = "afternoon"
    NIGHT = "night"
    ROTATIONAL = "rotational"
    FLEXIBLE = "flexible"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"


class BranchType(str, enum.Enum):
    HEADQUARTERS = "headquarters"
    BRANCH = "branch"
    REGIONAL_OFFICE = "regional_office"
    REMOTE = "remote"


class AccrualFrequency(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"
    UPFRONT = "upfront"


class PayrollCycle(str, enum.Enum):
    MONTHLY = "monthly"
    BI_WEEKLY = "bi_weekly"
    WEEKLY = "weekly"
    SEMI_MONTHLY = "semi_monthly"


class TelegramCommandType(str, enum.Enum):
    CLOCK_IN = "clock_in"
    CLOCK_OUT = "clock_out"
    LEAVE_BALANCE = "leave_balance"
    APPLY_LEAVE = "apply_leave"
    APPROVE_LEAVE = "approve_leave"
    PAYSLIP = "payslip"
    ATTENDANCE = "attendance"
    ANNOUNCEMENT = "announcement"
    HELP = "help"


# ── Business ID prefixes ───────────────────────────────────────────────────
BUSINESS_ID_PREFIXES: dict[str, str] = {
    "company": "COMP",
    "user": "USER",
    "employee": "EMP",
    "department": "DEPT",
    "attendance": "ATT",
    "leave_request": "LEAVE",
    "payroll_run": "PAY",
    "payroll_item": "PAYITM",
    "job_posting": "JOB",
    "candidate": "CAND",
    "application": "APP",
    "interview": "INTV",
    "offer": "OFF",
    "performance_review": "PERF",
    "document": "DOC",
    "notification": "NOTIF",
    "audit_log": "AUDIT",
    "branch": "BRN",
    "designation": "DESG",
    "shift": "SHIFT",
    "org_settings": "ORGSET",
    "leave_policy": "LPOL",
    "leave_type": "LT",
    "leave_balance": "LBAL",
    "attendance_policy": "ATTPOL",
    "salary_structure": "SALSTR",
    "salary_component": "SALCMP",
    "employee_salary": "EMPSAL",
}
