import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getFallbackUser } from '@/lib/auth-fallbacks';
import { getSecurityActor, getEffectivePermissions } from '@/lib/authorization';

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

  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        organization: true,
        institution: true,
        branch: true,
      },
    });
  } catch (err) {
    console.warn('[AUTH_ME_DB_QUERY_WARN] DB query failed in serverless context, using verified token claims:', err);
  }

  // If found in DB and marked inactive, reject
  if (dbUser && dbUser.status !== 'ACTIVE') {
    const res = NextResponse.json(
      { success: false, error: 'User session invalid or suspended' },
      { status: 401 }
    );
    res.cookies.delete('aurxon_session');
    return res;
  }

  const fallback = getFallbackUser(sessionUser.email);

  let permissions: string[] = [];
  try {
    const actor = await getSecurityActor(sessionUser);
    if (actor) {
      permissions = getEffectivePermissions(actor)
        .filter((p) => p.allowed)
        .map((p) => p.action);
    }
  } catch (err) {
    console.warn('[AUTH_ME_PERMISSIONS_WARN] Failed resolving security actor permissions:', err);
  }

  return NextResponse.json({
    success: true,
    user: {
      id: sessionUser.id,
      name: dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : `${sessionUser.firstName} ${sessionUser.lastName}`,
      email: sessionUser.email,
      role: sessionUser.role,
      actorType: dbUser?.actorType || null,
      scope: dbUser?.scope || null,
      permissions,
      organizationId: sessionUser.organizationId,
      organizationName: dbUser?.organization?.name || fallback?.organizationName || 'Delhi Public School Society',
      institutionId: sessionUser.institutionId,
      institutionName: dbUser?.institution?.name || fallback?.institutionName || 'Delhi Public School, R.K. Puram',
      branchName: dbUser?.branch?.name || fallback?.branchName || 'Senior Wing Campus',
      mustResetPassword: !!dbUser?.mustResetPassword,
      isTemporaryPassword: !!dbUser?.isTemporaryPassword,
    },
  });
}
