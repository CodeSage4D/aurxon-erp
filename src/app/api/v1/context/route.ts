import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser, signToken, COOKIE_NAME } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { organizationId, institutionId, branchId, role } = sessionUser;

    // 1. Fetch available Organizations (Super Admin sees all, others see own)
    const orgs = role === 'SUPER_ADMIN'
      ? await prisma.organization.findMany({ select: { id: true, name: true, code: true } })
      : await prisma.organization.findMany({ where: { id: organizationId }, select: { id: true, name: true, code: true } });

    // 2. Fetch Institutions for the organization
    const institutions = await prisma.institution.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        branches: {
          select: { id: true, name: true, code: true, city: true },
        },
      },
    });

    // 3. Fetch Academic Sessions for the active or first institution
    const activeInstId = institutionId || institutions[0]?.id;
    const sessions = activeInstId
      ? await prisma.academicSession.findMany({
          where: { organizationId, institutionId: activeInstId },
          select: { id: true, name: true, isCurrent: true },
          orderBy: { startDate: 'desc' },
        })
      : [];

    return NextResponse.json({
      success: true,
      currentContext: {
        organizationId,
        institutionId: activeInstId || null,
        branchId: branchId || null,
        academicSessionId: sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || null,
      },
      options: {
        organizations: orgs,
        institutions,
        sessions,
      },
    });
  } catch (err: any) {
    console.error('Error getting context:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { institutionId, branchId, organizationId } = body;

    // Validate permission to switch
    let targetOrgId = sessionUser.organizationId;
    if (organizationId && sessionUser.role === 'SUPER_ADMIN') {
      targetOrgId = organizationId;
    }

    // Verify institution belongs to organization
    let verifiedInstId: string | null = null;
    if (institutionId) {
      const inst = await prisma.institution.findFirst({
        where: { id: institutionId, organizationId: targetOrgId },
      });
      if (inst) verifiedInstId = inst.id;
    }

    // Verify branch belongs to institution
    let verifiedBranchId: string | null = null;
    if (branchId && verifiedInstId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, institutionId: verifiedInstId },
      });
      if (branch) verifiedBranchId = branch.id;
    }

    // Re-sign token with updated context
    const updatedUser = {
      ...sessionUser,
      organizationId: targetOrgId,
      institutionId: verifiedInstId,
      branchId: verifiedBranchId,
    };

    const token = await signToken(updatedUser);

    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace context updated successfully',
      context: {
        organizationId: targetOrgId,
        institutionId: verifiedInstId,
        branchId: verifiedBranchId,
      },
    });
  } catch (err: any) {
    console.error('Error switching context:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
