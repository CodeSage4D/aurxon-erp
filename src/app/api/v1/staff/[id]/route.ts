import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeStaffRecord } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    const profile = await prisma.staffProfile.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            mustResetPassword: true,
            isTemporaryPassword: true,
            lastLoginAt: true,
          },
        },
        organization: {
          select: {
            name: true,
            code: true,
            logoUrl: true,
          },
        },
        institution: {
          select: {
            name: true,
            type: true,
            board: true,
          },
        },
        branch: {
          select: {
            name: true,
            city: true,
          },
        },
        education: true,
        experience: true,
        teachingExperience: true,
        skills: true,
        certifications: true,
        documents: true,
        responsibilities: {
          orderBy: { createdAt: 'desc' },
        },
        careerTimeline: {
          orderBy: { effectiveDate: 'desc' },
        },
        leaveRequests: {
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Staff profile not found' }, { status: 404 });
    }

    const canViewSensitive = ['SUPER_ADMIN', 'ORG_ADMIN', 'PRINCIPAL', 'HR_MANAGER', 'ACCOUNTANT'].includes(user.role);
    const sanitized = sanitizeStaffRecord(profile, canViewSensitive);

    return NextResponse.json({
      success: true,
      staff: {
        ...sanitized,
        name: `${profile.firstName} ${profile.lastName}`,
        empId: profile.employeeId,
      },
    });
  } catch (error: any) {
    console.error('[STAFF_DETAIL_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve staff details' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = ['SUPER_ADMIN', 'ORG_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HR_MANAGER'].includes(user.role);
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await req.json();

    const existing = await prisma.staffProfile.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Staff profile not found' }, { status: 404 });
    }

    const {
      firstName,
      lastName,
      phone,
      department,
      designation,
      status,
      address,
      city,
      state,
      pincode,
      basicSalary,
      bankName,
      bankAccountNumber,
      bankIfsc,
    } = body;

    const updated = await prisma.staffProfile.update({
      where: { id },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(phone ? { phone } : {}),
        ...(department ? { department } : {}),
        ...(designation ? { designation } : {}),
        ...(status ? { status } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(state !== undefined ? { state } : {}),
        ...(pincode !== undefined ? { pincode } : {}),
        ...(basicSalary !== undefined ? { basicSalary: parseFloat(basicSalary) } : {}),
        ...(bankName !== undefined ? { bankName } : {}),
        ...(bankAccountNumber !== undefined ? { bankAccountNumber } : {}),
        ...(bankIfsc !== undefined ? { bankIfsc } : {}),
      },
    });

    // Record career timeline event if designation or status changed
    if ((designation && designation !== existing.designation) || (status && status !== existing.status)) {
      await prisma.staffCareerEvent.create({
        data: {
          staffId: id,
          eventType: status && status !== existing.status ? (status === 'PROMOTED' ? 'PROMOTED' : 'ROLE_CHANGE') : 'ROLE_CHANGE',
          title: `Role updated to ${designation || existing.designation}`,
          description: `Updated by ${user.firstName} ${user.lastName} (${user.role}). Status: ${status || existing.status}`,
          createdById: user.id,
        },
      });
    }

    await logAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'STAFF',
      action: 'UPDATE_STAFF_PROFILE',
      recordId: id,
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff profile updated successfully',
      staff: updated,
    });
  } catch (error: any) {
    console.error('[STAFF_PATCH_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update staff profile' }, { status: 500 });
  }
}
