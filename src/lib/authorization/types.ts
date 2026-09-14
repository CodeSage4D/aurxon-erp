// AURXON Core Mathematical Authorization Model & Types
// Pure functional authorization engine: Authorize(Actor, Action, Resource, Context) -> Decision

export type ScopeLevel =
  | 'PLATFORM'
  | 'ORGANIZATION'
  | 'INSTITUTION'
  | 'BRANCH'
  | 'CLASS'
  | 'SECTION'
  | 'BATCH'
  | 'SUBJECT'
  | 'OWN'
  | 'CHILD';

export type Role =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'PRINCIPAL'
  | 'VICE_PRINCIPAL'
  | 'BRANCH_HEAD'
  | 'ACADEMIC_COORDINATOR'
  | 'EXAM_COORDINATOR'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'STUDENT'
  | 'PARENT'
  | (string & {});

export type ActionPermission = string;

export interface ResponsibilityAssignment {
  id?: string;
  responsibilityType: string; // CLASS_TEACHER, SUBJECT_TEACHER, EXAM_COORDINATOR, etc.
  title?: string;
  scopeLevel: ScopeLevel;
  scopeId?: string | null;
  classLevelId?: string | null;
  sectionId?: string | null;
  batchId?: string | null;
  subjectId?: string | null;
  branchId?: string | null;
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
  organizationId: string;
  institutionId?: string | null;
  branchId?: string | null;
  mustResetPassword?: boolean;
  isTemporaryPassword?: boolean;
  responsibilities: ResponsibilityAssignment[];
  verifiedChildIds: string[]; // For Parents: IDs of verified children
  studentProfileId?: string | null; // For Students: own student record ID
}

export interface ResourceTarget {
  type: string; // 'STUDENT' | 'ATTENDANCE' | 'EXAMINATION' | 'FEE' | 'STAFF' | 'ORGANIZATION' | 'ROLE' | 'APPROVAL'
  id?: string | null;
  organizationId: string;
  institutionId?: string | null;
  branchId?: string | null;
  classLevelId?: string | null;
  sectionId?: string | null;
  batchId?: string | null;
  subjectId?: string | null;
  ownerUserId?: string | null;
  studentId?: string | null;
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason: string;
  matchedRule?: string;
  denialCode?:
    | 'TENANT_MISMATCH'
    | 'INSTITUTION_MISMATCH'
    | 'BRANCH_MISMATCH'
    | 'OUT_OF_SCOPE'
    | 'INSUFFICIENT_ROLE_PERMISSIONS'
    | 'TEMPORAL_EXPIRED'
    | 'UNVERIFIED_CHILD_RELATION'
    | 'RESTRICTED_SENSITIVE_DATA'
    | 'SELF_APPROVAL_DISALLOWED';
  scopeRestrictions?: Record<string, any>;
  redactedFields?: string[];
}

export interface EffectivePermissionInfo {
  action: string;
  allowed: boolean;
  source: 'ROLE' | 'RESPONSIBILITY' | 'PLATFORM_SUPERADMIN' | 'NONE';
  sourceName?: string;
  applicableScope: ScopeLevel;
  isSensitive: boolean;
  requiresFourEyesApproval: boolean;
}
