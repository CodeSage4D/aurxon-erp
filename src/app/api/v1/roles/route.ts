import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSecurityActor } from '@/lib/authorization';
import { BASE_ROLE_PERMISSIONS, CANONICAL_PERMISSIONS } from '@/lib/authorization/permissions-registry';

const ROLE_METADATA: Record<string, { actorType: string; displayName: string; defaultScope: string; description: string }> = {
  SUPER_ADMIN: {
    actorType: 'PLATFORM_SUPER_ADMIN',
    displayName: 'Platform Super Admin',
    defaultScope: 'PLATFORM',
    description: 'Master platform operator with unrestricted SaaS control plane access.',
  },
  ORG_ADMIN: {
    actorType: 'LEADERSHIP',
    displayName: 'Organization Administrator',
    defaultScope: 'ORGANIZATION',
    description: 'Central educational trust or society master administrator.',
  },
  PRINCIPAL: {
    actorType: 'PRINCIPAL',
    displayName: 'School Principal / Director',
    defaultScope: 'ORGANIZATION',
    description: 'Executive campus leader with full institutional academic and financial oversight.',
  },
  VICE_PRINCIPAL: {
    actorType: 'LEADERSHIP',
    displayName: 'Vice Principal',
    defaultScope: 'INSTITUTION',
    description: 'Senior academic and operational administrator.',
  },
  SCHOOL_ADMIN: {
    actorType: 'SCHOOL_ADMIN',
    displayName: 'School Administrator',
    defaultScope: 'INSTITUTION',
    description: 'Day-to-day school administrative and operational manager.',
  },
  ACADEMIC_COORDINATOR: {
    actorType: 'ACADEMIC_COORDINATOR',
    displayName: 'Academic Coordinator',
    defaultScope: 'INSTITUTION',
    description: 'Academic sessions, curriculum, examinations, and teacher allocations.',
  },
  HOD: {
    actorType: 'LEADERSHIP',
    displayName: 'Head of Department (HOD)',
    defaultScope: 'DEPARTMENT',
    description: 'Academic leader for specific faculty department and curriculum review.',
  },
  TEACHER: {
    actorType: 'TEACHER',
    displayName: 'Teaching Faculty',
    defaultScope: 'ASSIGNED_SECTIONS',
    description: 'Classroom instructor managing assigned classes, attendance, and assessments.',
  },
  CLASS_TEACHER: {
    actorType: 'TEACHER',
    displayName: 'Class Teacher',
    defaultScope: 'ASSIGNED_SECTIONS',
    description: 'Primary classroom mentor managing section roll-call, report cards, and student leaves.',
  },
  SUBJECT_TEACHER: {
    actorType: 'TEACHER',
    displayName: 'Subject Teacher',
    defaultScope: 'ASSIGNED_SUBJECTS',
    description: 'Specialist instructor entering subject assessment marks and syllabus tracking.',
  },
  ACCOUNTANT: {
    actorType: 'ACCOUNTANT',
    displayName: 'Fee Accountant / Bursar',
    defaultScope: 'FINANCIAL',
    description: 'Student fee invoicing, payment collection, receipts, and ledger reconciliation.',
  },
  FINANCE_MANAGER: {
    actorType: 'FINANCE',
    displayName: 'Finance Manager',
    defaultScope: 'FINANCIAL',
    description: 'Institutional financial ledger, concessions, refunds, and accounting audit.',
  },
  HR_MANAGER: {
    actorType: 'HR_MANAGER',
    displayName: 'HR & Payroll Manager',
    defaultScope: 'ORGANIZATION',
    description: 'Staff onboarding, service records, biometric attendance, and salary slips.',
  },
  FRONT_OFFICE: {
    actorType: 'RECEPTIONIST',
    displayName: 'Front Office / Receptionist',
    defaultScope: 'BASIC_PROFILE',
    description: 'Visitor management, student inquiries, guardian contact, and document collection.',
  },
  PARENT: {
    actorType: 'PARENT',
    displayName: 'Parent / Guardian',
    defaultScope: 'OWN_CHILDREN',
    description: 'Self-service access restricted exclusively to linked verified children.',
  },
  STUDENT: {
    actorType: 'STUDENT',
    displayName: 'Student',
    defaultScope: 'SELF',
    description: 'Self-service access restricted strictly to own academic timetable and results.',
  },
};

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(sessionUser);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'Unauthorized security context' }, { status: 401 });
  }

  // Filter roles based on current actor's delegation authority
  const rolesList = Object.entries(BASE_ROLE_PERMISSIONS)
    .filter(([roleKey]) => {
      if (actor.role === 'SUPER_ADMIN') return true;
      if (roleKey === 'SUPER_ADMIN') return false;
      return true;
    })
    .map(([roleKey, permissions]) => {
      const meta = ROLE_METADATA[roleKey] || {
        actorType: 'STAFF',
        displayName: roleKey.replace(/_/g, ' '),
        defaultScope: 'INSTITUTION',
        description: `Operational role: ${roleKey}`,
      };

      return {
        role: roleKey,
        displayName: meta.displayName,
        actorType: meta.actorType,
        defaultScope: meta.defaultScope,
        description: meta.description,
        permissions,
      };
    });

  return NextResponse.json({
    success: true,
    roles: rolesList,
    canonicalPermissions: CANONICAL_PERMISSIONS,
  });
}
