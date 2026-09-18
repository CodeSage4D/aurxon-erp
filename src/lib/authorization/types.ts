// AURXON Core Mathematical Authorization Model & Types
// Pure functional authorization engine: Authorize(Actor, Action, Resource, Context) -> Decision

export type ScopeLevel =
  | 'PLATFORM'
  | 'ORGANIZATION'
  | 'INSTITUTION'
  | 'BRANCH'
  | 'DEPARTMENT'
  | 'ACADEMIC_SESSION'
  | 'CLASS'
  | 'SECTION'
  | 'BATCH'
  | 'SUBJECT'
  | 'OWN'
  | 'CHILD'
  | 'ASSIGNED_CLASSES'
  | 'ASSIGNED_SECTIONS'
  | 'ASSIGNED_SUBJECTS'
  | 'OWN_CHILDREN'
  | 'SELF'
  | 'OWN_RECORDS'
  | 'BASIC_PROFILE'
  | 'FINANCIAL'
  | 'RESTRICTED'
  | 'NONE';

export type ActorType =
  | 'PLATFORM_SUPER_ADMIN'
  | 'PLATFORM_SUPPORT'
  | 'PRINCIPAL'
  | 'SCHOOL_ADMIN'
  | 'ACADEMIC_COORDINATOR'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'RECEPTIONIST'
  | 'PARENT'
  | 'STUDENT'
  | 'STAFF'
  | (string & {});

export type DataSensitivity =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'HIGHLY_SENSITIVE';

export type RoleCategory =
  | 'LEADERSHIP'
  | 'ADMINISTRATION'
  | 'ACADEMIC'
  | 'FINANCE_OPERATIONS'
  | 'END_USER';

export type Role =
  // Platform & Super
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  // Leadership
  | 'PRINCIPAL'
  | 'VICE_PRINCIPAL'
  | 'DIRECTOR'
  | 'HEAD_OF_SCHOOL'
  | 'BRANCH_HEAD'
  | 'ACADEMIC_COORDINATOR'
  | 'EXAM_COORDINATOR'
  | 'DISCIPLINE_COORDINATOR'
  | 'HOD'
  // Administration
  | 'SCHOOL_ADMIN'
  | 'FRONT_OFFICE'
  | 'ADMISSION_COUNSELLOR'
  | 'HR_MANAGER'
  | 'HR_OFFICER'
  | 'IT_ADMIN'
  // Academic
  | 'TEACHER'
  | 'FACULTY'
  | 'CLASS_TEACHER'
  | 'SUBJECT_TEACHER'
  | 'SPECIAL_EDUCATOR'
  | 'COUNSELLOR'
  | 'LIBRARIAN'
  | 'LAB_ASSISTANT'
  | 'SPORTS_COORDINATOR'
  // Finance / Operations
  | 'ACCOUNTANT'
  | 'FINANCE_MANAGER'
  | 'FEE_COLLECTOR'
  | 'TRANSPORT_MANAGER'
  | 'TRANSPORT_COORDINATOR'
  // End Users
  | 'PARENT'
  | 'STUDENT'
  | 'CLASS_MONITOR' // CR
  | (string & {});

export type AccessLevel =
  | 'NONE'
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'SUBMIT'
  | 'REVIEW'
  | 'APPROVE'
  | 'PUBLISH'
  | 'EXPORT'
  | 'ARCHIVE'
  | 'VIEW_SENSITIVE'
  | 'FINALIZE';

export type ActionPermission = string;

export interface ResponsibilityAssignment {
  id?: string;
  responsibilityType: string; // CLASS_TEACHER, SUBJECT_TEACHER, EXAM_COORDINATOR, HOD, DISCIPLINE_COMMITTEE, CLASS_MONITOR
  title?: string;
  scopeLevel: ScopeLevel;
  scopeId?: string | null;
  department?: string | null;
  classLevelId?: string | null;
  sectionId?: string | null;
  batchId?: string | null;
  subjectId?: string | null;
  branchId?: string | null;
  academicSessionId?: string | null;
  validFrom: Date | string;
  validUntil?: Date | string | null;
  isTemporary?: boolean;
  status: string;
}

export interface SecurityActor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  actorType?: string | null;
  scope?: string | null;
  status?: string;
  organizationId: string;
  institutionId?: string | null;
  branchId?: string | null;
  department?: string | null;
  academicSessionId?: string | null;
  mustResetPassword?: boolean;
  isTemporaryPassword?: boolean;
  responsibilities: ResponsibilityAssignment[];
  verifiedChildIds: string[]; // For Parents: IDs of verified children
  studentProfileId?: string | null; // For Students: own student record ID
  assignedClassIds?: string[];
  assignedSectionIds?: string[];
  assignedSubjectIds?: string[];
  customPermissions?: Record<string, boolean>; // Overrides: permission -> granted
}

export interface ResourceTarget {
  type: string; // 'STUDENT' | 'ATTENDANCE' | 'EXAMINATION' | 'FEE' | 'STAFF' | 'ORGANIZATION' | 'ROLE' | 'APPROVAL' | 'LEAVE'
  id?: string | null;
  organizationId: string;
  institutionId?: string | null;
  branchId?: string | null;
  department?: string | null;
  academicSessionId?: string | null;
  classLevelId?: string | null;
  sectionId?: string | null;
  batchId?: string | null;
  subjectId?: string | null;
  ownerUserId?: string | null;
  studentId?: string | null;
  staffId?: string | null;
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason: string;
  accessLevel?: AccessLevel;
  matchedRule?: string;
  denialCode?:
    | 'TENANT_MISMATCH'
    | 'INSTITUTION_MISMATCH'
    | 'BRANCH_MISMATCH'
    | 'SESSION_MISMATCH'
    | 'DEPARTMENT_MISMATCH'
    | 'OUT_OF_SCOPE'
    | 'INSUFFICIENT_ROLE_PERMISSIONS'
    | 'TEMPORAL_EXPIRED'
    | 'UNVERIFIED_CHILD_RELATION'
    | 'RESTRICTED_SENSITIVE_DATA'
    | 'SELF_APPROVAL_DISALLOWED'
    | 'HARD_DELETE_PROHIBITED';
  scopeRestrictions?: Record<string, any>;
  redactedFields?: string[];
}

export interface EffectivePermissionInfo {
  action: string;
  allowed: boolean;
  accessLevel: AccessLevel;
  source: 'ROLE' | 'RESPONSIBILITY' | 'PLATFORM_SUPERADMIN' | 'CUSTOM' | 'NONE';
  sourceName?: string;
  applicableScope: ScopeLevel;
  isSensitive: boolean;
  requiresFourEyesApproval: boolean;
}

// --- LEAVE MANAGEMENT TYPES ---
export type LeaveType =
  | 'CASUAL'
  | 'SICK'
  | 'EARNED'
  | 'PRIVILEGE'
  | 'HALF_DAY'
  | 'EMERGENCY'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'UNPAID'
  | 'SPECIAL'
  | 'DUTY';

export type StudentLeaveType =
  | 'SICK'
  | 'MEDICAL'
  | 'CASUAL'
  | 'FAMILY_EMERGENCY'
  | 'PLANNED_ABSENCE'
  | 'BEREAVEMENT';

export type LeaveStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'WITHDRAWN';

export interface LeaveBalanceInfo {
  leaveType: LeaveType;
  totalAllocated: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export interface AcademicImpactSlot {
  dayOfWeek: number;
  periodNumber: number;
  className: string;
  sectionName: string;
  subjectName: string;
  subjectId: string;
  date: string;
}

export interface SubstituteTeacherCandidate {
  staffId: string;
  fullName: string;
  designation: string;
  department: string;
  subjectSpecialization: string[];
  branchId?: string;
  matchScore: number; // 0-100
  isFreeDuringPeriod: boolean;
  currentWeeklyLoad: number;
  recommendedReason: string;
}

export interface LeaveValidationResult {
  valid: boolean;
  reasons: string[];
  warnings: string[];
  hasSufficientBalance: boolean;
  hasOverlap: boolean;
  hasExamConflict?: boolean;
  examConflictDetails?: string;
  requiresSupportingDoc: boolean;
  isNoticePeriodMet: boolean;
  recommendedApprovalRoute: string[]; // e.g. ['COORDINATOR', 'HOD', 'VICE_PRINCIPAL', 'PRINCIPAL']
  academicImpact: AcademicImpactSlot[];
  suggestedSubstitutes: SubstituteTeacherCandidate[];
}

// --- DECISION & APPROVAL WORKFLOW TYPES ---
export type WorkflowType =
  | 'FEE_CONCESSION'
  | 'FEE_REFUND'
  | 'FEE_ADJUSTMENT'
  | 'EXAM_PUBLICATION'
  | 'STAFF_LEAVE'
  | 'STUDENT_LEAVE'
  | 'ATTENDANCE_CORRECTION'
  | 'STAFF_TRANSFER'
  | 'ROLE_CHANGE';

export interface WorkflowStepRecord {
  stepName: string;
  requiredRole: Role[];
  assignedUserId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  actedByUserId?: string;
  actedByUserName?: string;
  actedAt?: string;
  remarks?: string;
}
