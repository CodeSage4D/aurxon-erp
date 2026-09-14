import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [subjects, teachers] = await Promise.all([
    prisma.subject.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: { in: ['TEACHER', 'FACULTY'] },
        status: 'ACTIVE',
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
      orderBy: { firstName: 'asc' },
    }),
  ]);

  return NextResponse.json({ success: true, subjects, teachers });
}
