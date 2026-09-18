// AURXON Query Scoper Service
// Enforces Organization, Branch, Class, Section, Parent-Child, and Self Database Scoping
import { SecurityActor } from './types';

/**
 * Builds Prisma where clause for Student queries based on actor scope and verified relationships
 */
export function getScopedStudentQuery(
  actor: SecurityActor,
  additionalWhere: Record<string, any> = {}
): Record<string, any> {
  const where: Record<string, any> = {
    organizationId: actor.organizationId,
    ...additionalWhere,
  };

  // 1. Platform Super Admin can query across or within specified organization
  if (actor.role === 'SUPER_ADMIN') {
    if (additionalWhere.organizationId) {
      where.organizationId = additionalWhere.organizationId;
    } else {
      delete where.organizationId;
    }
    return where;
  }

  // 2. Parent: strictly bound to verified children
  if (actor.role === 'PARENT' || actor.actorType === 'PARENT' || actor.scope === 'OWN_CHILDREN') {
    const childIds = actor.verifiedChildIds || [];
    where.id = { in: childIds.length > 0 ? childIds : ['__NO_VERIFIED_CHILDREN__'] };
    return where;
  }

  // 3. Student: strictly bound to self
  if (actor.role === 'STUDENT' || actor.actorType === 'STUDENT' || actor.scope === 'SELF') {
    const ownId = actor.studentProfileId;
    where.id = ownId || '__NO_STUDENT_PROFILE__';
    return where;
  }

  // 4. Teaching staff: scoped to assigned sections or batches
  const isTeacher =
    actor.role === 'TEACHER' ||
    actor.role === 'FACULTY' ||
    actor.role === 'CLASS_TEACHER' ||
    actor.role === 'SUBJECT_TEACHER' ||
    actor.actorType === 'TEACHER' ||
    actor.scope === 'ASSIGNED_SECTIONS' ||
    actor.scope === 'ASSIGNED_CLASSES';

  if (isTeacher) {
    const sectionIds = actor.assignedSectionIds || [];
    const classIds = actor.assignedClassIds || [];

    // Extract sectionIds and classIds from active responsibilities as well
    const respSectionIds = actor.responsibilities
      .filter((r) => r.status === 'ACTIVE' && r.sectionId)
      .map((r) => r.sectionId as string);

    const respClassIds = actor.responsibilities
      .filter((r) => r.status === 'ACTIVE' && r.classLevelId)
      .map((r) => r.classLevelId as string);

    const allSectionIds = Array.from(new Set([...sectionIds, ...respSectionIds]));
    const allClassIds = Array.from(new Set([...classIds, ...respClassIds]));

    const orConditions: any[] = [];
    if (allSectionIds.length > 0) {
      orConditions.push({ sectionId: { in: allSectionIds } });
    }
    if (allClassIds.length > 0) {
      orConditions.push({ section: { classLevelId: { in: allClassIds } } });
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    } else {
      // Teacher with no assignments has empty student scope
      where.id = '__NO_ASSIGNED_STUDENTS__';
    }

    return where;
  }

  // 5. Branch Head: scoped to branch
  if (actor.role === 'BRANCH_HEAD' && actor.branchId) {
    where.branchId = actor.branchId;
    return where;
  }

  // 6. Institutional Leadership / Admin (Principal, Org Admin, School Admin):
  // Scope by institution if actor has institutionId
  if (actor.institutionId) {
    where.institutionId = actor.institutionId;
  }

  return where;
}

/**
 * Builds Prisma where clause for AttendanceRecord queries
 */
export function getScopedAttendanceQuery(
  actor: SecurityActor,
  additionalWhere: Record<string, any> = {}
): Record<string, any> {
  const where: Record<string, any> = {
    organizationId: actor.organizationId,
    ...additionalWhere,
  };

  if (actor.role === 'SUPER_ADMIN') {
    delete where.organizationId;
    return where;
  }

  // Parent: only attendance of verified children
  if (actor.role === 'PARENT' || actor.actorType === 'PARENT' || actor.scope === 'OWN_CHILDREN') {
    const childIds = actor.verifiedChildIds || [];
    where.studentId = { in: childIds.length > 0 ? childIds : ['__NO_VERIFIED_CHILDREN__'] };
    return where;
  }

  // Student: only self attendance
  if (actor.role === 'STUDENT' || actor.actorType === 'STUDENT' || actor.scope === 'SELF') {
    where.studentId = actor.studentProfileId || '__NO_STUDENT_PROFILE__';
    return where;
  }

  // Teacher: only assigned sections
  const isTeacher =
    actor.role === 'TEACHER' ||
    actor.role === 'FACULTY' ||
    actor.role === 'CLASS_TEACHER' ||
    actor.role === 'SUBJECT_TEACHER' ||
    actor.actorType === 'TEACHER';

  if (isTeacher) {
    const sectionIds = actor.assignedSectionIds || [];
    const respSectionIds = actor.responsibilities
      .filter((r) => r.status === 'ACTIVE' && r.sectionId)
      .map((r) => r.sectionId as string);

    const allSectionIds = Array.from(new Set([...sectionIds, ...respSectionIds]));
    if (allSectionIds.length > 0) {
      where.sectionId = { in: allSectionIds };
    } else {
      where.id = '__NO_ASSIGNED_SECTIONS__';
    }
    return where;
  }

  if (actor.institutionId) {
    where.institutionId = actor.institutionId;
  }

  return where;
}

/**
 * Builds Prisma where clause for StudentFeeAllocation queries
 */
export function getScopedFeeQuery(
  actor: SecurityActor,
  additionalWhere: Record<string, any> = {}
): Record<string, any> {
  const where: Record<string, any> = {
    organizationId: actor.organizationId,
    ...additionalWhere,
  };

  if (actor.role === 'SUPER_ADMIN') {
    delete where.organizationId;
    return where;
  }

  // Parent: only fees of verified children
  if (actor.role === 'PARENT' || actor.actorType === 'PARENT' || actor.scope === 'OWN_CHILDREN') {
    const childIds = actor.verifiedChildIds || [];
    where.studentId = { in: childIds.length > 0 ? childIds : ['__NO_VERIFIED_CHILDREN__'] };
    return where;
  }

  // Student: only self fees
  if (actor.role === 'STUDENT' || actor.actorType === 'STUDENT' || actor.scope === 'SELF') {
    where.studentId = actor.studentProfileId || '__NO_STUDENT_PROFILE__';
    return where;
  }

  // Institutional fee managers / Principal / Admin
  if (actor.institutionId) {
    where.institutionId = actor.institutionId;
  }

  return where;
}

/**
 * Builds Prisma where clause for StaffProfile queries
 */
export function getScopedStaffQuery(
  actor: SecurityActor,
  additionalWhere: Record<string, any> = {}
): Record<string, any> {
  const where: Record<string, any> = {
    organizationId: actor.organizationId,
    ...additionalWhere,
  };

  if (actor.role === 'SUPER_ADMIN') {
    delete where.organizationId;
    return where;
  }

  if (actor.institutionId) {
    where.institutionId = actor.institutionId;
  }

  // Branch Head
  if (actor.role === 'BRANCH_HEAD' && actor.branchId) {
    where.branchId = actor.branchId;
  }

  return where;
}
