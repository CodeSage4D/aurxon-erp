import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { getSecurityActor, authorize } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

const createAccountSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  actorType: z.enum(['STAFF', 'TEACHER', 'PARENT', 'STUDENT', 'LEADERSHIP', 'ADMINISTRATION', 'FINANCE', 'END_USER', 'PLATFORM_SUPER_ADMIN']).default('STAFF'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  scope: z.string().default('ORGANIZATION'),
  branchId: z.string().optional().nullable(),
  institutionId: z.string().optional().nullable(),
  // Business Relationships
  teacherDetails: z.object({
    department: z.string().default('General Academics'),
    designation: z.string().default('Teacher'),
    assignedSectionIds: z.array(z.string()).default([]),
    assignedSubjectIds: z.array(z.string()).default([]),
    assignedClassIds: z.array(z.string()).default([]),
  }).optional(),
  parentDetails: z.object({
    relation: z.string().default('GUARDIAN'),
    linkedStudentIds: z.array(z.string()).default([]),
  }).optional(),
  studentDetails: z.object({
    studentId: z.string().optional().nullable(),
  }).optional(),
  staffDetails: z.object({
    department: z.string().default('Administration'),
    designation: z.string().default('Staff'),
  }).optional(),
  // Custom Permission Overrides
  customPermissions: z.array(z.object({
    permission: z.string(),
    granted: z.boolean().default(true),
  })).default([]),
});

export async function GET(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(sessionUser);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'Unauthorized security context' }, { status: 401 });
  }

  // Authorization verification
  const decision = authorize(actor, 'account.read', {
    type: 'ROLE',
    organizationId: actor.organizationId,
  });

  if (!decision.allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to view accounts' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const actorType = searchParams.get('actorType');
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId: actor.organizationId,
  };

  if (actor.institutionId && actor.role !== 'SUPER_ADMIN') {
    where.institutionId = actor.institutionId;
  }

  if (actorType && actorType !== 'ALL') {
    where.actorType = actorType;
  }

  if (role && role !== 'ALL') {
    where.role = role;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  try {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          actorType: true,
          scope: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          branch: { select: { id: true, name: true } },
          institution: { select: { id: true, name: true } },
          staffProfile: {
            select: {
              id: true,
              employeeId: true,
              department: true,
              designation: true,
            },
          },
          parentProfile: {
            select: {
              id: true,
              relation: true,
              studentParents: {
                select: {
                  student: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      admissionNumber: true,
                    },
                  },
                },
              },
            },
          },
          studentProfile: {
            select: {
              id: true,
              admissionNumber: true,
              section: { select: { name: true, classLevel: { select: { name: true } } } },
            },
          },
          subjectAssignments: {
            select: {
              subject: { select: { name: true } },
              section: { select: { name: true, classLevel: { select: { name: true } } } },
            },
          },
          userPermissions: {
            select: {
              permission: true,
              granted: true,
            },
          },
        },
      }),
    ]);

    // Format account records with human-readable scope summary
    const accounts = users.map((u) => {
      let scopeSummary = u.scope || 'ORGANIZATION';
      let linkedProfile: any = null;

      if (u.staffProfile) {
        linkedProfile = {
          type: 'STAFF',
          id: u.staffProfile.id,
          identifier: u.staffProfile.employeeId,
          details: `${u.staffProfile.designation} (${u.staffProfile.department})`,
        };
        if (u.subjectAssignments && u.subjectAssignments.length > 0) {
          const sections = Array.from(new Set(u.subjectAssignments.map((sa) => sa.section ? `${sa.section.classLevel?.name}-${sa.section.name}` : null).filter(Boolean)));
          scopeSummary = sections.length > 0 ? `Sections: ${sections.join(', ')}` : 'Assigned Classes';
        }
      } else if (u.parentProfile) {
        const children = u.parentProfile.studentParents.map((sp) => `${sp.student.firstName} ${sp.student.lastName}`);
        linkedProfile = {
          type: 'PARENT',
          id: u.parentProfile.id,
          identifier: u.parentProfile.relation,
          details: children.join(', ') || 'No linked children',
        };
        scopeSummary = `Children: ${children.length} linked`;
      } else if (u.studentProfile) {
        linkedProfile = {
          type: 'STUDENT',
          id: u.studentProfile.id,
          identifier: u.studentProfile.admissionNumber,
          details: u.studentProfile.section ? `${u.studentProfile.section.classLevel?.name}-${u.studentProfile.section.name}` : 'Enrolled Student',
        };
        scopeSummary = 'SELF (Own records)';
      }

      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        phone: u.phone,
        role: u.role,
        actorType: u.actorType || 'STAFF',
        scope: u.scope || 'ORGANIZATION',
        scopeSummary,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        institutionName: u.institution?.name,
        branchName: u.branch?.name,
        linkedProfile,
        customPermissionsCount: u.userPermissions.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[ACCOUNTS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve accounts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(sessionUser);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'Unauthorized security context' }, { status: 401 });
  }

  // Enforce account.create permission
  const decision = authorize(actor, 'account.create', {
    type: 'ROLE',
    organizationId: actor.organizationId,
  });

  if (!decision.allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to create account' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    // Privilege Escalation Protection: Role delegation hierarchy
    if (d.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Cannot create a Platform Super Admin account' }, { status: 403 });
    }
    if (d.role === 'ORG_ADMIN' && actor.role !== 'SUPER_ADMIN' && actor.role !== 'ORG_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient delegation authority to create an Organization Admin account' }, { status: 403 });
    }

    // Verify email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: d.email } });
    if (existing) {
      return NextResponse.json({ success: false, error: `An account with email '${d.email}' already exists.` }, { status: 409 });
    }

    const passwordHash = await hashPassword(d.password);

    // Resolve clean institution and branch IDs (sanitizing empty strings to null - Loop 14 & 32)
    let cleanInstitutionId = (d.institutionId && d.institutionId.trim() !== '') ? d.institutionId.trim() : (actor.institutionId || null);
    if (!cleanInstitutionId) {
      const firstInst = await prisma.institution.findFirst({ where: { organizationId: actor.organizationId } });
      cleanInstitutionId = firstInst?.id || null;
    }

    let cleanBranchId = (d.branchId && d.branchId.trim() !== '') ? d.branchId.trim() : (actor.branchId || null);
    if (cleanBranchId) {
      const validBranch = await prisma.branch.findFirst({
        where: { id: cleanBranchId, institution: { organizationId: actor.organizationId } },
      });
      if (!validBranch) {
        cleanBranchId = null;
      }
    }

    if ((d.actorType === 'TEACHER' || d.actorType === 'STAFF') && !cleanInstitutionId) {
      return NextResponse.json({ success: false, error: 'A valid Institution is required to create a Staff or Teacher account' }, { status: 400 });
    }

    // Resolve current academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: { organizationId: actor.organizationId, isCurrent: true },
    });

    // Transactional creation of User, Profile, Relationships, and Permissions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          organizationId: actor.organizationId,
          institutionId: cleanInstitutionId,
          branchId: cleanBranchId,
          email: d.email,
          passwordHash,
          firstName: d.firstName,
          lastName: d.lastName,
          phone: d.phone || null,
          role: d.role,
          actorType: d.actorType,
          scope: d.scope,
          status: d.status,
          mustResetPassword: true,
          isTemporaryPassword: true,
        },
      });

      // 2. Business Relationship: Teacher / Faculty
      if ((d.actorType === 'TEACHER' || d.role === 'TEACHER' || d.role === 'FACULTY') && d.teacherDetails) {
        const td = d.teacherDetails;
        const employeeId = `EMP-${Date.now().toString().slice(-6)}`;

        const staffProfile = await tx.staffProfile.create({
          data: {
            organizationId: actor.organizationId,
            institutionId: cleanInstitutionId!,
            branchId: cleanBranchId,
            userId: user.id,
            employeeId,
            firstName: d.firstName,
            lastName: d.lastName,
            email: d.email,
            phone: d.phone || '0000000000',
            dob: new Date('1990-01-01'),
            gender: 'OTHER',
            department: td.department,
            designation: td.designation,
            status: 'ACTIVE',
          },
        });

        // Create Subject Assignments
        if (currentSession && td.assignedSubjectIds.length > 0) {
          for (const subjectId of td.assignedSubjectIds) {
            const sectionId = td.assignedSectionIds[0] || null;
            await tx.subjectAssignment.create({
              data: {
                organizationId: actor.organizationId,
                institutionId: cleanInstitutionId!,
                academicSessionId: currentSession.id,
                subjectId,
                teacherId: user.id,
                sectionId,
              },
            });
          }
        }

        // Create Section Class Teacher Responsibility
        if (td.assignedSectionIds.length > 0) {
          for (const sectionId of td.assignedSectionIds) {
            await tx.staffResponsibility.create({
              data: {
                staffId: staffProfile.id,
                userId: user.id,
                responsibilityType: 'CLASS_TEACHER',
                title: `Class Teacher - Section ${sectionId}`,
                scopeLevel: 'SECTION',
                sectionId,
                classLevelId: td.assignedClassIds[0] || null,
                status: 'ACTIVE',
                assignedById: actor.id,
              },
            });
          }
        }
      }

      // 3. Business Relationship: Parent / Guardian
      if ((d.actorType === 'PARENT' || d.role === 'PARENT') && d.parentDetails) {
        const pd = d.parentDetails;
        const parentRecord = await tx.parentGuardian.create({
          data: {
            organizationId: actor.organizationId,
            userId: user.id,
            firstName: d.firstName,
            lastName: d.lastName,
            relation: pd.relation,
            phone: d.phone || '0000000000',
            email: d.email,
          },
        });

        if (pd.linkedStudentIds.length > 0) {
          for (const studentId of pd.linkedStudentIds) {
            await tx.studentParent.upsert({
              where: {
                studentId_parentId: {
                  studentId,
                  parentId: parentRecord.id,
                },
              },
              create: {
                studentId,
                parentId: parentRecord.id,
                isPrimaryContact: true,
                isEmergencyContact: true,
              },
              update: {},
            });
          }
        }
      }

      // 4. Business Relationship: Student
      if ((d.actorType === 'STUDENT' || d.role === 'STUDENT') && d.studentDetails?.studentId) {
        await tx.student.update({
          where: { id: d.studentDetails.studentId },
          data: {
            userId: user.id,
            email: d.email,
          },
        });
      }

      // 5. Business Relationship: Non-teaching Staff
      if (d.actorType === 'STAFF' && d.staffDetails) {
        const sd = d.staffDetails;
        const employeeId = `STAFF-${Date.now().toString().slice(-6)}`;
        await tx.staffProfile.create({
          data: {
            organizationId: actor.organizationId,
            institutionId: cleanInstitutionId!,
            branchId: cleanBranchId,
            userId: user.id,
            employeeId,
            firstName: d.firstName,
            lastName: d.lastName,
            email: d.email,
            phone: d.phone || '0000000000',
            dob: new Date('1990-01-01'),
            gender: 'OTHER',
            department: sd.department,
            designation: sd.designation,
            status: 'ACTIVE',
          },
        });
      }

      // 6. Custom Permissions Overrides
      if (d.customPermissions && d.customPermissions.length > 0) {
        for (const cp of d.customPermissions) {
          await tx.userPermission.create({
            data: {
              userId: user.id,
              permission: cp.permission,
              granted: cp.granted,
            },
          });
        }
      }

      return user;
    });

    // Immutable Audit Log
    await logAudit({
      organizationId: actor.organizationId,
      institutionId: cleanInstitutionId || undefined,
      actorId: actor.id,
      actorName: `${actor.firstName} ${actor.lastName}`,
      actorRole: actor.role,
      resource: 'ACCOUNT',
      action: 'CREATE',
      recordId: result.id,
      details: {
        createdUserId: result.id,
        name: `${result.firstName} ${result.lastName}`,
        email: result.email,
        role: result.role,
        actorType: result.actorType,
        scope: result.scope,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account for '${result.firstName} ${result.lastName}' created successfully.`,
      account: {
        id: result.id,
        name: `${result.firstName} ${result.lastName}`,
        email: result.email,
        role: result.role,
        actorType: result.actorType,
        scope: result.scope,
        status: result.status,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[ACCOUNT_CREATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to create account: ' + (error.message || 'Server error') }, { status: 500 });
  }
}
