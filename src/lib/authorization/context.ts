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

  // 1. Fetch user's active responsibilities
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

  // 2. Fetch Parent-Child mappings if actor is PARENT
  let verifiedChildIds: string[] = [];
  if (user.role === 'PARENT') {
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

  // 3. Fetch student profile ID if actor is STUDENT
  let studentProfileId: string | null = null;
  if (user.role === 'STUDENT') {
    try {
      const student = await prisma.student.findFirst({
        where: {
          organizationId: user.organizationId,
          email: user.email,
        },
        select: { id: true },
      });
      studentProfileId = student?.id || null;
    } catch {
      // Ignore
    }
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organizationId: user.organizationId,
    institutionId: user.institutionId,
    branchId: user.branchId,
    responsibilities,
    verifiedChildIds,
    studentProfileId,
  };
}
