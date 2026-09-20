import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { getSecurityActor, authorize, sanitizeStudentRecord } from '@/lib/authorization';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      section: { include: { classLevel: true } },
      batch: { include: { course: true } },
      studentParents: { include: { parent: true } },
      attendanceRecords: {
        take: 14,
        orderBy: { date: 'desc' },
      },
      marksEntries: {
        include: {
          examSubject: {
            include: { subject: true, exam: true },
          },
        },
      },
      feeAllocations: {
        include: {
          feeStructure: { include: { feeHeads: true } },
          payments: true,
        },
      },
    },
  });

  // Strict Tenant Isolation Verification
  if (!student || student.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student record not found' }, { status: 404 });
  }

  const actor = await getSecurityActor(user);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'User session invalid or suspended' }, { status: 403 });
  }

  const isEndUser =
    actor.role === 'PARENT' ||
    actor.role === 'STUDENT' ||
    actor.actorType === 'PARENT' ||
    actor.actorType === 'STUDENT';
  const targetAction = isEndUser ? 'students.view_own' : 'students.view';

  // Pure Authorization Evaluation: Permission + Scope + Relationship
  const authDecision = authorize(actor, targetAction, {
    type: 'STUDENT',
    organizationId: student.organizationId,
    institutionId: student.institutionId || undefined,
    branchId: student.branchId || undefined,
    sectionId: student.sectionId || undefined,
    classLevelId: student.section?.classLevelId || undefined,
    studentId: student.id,
  });

  if (!authDecision.allowed) {
    return NextResponse.json(
      { success: false, error: authDecision.reason || 'Forbidden: Access denied to student record' },
      { status: 403 }
    );
  }

  const sanitized = sanitizeStudentRecord(student, actor);
  return NextResponse.json({ success: true, student: sanitized });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.student.findUnique({
    where: { id: params.id },
    include: { section: true },
  });

  if (!existing || existing.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
  }

  const actor = await getSecurityActor(user);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'User session invalid or suspended' }, { status: 403 });
  }

  const authDecision = authorize(actor, 'students.edit', {
    type: 'STUDENT',
    organizationId: existing.organizationId,
    institutionId: existing.institutionId || undefined,
    branchId: existing.branchId || undefined,
    sectionId: existing.sectionId || undefined,
    classLevelId: existing.section?.classLevelId || undefined,
    studentId: existing.id,
  });

  if (!authDecision.allowed) {
    return NextResponse.json({ success: false, error: authDecision.reason || 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.student.update({
      where: { id: params.id },
      data: {
        firstName: body.firstName ?? existing.firstName,
        lastName: body.lastName ?? existing.lastName,
        contactPhone: body.contactPhone ?? existing.contactPhone,
        email: body.email ?? existing.email,
        address: body.address ?? existing.address,
        status: body.status ?? existing.status,
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: user.institutionId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'STUDENT',
      action: 'UPDATE',
      recordId: updated.id,
      details: { changes: body },
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error('[STUDENT_UPDATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update student' }, { status: 500 });
  }
}

export const PUT = PATCH;


export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.student.findUnique({
    where: { id: params.id },
    include: { section: true },
  });

  if (!existing || existing.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
  }

  const actor = await getSecurityActor(user);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'User session invalid or suspended' }, { status: 403 });
  }

  const authDecision = authorize(actor, 'students.archive', {
    type: 'STUDENT',
    organizationId: existing.organizationId,
    institutionId: existing.institutionId || undefined,
    branchId: existing.branchId || undefined,
    sectionId: existing.sectionId || undefined,
    classLevelId: existing.section?.classLevelId || undefined,
    studentId: existing.id,
  });

  if (!authDecision.allowed) {
    return NextResponse.json({ success: false, error: authDecision.reason || 'Forbidden' }, { status: 403 });
  }

  const archived = await prisma.student.update({
    where: { id: params.id },
    data: { status: 'ARCHIVED' },
  });

  await logAudit({
    organizationId: user.organizationId,
    institutionId: user.institutionId,
    actorId: user.id,
    actorName: `${user.firstName} ${user.lastName}`,
    actorRole: user.role,
    resource: 'STUDENT',
    action: 'ARCHIVE',
    recordId: archived.id,
  });

  return NextResponse.json({ success: true, message: 'Student archived successfully' });
}
