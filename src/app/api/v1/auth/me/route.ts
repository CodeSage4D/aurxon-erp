import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    const res = NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
    res.cookies.delete('aurxon_session');
    return res;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      organization: true,
      institution: true,
      branch: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    const res = NextResponse.json(
      { success: false, error: 'User session invalid' },
      { status: 401 }
    );
    res.cookies.delete('aurxon_session');
    return res;
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      institutionId: user.institutionId,
      institutionName: user.institution?.name,
      branchName: user.branch?.name,
    },
  });
}
