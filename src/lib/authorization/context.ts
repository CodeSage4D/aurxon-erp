// AURXON Security Context Resolver
// Authenticates session, queries active temporal responsibilities and parent-child relations
import { getCurrentUser, AuthUser } from '../auth';
import prisma from '../prisma';
import { SecurityActor } from './types';

export async function getSecurityActor(
  providedUser?: AuthUser | null
): Promise<SecurityActor | null> {
  const user = providedUser || (await getCurrentUser());
  if (!user) return null;

  // 1. Fetch user DB record for actorType, scope, status, assignments, permissions
  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userPermissions: true,
        subjectAssignments: {
          select: {
            subjectId: true,
            sectionId: true,
            batchId: true,
          },
        },
        studentProfile: {
          select: { id: true },
        },
      },
    });
  } catch {
    // Ignore error if DB inaccessible in edge context
  }

  // If user is inactive or suspended, fail closed
  if (dbUser && dbUser.status !== 'ACTIVE') {
    return null;
  }

  // 2. Fetch user's active responsibilities
  let responsibilities: any[] = [];
  try {
    const rawResps = await prisma.staffResponsibility.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    const now = new Date();
    responsibilities = rawResps
      .filter((r) => {
        const from = new Date(r.validFrom);
        if (now < from) return false;
        if (r.validUntil && now > new Date(r.validUntil)) return false;
        return true;
      })
      .map((r) => ({
        responsibilityType: r.responsibilityType,
        scopeLevel: r.scopeLevel as any,
        scopeId: r.scopeId,
        classLevelId: r.classLevelId,
        sectionId: r.sectionId,
        batchId: r.batchId,
        subjectId: r.subjectId,
        validFrom: r.validFrom,
        validUntil: r.validUntil,
        isTemporary: r.isTemporary,
        status: r.status,
      }));
  } catch (err) {
    // Gracefully handle query if not available
  }

  // 3. Extract assigned sections, classes, and subjects from SubjectAssignment & Responsibilities
  const assignedSectionIds: string[] = [];
  const assignedClassIds: string[] = [];
  const assignedSubjectIds: string[] = [];

  if (dbUser?.subjectAssignments) {
    for (const sa of dbUser.subjectAssignments) {
      if (sa.sectionId) assignedSectionIds.push(sa.sectionId);
      if (sa.subjectId) assignedSubjectIds.push(sa.subjectId);
    }
  }

  for (const resp of responsibilities) {
    if (resp.sectionId) assignedSectionIds.push(resp.sectionId);
    if (resp.classLevelId) assignedClassIds.push(resp.classLevelId);
    if (resp.subjectId) assignedSubjectIds.push(resp.subjectId);
  }

  // 4. Custom permission overrides
  const customPermissions: Record<string, boolean> = {};
  if (dbUser?.userPermissions) {
    for (const up of dbUser.userPermissions) {
      customPermissions[up.permission] = up.granted;
    }
  }

  // 5. Fetch Parent-Child mappings if actor is PARENT
  let verifiedChildIds: string[] = [];
  if (user.role === 'PARENT' || dbUser?.actorType === 'PARENT') {
    try {
      const parentRecord = await prisma.parentGuardian.findFirst({
        where: {
          OR: [{ userId: user.id }, { email: user.email }],
        },
        include: {
          studentParents: {
            select: { studentId: true },
          },
        },
      });

      if (parentRecord?.studentParents) {
        verifiedChildIds = parentRecord.studentParents.map((sp) => sp.studentId);
      }
    } catch {
      // Ignore
    }
  }

  // 6. Fetch student profile ID if actor is STUDENT (strictly bound to userId relation)
  let studentProfileId: string | null = dbUser?.studentProfile?.id || null;
  if (!studentProfileId && (user.role === 'STUDENT' || dbUser?.actorType === 'STUDENT')) {
    try {
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      studentProfileId = student?.id || null;
    } catch {
      // Ignore
    }
  }

  // 7. Fetch staff profile department if actor is staff/faculty
  let department: string | null = null;
  try {
    const staff = await prisma.staffProfile.findFirst({
      where: { userId: user.id },
      select: { id: true, department: true, branchId: true },
    });
    if (staff) {
      department = staff.department || null;
    }
  } catch {
    // Ignore
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: dbUser?.role || user.role,
    actorType: dbUser?.actorType || null,
    scope: dbUser?.scope || null,
    status: dbUser?.status || 'ACTIVE',
    organizationId: dbUser?.organizationId || user.organizationId,
    institutionId: dbUser?.institutionId !== undefined ? dbUser.institutionId : user.institutionId,
    branchId: dbUser?.branchId !== undefined ? dbUser.branchId : user.branchId,
    department,
    responsibilities,
    verifiedChildIds,
    studentProfileId,
    assignedClassIds: Array.from(new Set(assignedClassIds)),
    assignedSectionIds: Array.from(new Set(assignedSectionIds)),
    assignedSubjectIds: Array.from(new Set(assignedSubjectIds)),
    customPermissions,
  };
}
