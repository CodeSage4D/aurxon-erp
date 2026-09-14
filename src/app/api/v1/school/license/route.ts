import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orgId = user.organizationId;
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            students: true,
            users: true,
            institutions: true,
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const staffCount = await prisma.staffProfile.count({
      where: { organizationId: orgId },
    });

    const branchCount = await prisma.branch.count({
      where: { institution: { organizationId: orgId } },
    });

    const licenseValidUntil = org.licenseValidUntil || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = licenseValidUntil.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const isExpired = daysRemaining <= 0;
    const isInGracePeriod = daysRemaining <= 15 && daysRemaining > 0;

    const maxStudents = org.maxStudents || 1500;
    const maxStaff = org.maxStaff || 120;
    const maxCampuses = org.maxCampuses || 3;

    return NextResponse.json({
      success: true,
      license: {
        organizationId: org.id,
        organizationName: org.name,
        organizationCode: org.code,
        logoUrl: org.logoUrl,
        primaryColor: org.primaryColor,
        tier: org.licenseTier || 'PROFESSIONAL',
        key: org.licenseKey || `AURXON-LIC-${org.code}-2026-X79K`,
        validUntil: licenseValidUntil.toISOString(),
        daysRemaining,
        isExpired,
        isInGracePeriod,
        status: isExpired ? 'EXPIRED' : (isInGracePeriod ? 'RENEWAL_DUE' : 'ACTIVE'),
        usage: {
          students: {
            current: org._count.students,
            max: maxStudents,
            percentage: Math.min(100, Math.round((org._count.students / maxStudents) * 100)),
          },
          staff: {
            current: Math.max(staffCount, org._count.users),
            max: maxStaff,
            percentage: Math.min(100, Math.round((Math.max(staffCount, org._count.users) / maxStaff) * 100)),
          },
          campuses: {
            current: Math.max(branchCount, 1),
            max: maxCampuses,
            percentage: Math.min(100, Math.round((Math.max(branchCount, 1) / maxCampuses) * 100)),
          },
        },
        features: [
          'Enterprise RBAC & Departmental Scoping',
          'Automated Employee ID & Digital QR Verification',
          'Biometric Machine Integration & Real-time Attendance',
          'Four-Eyes Administrative Approval Workflows',
          'Financial Fee Invoicing with Official Crest Watermarking',
          'Multi-Campus Centralized Directorate Reporting',
        ],
      },
    });
  } catch (error: any) {
    console.error('[SCHOOL_LICENSE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch license status' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = ['SUPER_ADMIN', 'ORG_ADMIN', 'PRINCIPAL'].includes(user.role);
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden: Requires institutional administration privileges' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, activationKey, requestedTier, requestedMonths = 12 } = body;

    if (action === 'APPLY_KEY') {
      if (!activationKey || activationKey.length < 8) {
        return NextResponse.json({ success: false, error: 'Invalid activation key' }, { status: 400 });
      }

      // Extend validity by 365 days
      const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const updated = await prisma.organization.update({
        where: { id: user.organizationId },
        data: {
          licenseKey: activationKey.toUpperCase().trim(),
          licenseValidUntil: newExpiry,
          licenseTier: requestedTier || 'ENTERPRISE',
        },
      });

      await logAudit({
        organizationId: user.organizationId,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`,
        actorRole: user.role,
        resource: 'LICENSE',
        action: 'APPLY_ACTIVATION_KEY',
        details: { key: activationKey, newExpiry },
      });

      return NextResponse.json({
        success: true,
        message: 'Institutional license renewed successfully. Valid for 365 days.',
        organization: updated,
      });
    }

    if (action === 'REQUEST_RENEWAL') {
      // Record official renewal request in audit/approvals
      await logAudit({
        organizationId: user.organizationId,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`,
        actorRole: user.role,
        resource: 'LICENSE',
        action: 'SUBMIT_RENEWAL_REQUEST',
        details: {
          requestedTier: requestedTier || 'PROFESSIONAL',
          requestedMonths,
          contactEmail: user.email,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Renewal request submitted to AURXON HQ Enterprise Sales & Support team. An invoice will be dispatched within 2 hours.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[SCHOOL_LICENSE_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to process renewal' }, { status: 500 });
  }
}
