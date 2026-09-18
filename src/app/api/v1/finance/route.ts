import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getSecurityActor, authorize } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  paymentMethod: z.string().default('BANK_TRANSFER'),
  referenceNo: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(user);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'Unauthorized security context' }, { status: 401 });
  }

  // Enforce fee.read / finance permissions (Loop 25)
  const decision = authorize(actor, 'fee.read', {
    type: 'ROLE',
    organizationId: actor.organizationId,
  });

  if (!decision.allowed && !hasPermission(actor.role, 'fees.view')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to view financial ledger' }, { status: 403 });
  }

  try {
    const transactions = await prisma.financialTransaction.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const netOperatingBalance = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netOperatingBalance,
      },
      transactions,
    });
  } catch (error) {
    console.error('[FINANCE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch financial ledger' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'finance.manage')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    let instId = user.institutionId;
    if (!instId) {
      const inst = await prisma.institution.findFirst({ where: { organizationId: user.organizationId } });
      instId = inst?.id;
    }

    const tx = await prisma.financialTransaction.create({
      data: {
        organizationId: user.organizationId,
        institutionId: instId || '',
        type: d.type,
        category: d.category,
        amount: d.amount,
        paymentMethod: d.paymentMethod,
        referenceNo: d.referenceNo || null,
        description: d.description,
        recordedById: user.id,
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: instId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'FINANCE',
      action: 'RECORD_TRANSACTION',
      recordId: tx.id,
      details: { type: tx.type, category: tx.category, amount: tx.amount },
    });

    return NextResponse.json({ success: true, transaction: tx }, { status: 201 });
  } catch (error) {
    console.error('[FINANCE_CREATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to record transaction' }, { status: 500 });
  }
}
