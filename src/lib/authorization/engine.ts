// AURXON Authoritative Mathematical Authorization Engine
// Pure functional authorization: Authorize(Actor, Action, Resource) -> Decision
// Enforces Tenant Scope, Institutional Scope, Branch Scope, Temporal Validity, and Four-Eyes Rules

import {
  SecurityActor,
  ResourceTarget,
  AuthorizationDecision,
  EffectivePermissionInfo,
  ScopeLevel,
  AccessLevel,
} from './types';
import {
  ACTION_DEFINITIONS,
  BASE_ROLE_PERMISSIONS,
  RESPONSIBILITY_PERMISSIONS,
  getModuleAccessLevel,
} from './permissions-registry';

export class AuthorizationError extends Error {
  statusCode: number;
  denialCode?: string;

  constructor(message: string, denialCode?: string, statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
    this.denialCode = denialCode;
  }
}

/**
 * Pure authorization decision function
 */
export function authorize(
  actor: SecurityActor,
  action: string,
  resource: ResourceTarget,
  options: { now?: Date } = {}
): AuthorizationDecision {
  const now = options.now || new Date();

  // 1. Platform Super Admin Global Bypass (restricted to platform operations)
  if (actor.role === 'SUPER_ADMIN') {
    return {
      allowed: true,
      reason: 'Unrestricted platform administrative privilege granted to SUPER_ADMIN',
      matchedRule: 'PLATFORM_SUPER_ADMIN_OVERRIDE',
    };
  }

  // 2. Strict Tenant Boundary Isolation
  if (actor.organizationId !== resource.organizationId) {
    return {
      allowed: false,
      reason: `Tenant mismatch: actor belongs to organization ${actor.organizationId} but resource belongs to ${resource.organizationId}`,
      denialCode: 'TENANT_MISMATCH',
    };
  }

  // 3. Resolve Action Definition
  const actionDef = ACTION_DEFINITIONS[action];
  const [domain] = action.split('.');

  // 4. Resolve Base Role Permissions
  const basePerms = new Set(BASE_ROLE_PERMISSIONS[actor.role] || []);

  // 5. Resolve Active Temporal Responsibilities
  const activeResponsibilities = actor.responsibilities.filter((resp) => {
    if (resp.status !== 'ACTIVE') return false;
    const from = new Date(resp.validFrom);
    if (now < from) return false;
    if (resp.validUntil && now > new Date(resp.validUntil)) return false;
    return true;
  });

  // Check if base role grants the action
  let hasRolePermission =
    basePerms.has('*') ||
    basePerms.has(action) ||
    basePerms.has(`${domain}.*`);

  // Check if any active responsibility grants the action
  const matchingResponsibilities = activeResponsibilities.filter((resp) => {
    const respPerms = new Set(RESPONSIBILITY_PERMISSIONS[resp.responsibilityType] || []);
    return respPerms.has(action) || respPerms.has('*') || respPerms.has(`${domain}.*`);
  });

  const matchedResponsibility = matchingResponsibilities[0] || null;

  if (!hasRolePermission && !matchedResponsibility) {
    return {
      allowed: false,
      reason: `Role '${actor.role}' lacks permission for action '${action}'`,
      denialCode: 'INSUFFICIENT_ROLE_PERMISSIONS',
    };
  }

  // 6. Multi-dimensional Institutional Scoping (Institution, Branch, Session, Department)
  const isElevated = actor.role === 'SUPER_ADMIN' || actor.role === 'ORG_ADMIN';

  // Institution Boundary Check
  if (!isElevated && actor.institutionId && resource.institutionId && actor.institutionId !== resource.institutionId) {
    return {
      allowed: false,
      reason: `Institution mismatch: actor belongs to '${actor.institutionId}', resource belongs to '${resource.institutionId}'`,
      denialCode: 'INSTITUTION_MISMATCH',
    };
  }

  // Branch Boundary Check
  if (!isElevated && actor.branchId && resource.branchId && actor.branchId !== resource.branchId) {
    return {
      allowed: false,
      reason: `Branch mismatch: actor belongs to branch '${actor.branchId}', resource belongs to '${resource.branchId}'`,
      denialCode: 'BRANCH_MISMATCH',
    };
  }

  // Academic Session Check
  if (!isElevated && actor.academicSessionId && resource.academicSessionId && actor.academicSessionId !== resource.academicSessionId) {
    return {
      allowed: false,
      reason: `Academic Session mismatch: actor is in session '${actor.academicSessionId}', resource is for session '${resource.academicSessionId}'`,
      denialCode: 'SESSION_MISMATCH',
    };
  }

  // Department Boundary Check (for HODs)
  if (actor.role === 'HOD' && actor.department && resource.department && actor.department !== resource.department) {
    return {
      allowed: false,
      reason: `Department mismatch: HOD of '${actor.department}' cannot review '${resource.department}'`,
      denialCode: 'DEPARTMENT_MISMATCH',
    };
  }

  // 7. Enforce Subject & Section Assignment Boundaries for Teaching Staff
  const isTeachingStaff = ['TEACHER', 'FACULTY', 'CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(actor.role);
  if (isTeachingStaff) {
    // Subject scoping: If teacher has subject assignments, restrict marks entry to assigned subjects
    const assignedSubjects = activeResponsibilities
      .filter((r) => r.scopeLevel === 'SUBJECT' && r.subjectId)
      .map((r) => r.subjectId);

    if (assignedSubjects.length > 0 && resource.subjectId && (action === 'examinations.enter_marks' || action === 'marks.enter')) {
      if (!assignedSubjects.includes(resource.subjectId)) {
        return {
          allowed: false,
          reason: `Subject Teacher is assigned to [${assignedSubjects.join(', ')}], but target is '${resource.subjectId}'`,
          denialCode: 'OUT_OF_SCOPE',
        };
      }
    }

    // Section scoping: If teacher has section assignments and performs class-level action
    const assignedSections = activeResponsibilities
      .filter((r) => (r.scopeLevel === 'SECTION' || r.responsibilityType === 'CLASS_TEACHER') && r.sectionId)
      .map((r) => r.sectionId);

    if (assignedSections.length > 0 && resource.sectionId && (action === 'attendance.correct' || action === 'leave.approve_student')) {
      if (!assignedSections.includes(resource.sectionId)) {
        return {
          allowed: false,
          reason: `Teacher is not assigned to Section '${resource.sectionId}'`,
          denialCode: 'OUT_OF_SCOPE',
        };
      }
    }
  }

  // Enforce explicit responsibility scope if matched through responsibility
  if (matchedResponsibility) {
    if (matchedResponsibility.scopeLevel === 'SECTION' && matchedResponsibility.sectionId) {
      if (resource.sectionId && resource.sectionId !== matchedResponsibility.sectionId) {
        return {
          allowed: false,
          reason: `Action requires Section scope '${matchedResponsibility.sectionId}', but resource is in Section '${resource.sectionId}'`,
          denialCode: 'OUT_OF_SCOPE',
        };
      }
    }

    if (matchedResponsibility.scopeLevel === 'CLASS' && matchedResponsibility.classLevelId) {
      if (resource.classLevelId && resource.classLevelId !== matchedResponsibility.classLevelId) {
        return {
          allowed: false,
          reason: `Action requires Class scope '${matchedResponsibility.classLevelId}', but resource is in Class '${resource.classLevelId}'`,
          denialCode: 'OUT_OF_SCOPE',
        };
      }
    }

    if (matchedResponsibility.scopeLevel === 'SUBJECT' && matchedResponsibility.subjectId) {
      if (resource.subjectId && resource.subjectId !== matchedResponsibility.subjectId) {
        return {
          allowed: false,
          reason: `Action requires Subject scope '${matchedResponsibility.subjectId}', but resource is for Subject '${resource.subjectId}'`,
          denialCode: 'OUT_OF_SCOPE',
        };
      }
    }
  }

  // 8. Parent & Student Self-Service Constraints
  // Parent: strictly bound to verified children
  if (actor.role === 'PARENT') {
    if (action.endsWith('_own') || resource.type === 'STUDENT' || resource.type === 'ATTENDANCE' || resource.type === 'FEE' || resource.type === 'EXAMINATION' || resource.type === 'LEAVE') {
      if (resource.studentId && !actor.verifiedChildIds.includes(resource.studentId)) {
        return {
          allowed: false,
          reason: `Parent has no verified relationship with student '${resource.studentId}'`,
          denialCode: 'UNVERIFIED_CHILD_RELATION',
        };
      }
    }
  }

  // Student: strictly bound to self
  if (actor.role === 'STUDENT') {
    if (resource.studentId && actor.studentProfileId && resource.studentId !== actor.studentProfileId) {
      return {
        allowed: false,
        reason: 'Students cannot access other student academic records',
        denialCode: 'OUT_OF_SCOPE',
      };
    }
  }

  // Class Monitor (CR): explicitly barred from official marks and attendance edits
  const isCR = actor.role === 'CLASS_MONITOR' || activeResponsibilities.some((r) => r.responsibilityType === 'CLASS_MONITOR');
  if (isCR && (
    action === 'attendance.mark' ||
    action === 'attendance.correct' ||
    action === 'attendance.approve' ||
    action === 'examinations.enter_marks' ||
    action === 'examinations.create' ||
    action === 'examinations.publish' ||
    action.startsWith('fees.') ||
    action.startsWith('staff.') ||
    action.startsWith('roles.') ||
    action.startsWith('approvals.')
  )) {
    return {
      allowed: false,
      reason: 'Class Monitor (CR) is strictly advisory and cannot modify official student or financial records',
      denialCode: 'INSUFFICIENT_ROLE_PERMISSIONS',
    };
  }

  // 9. Sensitive HR Data Redaction
  let redactedFields: string[] | undefined;
  if (resource.type === 'STAFF') {
    const canViewSensitiveHR = basePerms.has('staff.view_sensitive_hr') || actor.role === 'ORG_ADMIN' || actor.role === 'HR_MANAGER';
    if (!canViewSensitiveHR) {
      redactedFields = [
        'basicSalary',
        'bankName',
        'bankAccountNumber',
        'bankIfsc',
        'panNumber',
        'aadhaarNumber',
      ];
    }
  }

  return {
    allowed: true,
    reason: matchedResponsibility
      ? `Action '${action}' granted via active responsibility '${matchedResponsibility.responsibilityType}' (${matchedResponsibility.title})`
      : `Action '${action}' granted via base functional role '${actor.role}'`,
    matchedRule: matchedResponsibility ? `RESPONSIBILITY:${matchedResponsibility.responsibilityType}` : `ROLE:${actor.role}`,
    redactedFields,
  };
}

/**
 * Assertion utility - throws AuthorizationError if not allowed
 */
export function assertCan(
  actor: SecurityActor,
  action: string,
  resource: ResourceTarget,
  options?: { now?: Date }
): void {
  const decision = authorize(actor, action, resource, options);
  if (!decision.allowed) {
    throw new AuthorizationError(decision.reason, decision.denialCode, 403);
  }
}

/**
 * Explainability Engine: "Why can I?" / "Why can't I?"
 */
export function explainAccess(
  actor: SecurityActor,
  action: string,
  resource: ResourceTarget,
  options?: { now?: Date }
): {
  decision: AuthorizationDecision;
  actorSummary: {
    name: string;
    role: string;
    organizationId: string;
    institutionId?: string | null;
    branchId?: string | null;
    activeResponsibilities: Array<{ type: string; title: string; scope: string }>;
  };
  resourceSummary: {
    type: string;
    organizationId: string;
    institutionId?: string | null;
    branchId?: string | null;
    sectionId?: string | null;
  };
  auditExplanation: string;
} {
  const decision = authorize(actor, action, resource, options);

  const activeRespSummaries = actor.responsibilities.map((r) => ({
    type: r.responsibilityType,
    title: r.title || r.responsibilityType,
    scope: `${r.scopeLevel}:${r.sectionId || r.classLevelId || r.branchId || r.scopeId || 'ALL'}`,
  }));

  let auditExplanation = '';
  if (decision.allowed) {
    auditExplanation = `ALLOW: User '${actor.firstName} ${actor.lastName}' (${actor.role}) authorized for '${action}' on ${resource.type}. Rationale: ${decision.reason}`;
  } else {
    auditExplanation = `DENY: User '${actor.firstName} ${actor.lastName}' (${actor.role}) prohibited from '${action}' on ${resource.type}. Code: ${decision.denialCode}. Rationale: ${decision.reason}`;
  }

  return {
    decision,
    actorSummary: {
      name: `${actor.firstName} ${actor.lastName}`,
      role: actor.role,
      organizationId: actor.organizationId,
      institutionId: actor.institutionId,
      branchId: actor.branchId,
      activeResponsibilities: activeRespSummaries,
    },
    resourceSummary: {
      type: resource.type,
      organizationId: resource.organizationId,
      institutionId: resource.institutionId,
      branchId: resource.branchId,
      sectionId: resource.sectionId,
    },
    auditExplanation,
  };
}

/**
 * Get full effective permission matrix for an actor
 */
export function getEffectivePermissions(actor: SecurityActor): EffectivePermissionInfo[] {
  if (actor.role === 'SUPER_ADMIN') {
    return Object.keys(ACTION_DEFINITIONS).map((action) => ({
      action,
      allowed: true,
      accessLevel: 'FINALIZE' as const,
      source: 'PLATFORM_SUPERADMIN' as const,
      applicableScope: 'PLATFORM' as const,
      isSensitive: ACTION_DEFINITIONS[action]?.isSensitive || false,
      requiresFourEyesApproval: false,
    }));
  }

  const basePerms = new Set(BASE_ROLE_PERMISSIONS[actor.role] || []);
  const activeResponsibilities = actor.responsibilities.filter((r) => r.status === 'ACTIVE');

  return Object.values(ACTION_DEFINITIONS).map((def) => {
    let allowed = basePerms.has('*') || basePerms.has(def.action);
    let source: 'ROLE' | 'RESPONSIBILITY' | 'NONE' = allowed ? 'ROLE' : 'NONE';
    let sourceName: string | undefined = allowed ? actor.role : undefined;

    if (!allowed) {
      for (const resp of activeResponsibilities) {
        const respPerms = new Set(RESPONSIBILITY_PERMISSIONS[resp.responsibilityType] || []);
        if (respPerms.has('*') || respPerms.has(def.action)) {
          allowed = true;
          source = 'RESPONSIBILITY';
          sourceName = resp.responsibilityType;
          break;
        }
      }
    }

    return {
      action: def.action,
      allowed,
      accessLevel: allowed ? (def.isSensitive ? 'VIEW_SENSITIVE' : 'EDIT') : 'NONE',
      source,
      sourceName,
      applicableScope: def.defaultScope,
      isSensitive: def.isSensitive,
      requiresFourEyesApproval: def.requiresFourEyesApproval,
    };
  });
}

/**
 * Redacts confidential HR fields from a staff record if actor lacks sensitive permissions
 */
export function sanitizeStaffRecord<T extends Record<string, any>>(
  staff: T,
  actorOrCanView: SecurityActor | boolean
): T {
  const canViewSensitive =
    typeof actorOrCanView === 'boolean'
      ? actorOrCanView
      : (
          actorOrCanView.role === 'SUPER_ADMIN' ||
          actorOrCanView.role === 'ORG_ADMIN' ||
          actorOrCanView.role === 'PRINCIPAL' ||
          actorOrCanView.role === 'HR_MANAGER' ||
          actorOrCanView.role === 'ACCOUNTANT' ||
          (actorOrCanView.id && staff.userId === actorOrCanView.id)
        );

  if (canViewSensitive) {
    return staff;
  }

  const sanitized = { ...staff };
  delete sanitized.basicSalary;
  delete sanitized.bankName;
  delete sanitized.bankAccountNumber;
  delete sanitized.bankIfsc;
  delete sanitized.panNumber;
  delete sanitized.aadhaarNumber;
  return sanitized;
}

/**
 * Validates that core school ERP records cannot be hard deleted casually.
 * Enforces corrections, voids, cancellations, or archives with audit trails.
 */
export function assertNoHardDelete(resourceType: string, action: string): void {
  const protectedTypes = [
    'STUDENT',
    'ATTENDANCE',
    'EXAMINATION',
    'MARKS',
    'FEE',
    'STAFF',
    'LEAVE',
    'AUDIT',
  ];
  const deleteActions = ['delete', 'remove', 'hard_delete', 'destroy', 'purge'];
  if (
    protectedTypes.includes(resourceType.toUpperCase()) &&
    deleteActions.includes(action.toLowerCase())
  ) {
    throw new AuthorizationError(
      `Hard delete prohibited for core entity '${resourceType}'. School ERP integrity requires correction, void, cancellation, or archiving with an audit trail.`,
      'HARD_DELETE_PROHIBITED',
      400
    );
  }
}

/**
 * Resolves standard effective AccessLevel for an actor in a module
 */
export function evaluateAccessLevel(
  actor: SecurityActor,
  moduleName: string
): AccessLevel {
  if (actor.role === 'SUPER_ADMIN') return 'FINALIZE';
  return getModuleAccessLevel(actor.role, moduleName);
}

