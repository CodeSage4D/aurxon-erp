import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { getSecurityActor, authorize } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

const resetSchema = z.object({
  newPassword: z.string().min(6).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(sessionUser);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser || (actor.role !== 'SUPER_ADMIN' && targetUser.organizationId !== actor.organizationId)) {
    return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
  }

  // Authorization check: account.update
  const decision = authorize(actor, 'account.update', {
    type: 'ROLE',
    organizationId: targetUser.organizationId,
  });

  if (!decision.allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges to reset credentials' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = resetSchema.safeParse(body);
    const temporaryPassword = parsed.success && parsed.data.newPassword ? parsed.data.newPassword : `Aurxon@${Math.floor(100000 + Math.random() * 900000)}`;

    const passwordHash = await hashPassword(temporaryPassword);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustResetPassword: true,
        isTemporaryPassword: true,
      },
    });

    // Immutable Audit Log - NEVER logs password or hash
    await logAudit({
      organizationId: actor.organizationId,
      institutionId: targetUser.institutionId || undefined,
      actorId: actor.id,
      actorName: `${actor.firstName} ${actor.lastName}`,
      actorRole: actor.role,
      resource: 'ACCOUNT',
      action: 'credential.reset',
      recordId: targetUser.id,
      details: {
        targetEmail: targetUser.email,
        temporaryCredentialsIssued: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Temporary credentials generated successfully. User must reset password on next login.',
      temporaryPassword,
    });
  } catch (error: any) {
    console.error('[CREDENTIAL_RESET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to reset credentials' }, { status: 500 });
  }
}
