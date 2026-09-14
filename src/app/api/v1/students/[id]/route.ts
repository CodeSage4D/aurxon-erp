import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

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

  return NextResponse.json({ success: true, student });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'student.update')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const existing = await prisma.student.findUnique({ where: { id: params.id } });
  if (!existing || existing.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'student.archive')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const existing = await prisma.student.findUnique({ where: { id: params.id } });
  if (!existing || existing.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
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
