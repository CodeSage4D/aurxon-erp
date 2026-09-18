import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const collectPaymentSchema = z.object({
  allocationId: z.string().min(1, 'Fee allocation is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'UPI', 'NET_BANKING', 'CHEQUE', 'CARD']),
  transactionRef: z.string().optional().or(z.literal('')),
  remarks: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'fee.collect')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to collect fees' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = collectPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { allocationId, amount, paymentMethod, transactionRef, remarks } = parsed.data;

    // Numerical precision: Round payment amount to 2 decimal places (Loop 17)
    const cleanAmount = Math.round(amount * 100) / 100;
    if (cleanAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Payment amount must be greater than zero' }, { status: 400 });
    }

    // Atomic transaction enforcing concurrency and state-machine rules (Loops 15, 16, 17, 18)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-fetch allocation inside transaction to prevent race conditions
      const allocation = await tx.studentFeeAllocation.findUnique({
        where: { id: allocationId },
        include: {
          student: true,
          feeStructure: true,
        },
      });

      if (!allocation || allocation.organizationId !== user.organizationId) {
        throw new Error('ALLOCATION_NOT_FOUND');
      }

      // Financial State-Machine Guard (Loop 18): Cannot collect fees on fully settled records
      if (allocation.status === 'PAID' || allocation.balanceAmount <= 0) {
        throw new Error('ALREADY_PAID');
      }

      // Mathematical Truth Guard (Loop 17): Cannot exceed live balance
      if (cleanAmount > allocation.balanceAmount) {
        throw new Error(`EXCEEDS_BALANCE:${allocation.balanceAmount}`);
      }

      // Concurrency Safe Receipt Generation (Loop 16)
      const count = await tx.feePayment.count({ where: { organizationId: user.organizationId } });
      const uniqueSuffix = Date.now().toString().slice(-4);
      const receiptNumber = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}-${uniqueSuffix}`;

      // Create payment
      const payment = await tx.feePayment.create({
        data: {
          organizationId: user.organizationId,
          institutionId: allocation.institutionId,
          studentId: allocation.studentId,
          allocationId: allocation.id,
          receiptNumber,
          amount: cleanAmount,
          paymentMethod,
          transactionRef: transactionRef || null,
          receivedById: user.id,
          remarks: remarks || null,
        },
      });

      // Update allocation balances atomically
      const newPaid = Math.round((allocation.paidAmount + cleanAmount) * 100) / 100;
      const newBalance = Math.max(0, Math.round((allocation.balanceAmount - cleanAmount) * 100) / 100);
      const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

      const updatedAllocation = await tx.studentFeeAllocation.update({
        where: { id: allocation.id },
        data: {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus,
        },
      });

      // Mirror to financial ledger as INCOME
      await tx.financialTransaction.create({
        data: {
          organizationId: user.organizationId,
          institutionId: allocation.institutionId,
          type: 'INCOME',
          category: 'FEE_COLLECTION',
          amount: cleanAmount,
          paymentMethod,
          referenceNo: receiptNumber,
          description: `Fee collection for ${allocation.student.firstName} ${allocation.student.lastName} (${receiptNumber})`,
          recordedById: user.id,
        },
      });

      return { payment, updatedAllocation };
    });

    // Immutable Audit Log
    await logAudit({
      organizationId: user.organizationId,
      institutionId: result.payment.institutionId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'FEE_PAYMENT',
      action: 'PAYMENT_COLLECTED',
      recordId: result.payment.id,
      details: {
        receiptNumber: result.payment.receiptNumber,
        studentId: result.payment.studentId,
        amount: cleanAmount,
        paymentMethod,
        remainingBalance: result.updatedAllocation.balanceAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Fee payment of ₹${cleanAmount} collected successfully.`,
      payment: result.payment,
      updatedAllocation: result.updatedAllocation,
    });
  } catch (error: any) {
    if (error?.message === 'ALLOCATION_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Fee allocation record not found' }, { status: 404 });
    }
    if (error?.message === 'ALREADY_PAID') {
      return NextResponse.json({ success: false, error: 'Fee allocation is already fully settled or has zero balance.' }, { status: 400 });
    }
    if (error?.message?.startsWith('EXCEEDS_BALANCE')) {
      const balance = error.message.split(':')[1];
      return NextResponse.json(
        { success: false, error: `Payment amount exceeds current outstanding balance (₹${balance}).` },
        { status: 400 }
      );
    }
    console.error('[FEE_COLLECT_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to process fee payment' }, { status: 500 });
  }
}
