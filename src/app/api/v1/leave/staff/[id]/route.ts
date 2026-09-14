// AURXON Staff Leave Approval & Decision Endpoint
// Enforces Anti-Self-Approval, Policy Step Advancement, and Automatic Attendance Synchronization

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSecurityActor } from '@/lib/authorization/context';
import { validateApprovalAction } from '@/lib/authorization/decision-engine';
import { z } from 'zod';

const LeaveActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'CANCEL']),
  remarks: z.string().optional(),
  assignedSubstituteStaffId: z.string().optional(),
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

    const leaveRequest = await prisma.staffLeaveRequest.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            designation: true,
            department: true,
            userId: true,
            avatarUrl: true,
            // Sensitive fields (basicSalary, bankAccountNumber, panNumber) strictly excluded for approver privacy!
          },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.organizationId !== actor.organizationId && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Tenant boundary violation' }, { status: 403 });
    }

    // Parse academic impact
    let academicImpact = [];
    try {
      if (leaveRequest.academicImpactJson) {
        academicImpact = JSON.parse(leaveRequest.academicImpactJson);
      }
    } catch {
      // Ignore
    }

    // Query staff leave balances for decision context
    const balances = await prisma.staffLeaveBalance.findMany({
      where: { staffId: leaveRequest.staffId },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...leaveRequest,
        staff: {
          ...leaveRequest.staff,
          fullName: `${leaveRequest.staff.firstName} ${leaveRequest.staff.lastName}`,
        },
        academicImpact,
        balances,
        canAct:
          actor.role === 'SUPER_ADMIN' ||
          actor.role === 'ORG_ADMIN' ||
          (leaveRequest.staff.userId !== actor.id &&
            ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'ACADEMIC_COORDINATOR', 'HR_MANAGER'].includes(actor.role)),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leave request' },
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
    const parsed = LeaveActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { action, remarks, assignedSubstituteStaffId } = parsed.data;

    const leaveRequest = await prisma.staffLeaveRequest.findUnique({
      where: { id },
      include: {
        staff: true,
      },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.organizationId !== actor.organizationId && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Tenant boundary violation' }, { status: 403 });
    }

    // 1. Cancellation by applicant
    if (action === 'CANCEL') {
      const isApplicant = leaveRequest.staff.userId === actor.id;
      const isAdmin = actor.role === 'SUPER_ADMIN' || actor.role === 'ORG_ADMIN';

      if (!isApplicant && !isAdmin) {
        return NextResponse.json(
          { error: 'Only the applicant or administrator can cancel this leave request.' },
          { status: 403 }
        );
      }

      await prisma.staffLeaveRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          reviewRemarks: remarks || 'Cancelled by applicant',
        },
      });

      // Restore leave balance
      if (leaveRequest.status === 'PENDING' || leaveRequest.status === 'UNDER_REVIEW') {
        await prisma.staffLeaveBalance.updateMany({
          where: {
            staffId: leaveRequest.staffId,
            leaveType: leaveRequest.leaveType,
          },
          data: {
            pendingDays: { decrement: leaveRequest.totalDays },
            availableDays: { increment: leaveRequest.totalDays },
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Leave request cancelled successfully.',
      });
    }

    // 2. Anti-Self-Approval Check
    const requesterUserId = leaveRequest.staff.userId;
    if (requesterUserId === actor.id && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          error: 'Self-approval is strictly prohibited under four-eyes security principles.',
          denialCode: 'SELF_APPROVAL_DISALLOWED',
        },
        { status: 403 }
      );
    }

    // 3. Multi-tier workflow step validation
    const stepValidation = validateApprovalAction({
      requesterUserId: requesterUserId || '',
      actorUserId: actor.id,
      actorRole: actor.role,
      currentStep: leaveRequest.currentReviewStep,
      workflowType: 'STAFF_LEAVE',
    });

    if (!stepValidation.allowed) {
      return NextResponse.json(
        { error: stepValidation.reason },
        { status: 403 }
      );
    }

    // 4. Handle Rejection
    if (action === 'REJECT') {
      await prisma.staffLeaveRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedByUserId: actor.id,
          reviewedAt: new Date(),
          reviewRemarks: remarks || 'Rejected by authorized reviewer',
        },
      });

      // Restore available balance
      await prisma.staffLeaveBalance.updateMany({
        where: {
          staffId: leaveRequest.staffId,
          leaveType: leaveRequest.leaveType,
        },
        data: {
          pendingDays: { decrement: leaveRequest.totalDays },
          availableDays: { increment: leaveRequest.totalDays },
        },
      });

      // Update approval request
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
        message: 'Leave request rejected and balance restored.',
      });
    }

    // 5. Handle Approval
    const isFinalApproval = stepValidation.isFinalStep || actor.role === 'PRINCIPAL' || actor.role === 'ORG_ADMIN' || actor.role === 'SUPER_ADMIN';

    if (!isFinalApproval && stepValidation.nextStep) {
      // Advance to next step (e.g. HOD approved -> Next is VICE_PRINCIPAL)
      await prisma.staffLeaveRequest.update({
        where: { id },
        data: {
          status: 'UNDER_REVIEW',
          currentReviewStep: stepValidation.nextStep,
          substituteStaffId: assignedSubstituteStaffId || leaveRequest.substituteStaffId,
          reviewRemarks: remarks,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Leave reviewed and advanced to next step: ${stepValidation.nextStep}`,
      });
    }

    // FINAL APPROVAL:
    await prisma.staffLeaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        currentReviewStep: 'COMPLETED',
        reviewedByUserId: actor.id,
        reviewedAt: new Date(),
        substituteStaffId: assignedSubstituteStaffId || leaveRequest.substituteStaffId,
        reviewRemarks: remarks || 'Approved',
      },
    });

    // Update Staff Leave Balance: decrease pending, increase used
    await prisma.staffLeaveBalance.updateMany({
      where: {
        staffId: leaveRequest.staffId,
        leaveType: leaveRequest.leaveType,
      },
      data: {
        pendingDays: { decrement: leaveRequest.totalDays },
        usedDays: { increment: leaveRequest.totalDays },
      },
    });

    // Update Approval Request record
    await prisma.approvalRequest.updateMany({
      where: { targetResourceId: id },
      data: {
        status: 'APPROVED',
        approverUserId: actor.id,
        approvalRemarks: remarks || 'Approved',
        actedAt: new Date(),
      },
    });

    // 6. AUTOMATIC ATTENDANCE SYNCHRONIZATION:
    // Approved leave must automatically sync to StaffAttendanceRecord as 'LEAVE' (not Absent!)
    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    const curr = new Date(start);

    while (curr <= end) {
      // Check day of week (skip Sunday)
      if (curr.getDay() !== 0) {
        const recordDate = new Date(curr);
        recordDate.setHours(0, 0, 0, 0);

        await prisma.staffAttendanceRecord.upsert({
          where: {
            staffId_date: {
              staffId: leaveRequest.staffId,
              date: recordDate,
            },
          },
          create: {
            organizationId: leaveRequest.organizationId,
            institutionId: leaveRequest.institutionId,
            branchId: leaveRequest.branchId,
            staffId: leaveRequest.staffId,
            date: recordDate,
            status: 'LEAVE',
            leaveRequestId: leaveRequest.id,
            remarks: `Approved ${leaveRequest.leaveType} Leave: ${leaveRequest.reason}`,
            markedById: actor.id,
          },
          update: {
            status: 'LEAVE',
            leaveRequestId: leaveRequest.id,
            remarks: `Approved ${leaveRequest.leaveType} Leave: ${leaveRequest.reason}`,
            markedById: actor.id,
          },
        });
      }
      curr.setDate(curr.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Leave approved successfully and staff attendance synchronized as LEAVE.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update leave request' },
      { status: 500 }
    );
  }
}
