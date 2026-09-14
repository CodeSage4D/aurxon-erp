// AURXON Student Leave API Route
// Relationship-based Student Leave, Exam Conflict Detection, and Attendance Synchronization

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSecurityActor } from '@/lib/authorization/context';
import { validateStudentLeaveApplication } from '@/lib/leave/leave-validator';
import { z } from 'zod';

const StudentLeaveSchema = z.object({
  studentId: z.string().min(1, 'Student ID required'),
  leaveType: z.enum([
    'SICK',
    'MEDICAL',
    'CASUAL',
    'FAMILY_EMERGENCY',
    'PLANNED_ABSENCE',
    'BEREAVEMENT',
  ]),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  totalDays: z.number().positive('Total days must be positive'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  parentConfirmation: z.boolean().optional().default(true),
  supportingDocUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const actor = await getSecurityActor();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetStudentId = searchParams.get('studentId');

    let whereClause: any = { organizationId: actor.organizationId };

    if (actor.role === 'PARENT') {
      whereClause.studentId = { in: actor.verifiedChildIds };
    } else if (actor.role === 'STUDENT') {
      if (actor.studentProfileId) {
        whereClause.studentId = actor.studentProfileId;
      } else {
        return NextResponse.json({ success: true, data: { requests: [], stats: null } });
      }
    } else if (targetStudentId) {
      whereClause.studentId = targetStudentId;
    }

    const requests = await prisma.studentLeaveRequest.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Compute Student Attendance Distribution (Present, Absent, Leave)
    let attendanceStats = null;
    const focusStudentId = targetStudentId || actor.studentProfileId || (actor.verifiedChildIds[0] || null);

    if (focusStudentId) {
      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: focusStudentId },
        select: { status: true },
      });

      const total = records.length;
      if (total > 0) {
        const present = records.filter((r) => r.status === 'PRESENT').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const leave = records.filter((r) => r.status === 'LEAVE').length;

        attendanceStats = {
          totalDays: total,
          presentCount: present,
          presentPercent: Math.round((present / total) * 100),
          absentCount: absent,
          absentPercent: Math.round((absent / total) * 100),
          leaveCount: leave,
          leavePercent: Math.round((leave / total) * 100),
        };
      } else {
        attendanceStats = {
          totalDays: 0,
          presentCount: 0,
          presentPercent: 100,
          absentCount: 0,
          absentPercent: 0,
          leaveCount: 0,
          leavePercent: 0,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        requests,
        attendanceStats,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch student leaves' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await getSecurityActor();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = StudentLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 1. Verify Parent or Student Relationship
    if (actor.role === 'PARENT' && !actor.verifiedChildIds.includes(data.studentId)) {
      return NextResponse.json(
        { error: 'Parent does not have verified custody of the specified student.' },
        { status: 403 }
      );
    }

    if (actor.role === 'STUDENT' && actor.studentProfileId !== data.studentId) {
      return NextResponse.json(
        { error: 'Students can only apply for their own leave.' },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { section: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // 2. Query Existing Leaves to check overlap
    const existingLeaves = await prisma.studentLeaveRequest.findMany({
      where: {
        studentId: data.studentId,
        status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
      },
      select: { startDate: true, endDate: true, status: true },
    });

    // 3. Query Scheduled Exams to detect exam conflicts
    const scheduledExams = await prisma.exam.findMany({
      where: {
        organizationId: actor.organizationId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { name: true, startDate: true },
    });

    // 4. Validate Student Leave
    const validation = validateStudentLeaveApplication({
      studentId: data.studentId,
      startDate,
      endDate,
      totalDays: data.totalDays,
      existingLeaves,
      scheduledExams: scheduledExams.map((e) => ({ examName: e.name, date: e.startDate })),
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Student leave validation failed',
          reasons: validation.reasons,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // 5. Create StudentLeaveRequest
    const newRequest = await prisma.studentLeaveRequest.create({
      data: {
        organizationId: actor.organizationId,
        institutionId: student.institutionId,
        academicSessionId: student.academicSessionId,
        studentId: student.id,
        appliedByUserId: actor.id,
        appliedByRole: actor.role,
        leaveType: data.leaveType,
        startDate,
        endDate,
        totalDays: data.totalDays,
        reason: data.reason,
        parentConfirmation: data.parentConfirmation,
        hasExamConflict: validation.hasExamConflict,
        examConflictDetails: validation.examConflictDetails,
        supportingDocUrl: data.supportingDocUrl,
        status: 'PENDING',
        currentReviewStep: validation.recommendedApprovalRoute[0] || 'CLASS_TEACHER',
      },
    });

    // 6. Create Approval Request
    await prisma.approvalRequest.create({
      data: {
        organizationId: actor.organizationId,
        institutionId: student.institutionId,
        workflowType: 'STUDENT_LEAVE',
        title: `Student Leave — ${student.firstName} ${student.lastName} (${data.totalDays} Days)`,
        description: `${data.reason} ${validation.hasExamConflict ? '• ' + validation.examConflictDetails : ''}`,
        payloadJson: JSON.stringify({
          studentLeaveRequestId: newRequest.id,
          studentId: student.id,
          leaveType: data.leaveType,
          totalDays: data.totalDays,
          hasExamConflict: validation.hasExamConflict,
        }),
        requesterUserId: actor.id,
        targetResourceId: newRequest.id,
        status: 'PENDING',
        currentStep: validation.recommendedApprovalRoute[0] || 'CLASS_TEACHER',
        stepsJson: JSON.stringify(validation.recommendedApprovalRoute),
        requiresFourEyesApproval: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student leave request submitted successfully.',
      data: {
        id: newRequest.id,
        status: newRequest.status,
        approvalRoute: validation.recommendedApprovalRoute,
        hasExamConflict: validation.hasExamConflict,
        examConflictDetails: validation.examConflictDetails,
        warnings: validation.warnings,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit student leave request' },
      { status: 500 }
    );
  }
}
