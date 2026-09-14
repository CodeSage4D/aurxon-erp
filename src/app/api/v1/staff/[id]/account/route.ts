import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = ['SUPER_ADMIN', 'ORG_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HR_MANAGER'].includes(user.role);
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const requestedRole = body.role || 'TEACHER';

    const staff = await prisma.staffProfile.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { user: true },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
    }

    const temporaryPassword = `TempPass@${new Date().getFullYear()}!`;
    const passwordHash = await hashPassword(temporaryPassword);

    let userId = staff.userId;

    if (userId) {
      // Existing user: reset password and flag mandatory reset
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustResetPassword: true,
          isTemporaryPassword: true,
          role: requestedRole,
          status: 'ACTIVE',
        },
      });
    } else {
      // Check if user already exists by email
      let existingUser = await prisma.user.findUnique({
        where: { email: staff.email.toLowerCase().trim() },
      });

      if (existingUser) {
        userId = existingUser.id;
        await prisma.user.update({
          where: { id: userId },
          data: {
            passwordHash,
            mustResetPassword: true,
            isTemporaryPassword: true,
            role: requestedRole,
            status: 'ACTIVE',
          },
        });
      } else {
        const newUser = await prisma.user.create({
          data: {
            organizationId: staff.organizationId,
            institutionId: staff.institutionId,
            branchId: staff.branchId,
            email: staff.email.toLowerCase().trim(),
            passwordHash,
            firstName: staff.firstName,
            lastName: staff.lastName,
            role: requestedRole,
            phone: staff.phone,
            status: 'ACTIVE',
            mustResetPassword: true,
            isTemporaryPassword: true,
          },
        });
        userId = newUser.id;
      }

      await prisma.staffProfile.update({
        where: { id: staff.id },
        data: { userId },
      });
    }

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'STAFF_ACCOUNT',
      action: 'PROVISION_TEMPORARY_CREDENTIALS',
      recordId: userId,
      details: {
        staffId: staff.id,
        employeeId: staff.employeeId,
        email: staff.email,
        mustResetPassword: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Temporary ERP credentials generated. Staff must reset password on initial login.',
      credentials: {
        email: staff.email,
        temporaryPassword,
        role: requestedRole,
        mustResetPassword: true,
        isTemporaryPassword: true,
        loginUrl: '/login',
      },
    });
  } catch (error: any) {
    console.error('[STAFF_ACCOUNT_PROVISION_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to provision credentials for staff member' },
      { status: 500 }
    );
  }
}
