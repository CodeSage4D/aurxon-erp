// AURXON Student Leave Approval & Attendance Sync Endpoint
// Automatically synchronizes approved leaves to student attendance records with status 'LEAVE'

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSecurityActor } from '@/lib/authorization/context';
import { z } from 'zod';

const ReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'CANCEL']),
  remarks: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getSecurityActor();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const request = await prisma.studentLeaveRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: { section: true },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Student leave request not found' }, { status: 404 });
    }

    if (request.organizationId !== actor.organizationId && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Tenant boundary violation' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch student leave request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getSecurityActor();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { action, remarks } = parsed.data;

    const request = await prisma.studentLeaveRequest.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Student leave request not found' }, { status: 404 });
    }

    if (request.organizationId !== actor.organizationId && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Tenant boundary violation' }, { status: 403 });
    }

    // Anti-Self-Approval: Requester cannot approve their own student leave request
    if (request.appliedByUserId === actor.id && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Self-approval is strictly disallowed under four-eyes security principles.' },
        { status: 403 }
      );
    }

    // Role Authority Check:
    const canApprove = [
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'PRINCIPAL',
      'VICE_PRINCIPAL',
      'ACADEMIC_COORDINATOR',
      'CLASS_TEACHER',
      'TEACHER',
    ].includes(actor.role);

    if (!canApprove) {
      return NextResponse.json(
        { error: `Role '${actor.role}' is not authorized to approve student leave requests.` },
        { status: 403 }
      );
    }

    if (action === 'REJECT') {
      await prisma.studentLeaveRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedByUserId: actor.id,
          reviewedAt: new Date(),
          reviewRemarks: remarks || 'Rejected by reviewer',
        },
      });

      await prisma.approvalRequest.updateMany({
        where: { targetResourceId: id },
        data: {
          status: 'REJECTED',
          approverUserId: actor.id,
          approvalRemarks: remarks || 'Rejected',
          actedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Student leave request rejected.',
      });
    }

    if (action === 'CANCEL') {
      await prisma.studentLeaveRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          reviewRemarks: remarks || 'Cancelled',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Student leave request cancelled.',
      });
    }

    // APPROVE:
    await prisma.studentLeaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedByUserId: actor.id,
        reviewedAt: new Date(),
        reviewRemarks: remarks || 'Approved',
      },
    });

    await prisma.approvalRequest.updateMany({
      where: { targetResourceId: id },
      data: {
        status: 'APPROVED',
        approverUserId: actor.id,
        approvalRemarks: remarks || 'Approved',
        actedAt: new Date(),
      },
    });

    // AUTOMATIC STUDENT ATTENDANCE SYNCHRONIZATION:
    // Mark AttendanceRecord as 'LEAVE' (not ABSENT!)
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const curr = new Date(start);

    while (curr <= end) {
      if (curr.getDay() !== 0) { // Skip Sunday
        const recordDate = new Date(curr);
        recordDate.setHours(0, 0, 0, 0);

        // Find academic session
        const session = await prisma.academicSession.findFirst({
          where: { organizationId: request.organizationId, isCurrent: true },
        });

        if (session) {
          await prisma.attendanceRecord.upsert({
            where: {
              studentId_date: {
                studentId: request.studentId,
                date: recordDate,
              },
            },
            create: {
              organizationId: request.organizationId,
              institutionId: request.student.institutionId,
              academicSessionId: session.id,
              studentId: request.studentId,
              sectionId: request.student.sectionId,
              date: recordDate,
              status: 'LEAVE',
              remarks: `Approved ${request.leaveType} Leave: ${request.reason}`,
              markedById: actor.id,
            },
            update: {
              status: 'LEAVE',
              remarks: `Approved ${request.leaveType} Leave: ${request.reason}`,
              markedById: actor.id,
            },
          });
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Student leave approved successfully and attendance synchronized as LEAVE.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to review student leave request' },
      { status: 500 }
    );
  }
}
