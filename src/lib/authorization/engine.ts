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
  matchesPermission,
  toCanonicalPermission,
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
  if (actor.role === 'SUPER_ADMIN' || actor.actorType === 'PLATFORM_SUPER_ADMIN') {
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

  // 3. User account status check: Fail closed if inactive/suspended
  if (actor.status && actor.status !== 'ACTIVE') {
    return {
      allowed: false,
      reason: `User account is ${actor.status.toLowerCase()}`,
      denialCode: 'INSUFFICIENT_ROLE_PERMISSIONS',
    };
  }

  // 4. Resolve Base Role Permissions
  const basePerms = new Set(BASE_ROLE_PERMISSIONS[actor.role] || []);

  // 5. Check User Custom Permission Overrides (Explicit User Grants / Denials)
  let customDenied = false;
  let customGranted = false;
  if (actor.customPermissions) {
    for (const [perm, granted] of Object.entries(actor.customPermissions)) {
      if (matchesPermission(perm, action)) {
        if (!granted) {
          customDenied = true;
          break;
        } else {
          customGranted = true;
        }
      }
    }
  }

  if (customDenied) {
    return {
      allowed: false,
      reason: `Action '${action}' explicitly denied via user permission override`,
      denialCode: 'INSUFFICIENT_ROLE_PERMISSIONS',
    };
  }

  // 6. Check if base role grants the action
  let hasRolePermission = customGranted || basePerms.has('*');
  if (!hasRolePermission) {
    for (const p of basePerms) {
      if (matchesPermission(p, action)) {
        hasRolePermission = true;
        break;
      }
    }
  }

  // 7. Resolve Active Temporal Responsibilities
  const activeResponsibilities = actor.responsibilities.filter((resp) => {
    if (resp.status !== 'ACTIVE') return false;
    const from = new Date(resp.validFrom);
    if (now < from) return false;
    if (resp.validUntil && now > new Date(resp.validUntil)) return false;
    return true;
  });

  const matchingResponsibilities = activeResponsibilities.filter((resp) => {
    const respPerms = RESPONSIBILITY_PERMISSIONS[resp.responsibilityType] || [];
    return respPerms.some((p) => matchesPermission(p, action));
  });

  const matchedResponsibility = matchingResponsibilities[0] || null;

  // 8. Strict Financial vs Payroll Separation
  const isPayrollAction =
    action.startsWith('payroll.') ||
    action === 'staff.view_sensitive_hr';

  if (isPayrollAction) {
    const isAccountant = actor.role === 'ACCOUNTANT' || actor.actorType === 'ACCOUNTANT';
    const isTeacher = actor.role === 'TEACHER' || actor.role === 'FACULTY' || actor.actorType === 'TEACHER';
    const isEndUser = actor.role === 'PARENT' || actor.role === 'STUDENT' || actor.actorType === 'PARENT' || actor.actorType === 'STUDENT';

    if (isAccountant || isTeacher || isEndUser) {
      return {
        allowed: false,
        reason: `Role '${actor.role}' is strictly prohibited from accessing staff payroll or confidential salary data`,
        denialCode: 'INSUFFICIENT_ROLE_PERMISSIONS',
      };
    }
  }

  // 9. Reception / Front Desk Data Minimization
  const isReception = actor.role === 'FRONT_OFFICE' || actor.actorType === 'RECEPTIONIST';
  if (isReception) {
    const restrictedForReception =
      action === 'students.view_sensitive' ||
      action.startsWith('payroll.') ||
      action.startsWith('staff.') ||
      action.startsWith('roles.') ||
      action.startsWith('settings.');

    if (restrictedForReception) {
      return {
        allowed: false,
        reason: 'Reception / Front Desk is restricted to basic student profile and front-office inquiry records',
        denialCode: 'RESTRICTED_SENSITIVE_DATA',
      };
    }
  }

  if (!hasRolePermission && !matchedResponsibility) {
    return {
      allowed: false,
      reason: `Role '${actor.role}' lacks permission for action '${action}'`,
      denialCode: 'INSUFFICIENT_ROLE_PERMISSIONS',
    };
  }

  // 10. Multi-dimensional Institutional Scoping (Institution, Branch, Session, Department)
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

  // 11. Enforce Subject & Section Assignment Boundaries for Teaching Staff
  const isTeachingStaff =
    ['TEACHER', 'FACULTY', 'CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(actor.role) ||
    actor.actorType === 'TEACHER';

  if (isTeachingStaff) {
    const assignedSubjects = Array.from(new Set([
      ...(actor.assignedSubjectIds || []),
      ...activeResponsibilities
        .filter((r) => r.scopeLevel === 'SUBJECT' && r.subjectId)
        .map((r) => r.subjectId as string),
    ]));

    if (assignedSubjects.length > 0 && resource.subjectId && (action.includes('marks') || action.includes('result'))) {
      if (!assignedSubjects.includes(resource.subjectId)) {
        return {
          allowed: false,
          reason: `Subject Teacher is assigned to [${assignedSubjects.join(', ')}], but target is '${resource.subjectId}'`,
          denialCode: 'OUT_OF_SCOPE',
        };
      }
    }

    const assignedSections = Array.from(new Set([
      ...(actor.assignedSectionIds || []),
      ...activeResponsibilities
        .filter((r) => (r.scopeLevel === 'SECTION' || r.responsibilityType === 'CLASS_TEACHER') && r.sectionId)
        .map((r) => r.sectionId as string),
    ]));

    if (assignedSections.length > 0 && resource.sectionId && (action === 'attendance.correct' || action === 'leave.approve_student' || action === 'attendance.mark')) {
      if (!assignedSections.includes(resource.sectionId)) {
        return {
          allowed: false,
          reason: `Teacher is not assigned to Section '${resource.sectionId}'`,
          denialCode: 'OUT_OF_SCOPE',
        };
      }
    }

    // Teacher horizontal boundary for Student records:
    // Teachers are strictly restricted to students in their assigned sections or classes
    if (
      (resource.type === 'STUDENT' || action.startsWith('student.') || action.startsWith('students.')) &&
      (resource.sectionId || resource.classLevelId)
    ) {
      const assignedClassIds = actor.assignedClassIds || [];
      const hasSectionScope = assignedSections.length > 0;
      const hasClassScope = assignedClassIds.length > 0;

      if (hasSectionScope && resource.sectionId) {
        if (!assignedSections.includes(resource.sectionId)) {
          return {
            allowed: false,
            reason: `Teacher is not assigned to student's section ('${resource.sectionId}')`,
            denialCode: 'OUT_OF_SCOPE',
          };
        }
      } else if (hasClassScope && resource.classLevelId) {
        if (!assignedClassIds.includes(resource.classLevelId)) {
          return {
            allowed: false,
            reason: `Teacher is not assigned to student's class ('${resource.classLevelId}')`,
            denialCode: 'OUT_OF_SCOPE',
          };
        }
      } else if (!hasSectionScope && !hasClassScope) {
        return {
          allowed: false,
          reason: `Teacher has no active class or section assignments`,
          denialCode: 'OUT_OF_SCOPE',
        };
      }
    }
  }

  // Front Office / Receptionist Data Sensitivity Boundary
  const isFrontOffice =
    actor.role === 'FRONT_OFFICE' ||
    actor.role === 'RECEPTIONIST' ||
    actor.actorType === 'RECEPTIONIST' ||
    actor.scope === 'BASIC_PROFILE';

  if (
    isFrontOffice &&
    (action === 'students.view_sensitive' ||
      action === 'student.view_sensitive' ||
      action.includes('sensitive') ||
      action.startsWith('payroll.'))
  ) {
    return {
      allowed: false,
      reason: 'Front office and receptionist personnel are restricted to basic directory profiles and cannot access sensitive identity or payroll data',
      denialCode: 'INSUFFICIENT_ROLE_PERMISSIONS',
    };
  }

  // Enforce explicit responsibility scope only if matched solely through responsibility
  if (!hasRolePermission && matchedResponsibility) {
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

  // 12. Parent & Student Self-Service Constraints
  // Parent: strictly bound to verified children
  if (actor.role === 'PARENT' || actor.actorType === 'PARENT') {
    if (
      action.endsWith('_own') ||
      action.startsWith('student.') ||
      resource.type === 'STUDENT' ||
      resource.type === 'ATTENDANCE' ||
      resource.type === 'FEE' ||
      resource.type === 'EXAMINATION' ||
      resource.type === 'LEAVE'
    ) {
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
  if (actor.role === 'STUDENT' || actor.actorType === 'STUDENT') {
    if (!actor.studentProfileId || (resource.studentId && resource.studentId !== actor.studentProfileId)) {
      return {
        allowed: false,
        reason: 'Student account has no linked student profile or attempted access to another student record',
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
    action === 'attendance.create' ||
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

  // 13. Sensitive HR Data Redaction
  let redactedFields: string[] | undefined;
  if (resource.type === 'STAFF') {
    const canViewSensitiveHR =
      basePerms.has('staff.view_sensitive_hr') ||
      basePerms.has('payroll.read') ||
      actor.role === 'SUPER_ADMIN' ||
      actor.role === 'ORG_ADMIN' ||
      actor.role === 'HR_MANAGER';

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
      : customGranted
      ? `Action '${action}' granted via user permission override`
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
 * Enforces authorization returning the decision or throwing AuthorizationError
 */
export function enforceAuthorization(
  actor: SecurityActor,
  action: string,
  resource: ResourceTarget,
  options?: { now?: Date }
): AuthorizationDecision {
  const decision = authorize(actor, action, resource, options);
  if (!decision.allowed) {
    throw new AuthorizationError(decision.reason, decision.denialCode, 403);
  }
  return decision;
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
    let allowed = false;
    let source: 'ROLE' | 'RESPONSIBILITY' | 'CUSTOM' | 'NONE' = 'NONE';
    let sourceName: string | undefined = undefined;

    // 1. User custom permission overrides take highest precedence
    if (actor.customPermissions) {
      for (const [perm, granted] of Object.entries(actor.customPermissions)) {
        if (matchesPermission(perm, def.action)) {
          if (!granted) {
            return {
              action: def.action,
              allowed: false,
              accessLevel: 'NONE',
              source: 'CUSTOM',
              sourceName: 'USER_DENIED',
              applicableScope: def.defaultScope,
              isSensitive: def.isSensitive,
              requiresFourEyesApproval: def.requiresFourEyesApproval,
            };
          } else {
            allowed = true;
            source = 'CUSTOM';
            sourceName = 'USER_GRANTED';
          }
        }
      }
    }

    // 2. Base role permissions
    if (!allowed) {
      if (basePerms.has('*')) {
        allowed = true;
        source = 'ROLE';
        sourceName = actor.role;
      } else {
        for (const p of basePerms) {
          if (matchesPermission(p, def.action)) {
            allowed = true;
            source = 'ROLE';
            sourceName = actor.role;
            break;
          }
        }
      }
    }

    // 3. Active temporal responsibilities
    if (!allowed) {
      for (const resp of activeResponsibilities) {
        const respPerms = RESPONSIBILITY_PERMISSIONS[resp.responsibilityType] || [];
        if (respPerms.some((p) => matchesPermission(p, def.action))) {
          allowed = true;
          source = 'RESPONSIBILITY';
          sourceName = resp.responsibilityType;
          break;
        }
      }
    }

    // 4. Strict Financial vs Payroll Separation
    const isPayroll = def.action.startsWith('payroll.') || def.action === 'staff.view_sensitive_hr';
    if (isPayroll) {
      const isAccountant = actor.role === 'ACCOUNTANT' || actor.actorType === 'ACCOUNTANT';
      const isTeacher = actor.role === 'TEACHER' || actor.role === 'FACULTY' || actor.actorType === 'TEACHER';
      const isEndUser =
        actor.role === 'PARENT' ||
        actor.role === 'STUDENT' ||
        actor.actorType === 'PARENT' ||
        actor.actorType === 'STUDENT';
      if (isAccountant || isTeacher || isEndUser) {
        allowed = false;
        source = 'ROLE';
        sourceName = 'PROHIBITED';
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
 * Redacts financial and sensitive details from a student record according to actor permissions
 */
export function sanitizeStudentRecord<T extends Record<string, any>>(
  student: T,
  actor: SecurityActor
): T {
  const canViewFees =
    actor.role === 'SUPER_ADMIN' ||
    actor.role === 'ORG_ADMIN' ||
    actor.role === 'PRINCIPAL' ||
    actor.role === 'FINANCE_MANAGER' ||
    actor.role === 'ACCOUNTANT' ||
    actor.role === 'FEE_COLLECTOR' ||
    Boolean(actor.customPermissions?.['fees.view']);

  const sanitized = { ...student };
  if (!canViewFees) {
    delete (sanitized as any).feeAllocations;
    delete (sanitized as any).feePayments;
  }

  // Redact confidential parent fields for front office / receptionist
  if (actor.role === 'FRONT_OFFICE' && Array.isArray((sanitized as any).studentParents)) {
    (sanitized as any).studentParents = (sanitized as any).studentParents.map((sp: any) => {
      if (sp.parentGuardian) {
        const pg = { ...sp.parentGuardian };
        delete pg.annualIncome;
        return { ...sp, parentGuardian: pg };
      }
      return sp;
    });
  }

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

