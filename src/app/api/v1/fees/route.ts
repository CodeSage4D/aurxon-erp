import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [structures, allocations, payments, organization] = await Promise.all([
      prisma.feeStructure.findMany({
        where: { organizationId: user.organizationId },
        include: {
          feeHeads: true,
          classLevel: true,
          course: true,
        },
      }),
      prisma.studentFeeAllocation.findMany({
        where: { organizationId: user.organizationId },
        include: {
          student: {
            include: {
              section: { include: { classLevel: true } },
              batch: true,
            },
          },
          feeStructure: {
            include: {
              feeHeads: true,
            },
          },
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { balanceAmount: 'desc' },
      }),
      prisma.feePayment.findMany({
        where: { organizationId: user.organizationId },
        include: {
          student: {
            include: {
              section: { include: { classLevel: true } },
              studentParents: {
                include: { parent: true },
              },
            },
          },
          allocation: {
            include: {
              feeStructure: {
                include: {
                  feeHeads: true,
                },
              },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
        take: 25,
      }),
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: {
          institutions: {
            include: {
              branches: true,
            },
          },
        },
      }),
    ]);

    const totalGross = allocations.reduce((sum, a) => sum + a.grossAmount, 0);
    const totalCollected = allocations.reduce((sum, a) => sum + a.paidAmount, 0);
    const totalOutstanding = allocations.reduce((sum, a) => sum + a.balanceAmount, 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalGross,
        totalCollected,
        totalOutstanding,
        collectionRate: totalGross > 0 ? ((totalCollected / totalGross) * 100).toFixed(1) : '0.0',
      },
      structures,
      allocations,
      payments,
      organization,
    });
  } catch (error) {
    console.error('[FEES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee data' }, { status: 500 });
  }
}
