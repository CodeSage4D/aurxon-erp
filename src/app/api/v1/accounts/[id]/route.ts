import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getSecurityActor, authorize, getEffectivePermissions } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

const updateAccountSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  role: z.string().optional(),
  scope: z.string().optional(),
  mustResetPassword: z.boolean().optional(),
  customPermissions: z.array(z.object({
    permission: z.string(),
    granted: z.boolean(),
  })).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(sessionUser);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Retrieve user record
  const targetUser = await prisma.user.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true, code: true } },
      institution: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true, code: true } },
      staffProfile: {
        include: {
          responsibilities: { where: { status: 'ACTIVE' } },
        },
      },
      parentProfile: {
        include: {
          studentParents: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  admissionNumber: true,
                  section: { select: { name: true, classLevel: { select: { name: true } } } },
                },
              },
            },
          },
        },
      },
      studentProfile: {
        include: {
          section: { include: { classLevel: true } },
        },
      },
      subjectAssignments: {
        include: {
          subject: true,
          section: { include: { classLevel: true } },
        },
      },
      userPermissions: true,
      staffResponsibilities: { where: { status: 'ACTIVE' } },
    },
  });

  if (!targetUser) {
    return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
  }

  // Tenant Boundary Check
  if (actor.role !== 'SUPER_ADMIN' && targetUser.organizationId !== actor.organizationId) {
    return NextResponse.json({ success: false, error: 'Account not found in current organization' }, { status: 404 });
  }

  // Authorization Check
  const decision = authorize(actor, 'account.read', {
    type: 'ROLE',
    organizationId: targetUser.organizationId,
    institutionId: targetUser.institutionId,
  });

  if (!decision.allowed && actor.id !== targetUser.id) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to view this account' }, { status: 403 });
  }

  // Fetch recent audit activity
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      organizationId: targetUser.organizationId,
      OR: [
        { recordId: targetUser.id },
        { actorId: targetUser.id },
      ],
    },
    orderBy: { timestamp: 'desc' },
    take: 10,
    select: {
      id: true,
      action: true,
      resource: true,
      actorName: true,
      actorRole: true,
      timestamp: true,
      detailsJson: true,
    },
  });

  // Construct target actor to calculate effective permissions
  const targetActor = await getSecurityActor({
    id: targetUser.id,
    email: targetUser.email,
    firstName: targetUser.firstName,
    lastName: targetUser.lastName,
    role: targetUser.role,
    organizationId: targetUser.organizationId,
    institutionId: targetUser.institutionId,
    branchId: targetUser.branchId,
  });

  const effectivePermissions = targetActor ? getEffectivePermissions(targetActor) : [];

  return NextResponse.json({
    success: true,
    account: {
      id: targetUser.id,
      identity: {
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        email: targetUser.email,
        phone: targetUser.phone,
        status: targetUser.status,
        actorType: targetUser.actorType || 'STAFF',
        createdAt: targetUser.createdAt,
        lastLoginAt: targetUser.lastLoginAt,
      },
      roleAndAccess: {
        role: targetUser.role,
        scope: targetUser.scope || 'ORGANIZATION',
        institutionName: targetUser.institution?.name,
        branchName: targetUser.branch?.name,
      },
      security: {
        mustResetPassword: targetUser.mustResetPassword,
        isTemporaryPassword: targetUser.isTemporaryPassword,
        lastLoginAt: targetUser.lastLoginAt,
      },
      linkedProfile: targetUser.staffProfile
        ? { type: 'STAFF', data: targetUser.staffProfile }
        : targetUser.parentProfile
        ? { type: 'PARENT', data: targetUser.parentProfile }
        : targetUser.studentProfile
        ? { type: 'STUDENT', data: targetUser.studentProfile }
        : null,
      relationships: {
        subjectAssignments: targetUser.subjectAssignments,
        responsibilities: targetUser.staffResponsibilities,
        linkedChildren: targetUser.parentProfile?.studentParents || [],
        enrolledClass: targetUser.studentProfile?.section || null,
      },
      effectivePermissions,
      customPermissions: targetUser.userPermissions,
      auditHistory: auditLogs,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(sessionUser);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || (actor.role !== 'SUPER_ADMIN' && existing.organizationId !== actor.organizationId)) {
    return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
  }

  // Enforce account.update permission
  const decision = authorize(actor, 'account.update', {
    type: 'ROLE',
    organizationId: existing.organizationId,
  });

  if (!decision.allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to modify accounts' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    // Self-elevation prevention: Users cannot alter their own role, permissions, or scope
    if (existing.id === actor.id) {
      if (d.role && d.role !== existing.role) {
        return NextResponse.json({ success: false, error: 'Forbidden: Users cannot change their own system role (Privilege Escalation Protection)' }, { status: 403 });
      }
      if (d.customPermissions && Object.keys(d.customPermissions).length > 0) {
        return NextResponse.json({ success: false, error: 'Forbidden: Users cannot grant themselves custom permissions (Privilege Escalation Protection)' }, { status: 403 });
      }
      if (d.scope && d.scope !== existing.scope) {
        return NextResponse.json({ success: false, error: 'Forbidden: Users cannot alter their own resource scope (Privilege Escalation Protection)' }, { status: 403 });
      }
    }

    // Role delegation hierarchy check:
    if (d.role && d.role !== existing.role) {
      if (d.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden: Cannot delegate Platform Super Admin role' }, { status: 403 });
      }
      if (d.role === 'ORG_ADMIN' && actor.role !== 'SUPER_ADMIN' && actor.role !== 'ORG_ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden: Cannot delegate Organization Admin role' }, { status: 403 });
      }
    }

    const auditActions: string[] = [];

    if (d.status && d.status !== existing.status) {
      auditActions.push(d.status === 'ACTIVE' ? 'account.enabled' : 'account.disabled');
    }
    if (d.role && d.role !== existing.role) {
      auditActions.push('role.changed');
    }
    if (d.scope && d.scope !== existing.scope) {
      auditActions.push('scope.changed');
    }
    if (d.customPermissions) {
      auditActions.push('permission.changed');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          firstName: d.firstName ?? existing.firstName,
          lastName: d.lastName ?? existing.lastName,
          phone: d.phone ?? existing.phone,
          status: d.status ?? existing.status,
          role: d.role ?? existing.role,
          scope: d.scope ?? existing.scope,
          mustResetPassword: d.mustResetPassword ?? existing.mustResetPassword,
        },
      });

      if (d.customPermissions) {
        // Clear and rewrite custom permissions
        await tx.userPermission.deleteMany({ where: { userId: id } });
        for (const cp of d.customPermissions) {
          await tx.userPermission.create({
            data: {
              userId: id,
              permission: cp.permission,
              granted: cp.granted,
            },
          });
        }
      }

      return user;
    });

    // Log audit events
    for (const action of auditActions.length > 0 ? auditActions : ['account.updated']) {
      await logAudit({
        organizationId: actor.organizationId,
        institutionId: existing.institutionId || undefined,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`,
        actorRole: actor.role,
        resource: 'ACCOUNT',
        action,
        recordId: updated.id,
        details: { changes: d },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
      account: {
        id: updated.id,
        name: `${updated.firstName} ${updated.lastName}`,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        scope: updated.scope,
      },
    });
  } catch (error: any) {
    console.error('[ACCOUNT_UPDATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update account' }, { status: 500 });
  }
}
