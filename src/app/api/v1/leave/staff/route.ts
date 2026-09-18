// AURXON Staff Leave API Route
// Handles Faculty Leave Balances, Application Submission, Validation, and Academic Impact Calculation

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSecurityActor } from '@/lib/authorization/context';
import { assertCan, authorize } from '@/lib/authorization/engine';
import { validateStaffLeaveApplication } from '@/lib/leave/leave-validator';
import { rankSubstituteCandidates } from '@/lib/leave/substitute-recommender';
import { LeaveType, AcademicImpactSlot } from '@/lib/authorization/types';
import { z } from 'zod';

const DEFAULT_ANNUAL_QUOTAS: Record<string, number> = {
  CASUAL: 12,
  SICK: 10,
  EARNED: 15,
  DUTY: 10,
  SPECIAL: 5,
};

const StaffLeaveSchema = z.object({
  leaveType: z.enum([
    'CASUAL',
    'SICK',
    'EARNED',
    'PRIVILEGE',
    'HALF_DAY',
    'EMERGENCY',
    'MATERNITY',
    'PATERNITY',
    'UNPAID',
    'SPECIAL',
    'DUTY',
  ]),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  totalDays: z.number().positive('Total days must be positive'),
  halfDay: z.boolean().optional().default(false),
  halfDayPeriod: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  emergency: z.boolean().optional().default(false),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  contactDuringLeave: z.string().optional(),
  supportingDocUrl: z.string().optional(),
  substituteStaffId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const actor = await getSecurityActor();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve target staff profile
    let staffProfile = await prisma.staffProfile.findFirst({
      where: { userId: actor.id },
      include: {
        leaveBalances: true,
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    // Auto-seed default quotas for the faculty member if empty
    if (staffProfile && staffProfile.leaveBalances.length === 0) {
      const initialBalances = Object.entries(DEFAULT_ANNUAL_QUOTAS).map(([lType, allocated]) => ({
        staffId: staffProfile!.id,
        leaveType: lType,
        totalAllocated: allocated,
        usedDays: 0,
        pendingDays: 0,
        availableDays: allocated,
      }));

      await prisma.staffLeaveBalance.createMany({
        data: initialBalances,
      });

      staffProfile = await prisma.staffProfile.findUnique({
        where: { id: staffProfile.id },
        include: {
          leaveBalances: true,
          leaveRequests: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
    }

    // Check if actor has supervisory review permissions (Principal, VP, HOD, Coordinator, Admin)
    const isSupervisor = [
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'PRINCIPAL',
      'VICE_PRINCIPAL',
      'HOD',
      'ACADEMIC_COORDINATOR',
      'HR_MANAGER',
    ].includes(actor.role);

    let pendingInstitutionalRequests: any[] = [];
    if (isSupervisor) {
      pendingInstitutionalRequests = await prisma.staffLeaveRequest.findMany({
        where: {
          organizationId: actor.organizationId,
          status: { in: ['PENDING', 'UNDER_REVIEW'] },
        },
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              designation: true,
              department: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    const mappedInstitutionalRequests = pendingInstitutionalRequests.map((r) => ({
      ...r,
      staff: {
        ...r.staff,
        fullName: `${r.staff.firstName} ${r.staff.lastName}`,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        staffProfile: staffProfile
          ? {
              id: staffProfile.id,
              employeeId: staffProfile.employeeId,
              fullName: `${staffProfile.firstName} ${staffProfile.lastName}`,
              department: staffProfile.department,
            }
          : null,
        balances: staffProfile?.leaveBalances || [],
        myRequests: staffProfile?.leaveRequests || [],
        pendingInstitutionalRequests: mappedInstitutionalRequests,
        isSupervisor,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff leave data' },
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
    const parsed = StaffLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Find staff profile for actor
    const staffProfile = await prisma.staffProfile.findFirst({
      where: { userId: actor.id },
      include: {
        leaveBalances: true,
        leaveRequests: true,
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        { error: 'Staff profile not found for current user account.' },
        { status: 404 }
      );
    }

    // 1. Calculate affected timetable slots (Academic Impact)
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const scheduledSlots = await prisma.timetableSlot.findMany({
      where: {
        organizationId: actor.organizationId,
        ...(staffProfile.userId ? { teacherId: staffProfile.userId } : {}),
      },
      include: {
        subject: true,
        section: true,
      },
    });

    const affectedClasses: AcademicImpactSlot[] = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const dayNum = curr.getDay(); // 0=Sun, 1=Mon...
      if (dayNum >= 1 && dayNum <= 6) {
        const matches = scheduledSlots.filter((slot) => slot.dayOfWeek === dayNum);
        for (const m of matches) {
          const secName = (m as any).section?.name;
          const subName = (m as any).subject?.name;
          affectedClasses.push({
            dayOfWeek: m.dayOfWeek,
            periodNumber: m.periodNumber,
            className: secName ? `Class Section ${secName}` : 'Assigned Class',
            sectionName: secName || 'A',
            subjectName: subName || 'Academic Subject',
            subjectId: m.subjectId,
            date: curr.toISOString().split('T')[0],
          });
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    // 2. Validate Leave Application
    const validation = validateStaffLeaveApplication({
      staffId: staffProfile.id,
      leaveType: data.leaveType as LeaveType,
      startDate,
      endDate,
      totalDays: data.totalDays,
      isEmergency: data.emergency,
      hasSupportingDoc: !!data.supportingDocUrl,
      currentBalances: staffProfile.leaveBalances.map((b) => ({
        leaveType: b.leaveType as LeaveType,
        totalAllocated: b.totalAllocated,
        usedDays: b.usedDays,
        pendingDays: b.pendingDays,
        availableDays: b.availableDays,
      })),
      existingLeaves: staffProfile.leaveRequests.map((r) => ({
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
      })),
      scheduledClasses: affectedClasses,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Leave validation failed',
          reasons: validation.reasons,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // 3. Find Recommended Substitute Teachers
    let candidateSubstitutes: any[] = [];
    let topSubstituteId: string | null = null;

    if (affectedClasses.length > 0) {
      const otherStaff = await prisma.staffProfile.findMany({
        where: {
          organizationId: actor.organizationId,
          id: { not: staffProfile.id },
          status: 'ACTIVE',
        },
        take: 20,
      });

      const candidatePool = otherStaff.map((s) => ({
        staffId: s.id,
        fullName: `${s.firstName} ${s.lastName}`,
        designation: s.designation,
        department: s.department,
        subjectSpecializations: s.department ? [s.department] : [],
        branchId: s.branchId || undefined,
        busySlots: [], // Can cross-reference with their slots
        weeklyPeriodCount: 18, // Default baseline
      }));

      candidateSubstitutes = rankSubstituteCandidates(
        affectedClasses,
        candidatePool,
        staffProfile.branchId || undefined
      );

      if (candidateSubstitutes.length > 0) {
        topSubstituteId = candidateSubstitutes[0].staffId;
      }
    }

    // 4. Create StaffLeaveRequest atomically
    const initialStep = validation.recommendedApprovalRoute[0] || 'COORDINATOR';

    const newRequest = await prisma.staffLeaveRequest.create({
      data: {
        staffId: staffProfile.id,
        organizationId: actor.organizationId,
        institutionId: actor.institutionId,
        branchId: actor.branchId,
        leaveType: data.leaveType,
        startDate,
        endDate,
        totalDays: data.totalDays,
        halfDay: data.halfDay,
        halfDayPeriod: data.halfDayPeriod,
        emergency: data.emergency,
        reason: data.reason,
        contactDuringLeave: data.contactDuringLeave,
        supportingDocUrl: data.supportingDocUrl,
        substituteStaffId: data.substituteStaffId || topSubstituteId,
        suggestedSubstituteId: topSubstituteId,
        academicImpactJson: JSON.stringify(affectedClasses),
        status: 'PENDING',
        currentReviewStep: initialStep,
        workflowStepsJson: JSON.stringify(
          validation.recommendedApprovalRoute.map((step) => ({
            stepName: step,
            status: 'PENDING',
          }))
        ),
      },
    });

    // 5. Update pending days on leave balance
    await prisma.staffLeaveBalance.updateMany({
      where: {
        staffId: staffProfile.id,
        leaveType: data.leaveType,
      },
      data: {
        pendingDays: { increment: data.totalDays },
        availableDays: { decrement: data.totalDays },
      },
    });

    // 6. Create corresponding Four-Eyes ApprovalRequest
    await prisma.approvalRequest.create({
      data: {
        organizationId: actor.organizationId,
        institutionId: actor.institutionId,
        workflowType: 'STAFF_LEAVE',
        title: `Faculty Leave Request — ${staffProfile.firstName} ${staffProfile.lastName} (${data.totalDays} Days ${data.leaveType})`,
        description: `${data.reason}. Route: ${validation.recommendedApprovalRoute.join(' ➔ ')}`,
        payloadJson: JSON.stringify({
          staffLeaveRequestId: newRequest.id,
          staffId: staffProfile.id,
          leaveType: data.leaveType,
          totalDays: data.totalDays,
          startDate: data.startDate,
          endDate: data.endDate,
          academicImpactCount: affectedClasses.length,
        }),
        requesterUserId: actor.id,
        targetResourceId: newRequest.id,
        status: 'PENDING',
        currentStep: initialStep,
        stepsJson: JSON.stringify(validation.recommendedApprovalRoute),
        requiresFourEyesApproval: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully for review.',
      data: {
        id: newRequest.id,
        status: newRequest.status,
        approvalRoute: validation.recommendedApprovalRoute,
        academicImpactCount: affectedClasses.length,
        suggestedSubstitute: candidateSubstitutes[0] || null,
        warnings: validation.warnings,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit leave request' },
      { status: 500 }
    );
  }
}
