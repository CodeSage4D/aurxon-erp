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

    // 1. Fetch allocation and verify tenant ownership
    const allocation = await prisma.studentFeeAllocation.findUnique({
      where: { id: allocationId },
      include: {
        student: true,
        feeStructure: true,
      },
    });

    if (!allocation || allocation.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, error: 'Fee allocation record not found' }, { status: 404 });
    }

    // 2. Validate amount does not exceed balance
    if (amount > allocation.balanceAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount (₹${amount}) cannot exceed current outstanding balance (₹${allocation.balanceAmount}).`,
        },
        { status: 400 }
      );
    }

    // 3. Generate receipt number
    const count = await prisma.feePayment.count({ where: { organizationId: user.organizationId } });
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // 4. Atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.feePayment.create({
        data: {
          organizationId: user.organizationId,
          institutionId: allocation.institutionId,
          studentId: allocation.studentId,
          allocationId: allocation.id,
          receiptNumber,
          amount,
          paymentMethod,
          transactionRef: transactionRef || null,
          receivedById: user.id,
          remarks: remarks || null,
        },
      });

      // Update allocation balances
      const newPaid = allocation.paidAmount + amount;
      const newBalance = allocation.balanceAmount - amount;
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
          amount,
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
      institutionId: allocation.institutionId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'FEE_PAYMENT',
      action: 'PAYMENT_COLLECTED',
      recordId: result.payment.id,
      details: {
        receiptNumber,
        studentId: allocation.studentId,
        studentName: `${allocation.student.firstName} ${allocation.student.lastName}`,
        amount,
        paymentMethod,
        remainingBalance: result.updatedAllocation.balanceAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Fee payment of ₹${amount} collected successfully.`,
      payment: result.payment,
      updatedAllocation: result.updatedAllocation,
    });
  } catch (error) {
    console.error('[FEE_COLLECT_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to process fee payment' }, { status: 500 });
  }
}
