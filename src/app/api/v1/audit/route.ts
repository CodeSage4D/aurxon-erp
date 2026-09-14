import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'audit.view')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to inspect audit trails' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource');

  const whereClause: any = {
    organizationId: user.organizationId,
  };

  if (resource && resource !== 'ALL') {
    whereClause.resource = resource;
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('[AUDIT_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch audit records' }, { status: 500 });
  }
}
