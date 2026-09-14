import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const responsibilities = await prisma.staffResponsibility.findMany({
      where: { staffId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, responsibilities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch responsibilities' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = ['SUPER_ADMIN', 'ORG_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACADEMIC_COORDINATOR'].includes(user.role);
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    const {
      responsibilityType,
      title,
      scopeLevel = 'SECTION',
      scopeId,
      classLevelId,
      sectionId,
      batchId,
      subjectId,
      validFrom,
      validUntil,
      isTemporary = false,
    } = body;

    if (!responsibilityType || !title) {
      return NextResponse.json(
        { success: false, error: 'responsibilityType and title are required' },
        { status: 400 }
      );
    }

    const staff = await prisma.staffProfile.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'Staff profile not found' }, { status: 404 });
    }

    const resp = await prisma.staffResponsibility.create({
      data: {
        staffId: staff.id,
        userId: staff.userId,
        responsibilityType,
        title,
        scopeLevel,
        scopeId: scopeId || sectionId || classLevelId || subjectId,
        classLevelId,
        sectionId,
        batchId,
        subjectId,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isTemporary: !!isTemporary,
        status: 'ACTIVE',
        assignedById: user.id,
      },
    });

    // Add career timeline record
    await prisma.staffCareerEvent.create({
      data: {
        staffId: staff.id,
        eventType: 'RESPONSIBILITY_ASSIGNED',
        title: `Assigned: ${title}`,
        description: `Temporal responsibility (${responsibilityType}) scoped to ${scopeLevel} assigned by ${user.firstName} ${user.lastName}.`,
        createdById: user.id,
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'STAFF_RESPONSIBILITY',
      action: 'ASSIGN_RESPONSIBILITY',
      recordId: resp.id,
      details: {
        staffId: staff.id,
        responsibilityType,
        title,
        scopeLevel,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Responsibility "${title}" assigned successfully`,
      responsibility: resp,
    });
  } catch (error: any) {
    console.error('[ASSIGN_RESPONSIBILITY_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to assign responsibility' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const responsibilityId = searchParams.get('responsibilityId');

    if (!responsibilityId) {
      return NextResponse.json({ success: false, error: 'responsibilityId required' }, { status: 400 });
    }

    const updated = await prisma.staffResponsibility.update({
      where: { id: responsibilityId },
      data: { status: 'REVOKED' },
    });

    return NextResponse.json({ success: true, message: 'Responsibility revoked', responsibility: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to revoke responsibility' }, { status: 500 });
  }
}
