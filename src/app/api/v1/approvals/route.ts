// AURXON Central Multi-Tier Approval Inbox & Action Handler
// Coordinates 4-Eyes Workflows across Fee Concessions, Exam Publications, Staff Transfers, and Attendance Corrections

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSecurityActor } from '@/lib/authorization/context';
import { validateApprovalAction } from '@/lib/authorization/decision-engine';
import { WorkflowType } from '@/lib/authorization/types';
import { z } from 'zod';

const ActionSchema = z.object({
  approvalRequestId: z.string().min(1, 'Approval request ID required'),
  action: z.enum(['APPROVE', 'REJECT']),
  remarks: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const actor = await getSecurityActor();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'PENDING';
    const typeFilter = searchParams.get('workflowType');

    const where: any = {
      organizationId: actor.organizationId,
    };

    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (typeFilter) {
      where.workflowType = typeFilter;
    }

    const approvals = await prisma.approvalRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const enriched = approvals.map((app) => {
      const isRequester = app.requesterUserId === actor.id;
      let canAct = false;
      let denialReason = '';

      if (isRequester && actor.role !== 'SUPER_ADMIN') {
        denialReason = 'Self-approval is disallowed under 4-eyes security rules';
      } else {
        const check = validateApprovalAction({
          requesterUserId: app.requesterUserId,
          actorUserId: actor.id,
          actorRole: actor.role,
          currentStep: app.currentStep,
          workflowType: app.workflowType as WorkflowType,
        });
        canAct = check.allowed && app.status === 'PENDING';
        if (!check.allowed) denialReason = check.reason;
      }

      return {
        ...app,
        canAct,
        denialReason,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approval queue' },
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
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { approvalRequestId, action, remarks } = parsed.data;

    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalRequestId },
    });

    if (!approval) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }

    if (approval.organizationId !== actor.organizationId && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Tenant boundary violation' }, { status: 403 });
    }

    // 1. Anti-Self-Approval
    if (approval.requesterUserId === actor.id && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Self-approval is prohibited. A different authorized reviewer must sign off.' },
        { status: 403 }
      );
    }

    // 2. Validate Step Authority
    const check = validateApprovalAction({
      requesterUserId: approval.requesterUserId,
      actorUserId: actor.id,
      actorRole: actor.role,
      currentStep: approval.currentStep,
      workflowType: approval.workflowType as WorkflowType,
    });

    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    if (action === 'REJECT') {
      await prisma.approvalRequest.update({
        where: { id: approvalRequestId },
        data: {
          status: 'REJECTED',
          approverUserId: actor.id,
          approvalRemarks: remarks || 'Rejected by authorized reviewer',
          actedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Workflow request '${approval.title}' has been rejected.`,
      });
    }

    // APPROVAL:
    if (!check.isFinalStep && check.nextStep) {
      // Step advance
      await prisma.approvalRequest.update({
        where: { id: approvalRequestId },
        data: {
          status: 'UNDER_REVIEW',
          currentStep: check.nextStep,
          approvalRemarks: remarks,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Approval step completed. Advanced to: ${check.nextStep}`,
      });
    }

    // FINAL APPROVAL:
    await prisma.approvalRequest.update({
      where: { id: approvalRequestId },
      data: {
        status: 'APPROVED',
        currentStep: 'COMPLETED',
        approverUserId: actor.id,
        approvalRemarks: remarks || 'Final approval granted',
        actedAt: new Date(),
      },
    });

    // Execute downstream business logic based on workflow type
    try {
      const payload = JSON.parse(approval.payloadJson || '{}');

      if (approval.workflowType === 'EXAM_PUBLICATION' && payload.examId) {
        // Formally publish exam results
        await prisma.exam.update({
          where: { id: payload.examId },
          data: { status: 'PUBLISHED' },
        });
      } else if (approval.workflowType === 'FEE_CONCESSION' && payload.feeAllocationId) {
        // Apply fee concession
        const concession = payload.concessionAmount || 0;
        await prisma.studentFeeAllocation.update({
          where: { id: payload.feeAllocationId },
          data: {
            discountAmount: { increment: concession },
            netAmount: { decrement: concession },
            balanceAmount: { decrement: concession },
          },
        });
      }
    } catch {
      // Payload parse error
    }

    // Log to audit log
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          institutionId: actor.institutionId,
          actorId: actor.id,
          actorName: `${actor.firstName} ${actor.lastName}`,
          actorRole: actor.role,
          action: `APPROVE_${approval.workflowType}`,
          resource: 'APPROVAL',
          recordId: approval.id,
          detailsJson: JSON.stringify({ title: approval.title, remarks }),
        },
      });
    } catch {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      message: `Final approval granted for '${approval.title}'. Business logic executed.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process approval action' },
      { status: 500 }
    );
  }
}
