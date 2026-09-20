import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getSecurityActor, authorize } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(user);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'User session invalid or suspended' }, { status: 403 });
  }

  let instId = user.institutionId;
  if (!instId) {
    const inst = await prisma.institution.findFirst({ where: { organizationId: user.organizationId } });
    instId = inst?.id;
  }

  if (!instId) {
    return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 400 });
  }

  const authDecision = authorize(actor, 'academics.manage', {
    type: 'ACADEMICS',
    organizationId: user.organizationId,
    institutionId: instId,
  });

  if (!authDecision.allowed) {
    return NextResponse.json({ success: false, error: authDecision.reason || 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      sourceSessionId,
      targetSessionId,
      sourceSectionId,
      targetSectionId,
      targetClassLevelId,
      studentPromotions,
    } = body;

    if (!sourceSessionId || !targetSessionId || !Array.isArray(studentPromotions) || studentPromotions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Source session, target session, and at least one student promotion record are required' },
        { status: 400 }
      );
    }

    // Verify session existence & tenant scoping
    const [sourceSession, targetSession] = await Promise.all([
      prisma.academicSession.findFirst({
        where: { id: sourceSessionId, organizationId: user.organizationId },
      }),
      prisma.academicSession.findFirst({
        where: { id: targetSessionId, organizationId: user.organizationId },
      }),
    ]);

    if (!sourceSession || !targetSession) {
      return NextResponse.json({ success: false, error: 'Invalid academic sessions specified' }, { status: 404 });
    }

    // Execute atomic transaction for bulk promotion
    const result = await prisma.$transaction(async (tx) => {
      let processedCount = 0;

      for (const item of studentPromotions) {
        const { studentId, status = 'PROMOTED', newRollNumber, remarks } = item;

        const student = await tx.student.findFirst({
          where: { id: studentId, organizationId: user.organizationId },
          include: { section: true },
        });

        if (!student) continue;

        // 1. Create historical enrollment snapshot for past session
        await tx.studentEnrollmentHistory.create({
          data: {
            organizationId: student.organizationId,
            institutionId: student.institutionId,
            academicSessionId: student.academicSessionId,
            studentId: student.id,
            classLevelId: student.section?.classLevelId || null,
            sectionId: student.sectionId,
            batchId: student.batchId,
            rollNumber: student.rollNumber,
            status: status,
            remarks: remarks || `Promoted from ${sourceSession.name} to ${targetSession.name}`,
            createdById: user.id,
          },
        });

        // 2. Update student active session and class assignment
        if (status === 'PROMOTED' || status === 'REPEATING') {
          await tx.student.update({
            where: { id: student.id },
            data: {
              academicSessionId: targetSessionId,
              sectionId: targetSectionId || student.sectionId,
              rollNumber: newRollNumber ?? student.rollNumber,
              status: 'ACTIVE',
            },
          });
        } else if (status === 'GRADUATED' || status === 'TRANSFERRED') {
          await tx.student.update({
            where: { id: student.id },
            data: {
              status: status,
            },
          });
        }

        processedCount++;
      }

      return processedCount;
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: instId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'STUDENT_PROMOTION',
      action: 'BULK_PROMOTION',
      details: {
        sourceSessionId,
        targetSessionId,
        sourceSectionId,
        targetSectionId,
        count: result,
      },
    });

    return NextResponse.json({
      success: true,
      count: result,
      message: `Successfully processed promotion for ${result} students`,
    });
  } catch (error) {
    console.error('[PROMOTION_ENGINE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to process student promotion' }, { status: 500 });
  }
}
