import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const rawId = decodeURIComponent(params.id);

    // Look up by either ID or Employee ID (case-insensitive)
    const profile = await prisma.staffProfile.findFirst({
      where: {
        OR: [
          { id: rawId },
          { employeeId: rawId },
          { employeeId: rawId.toUpperCase() },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            board: true,
            city: true,
            state: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        responsibilities: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            responsibilityType: true,
            title: true,
            scopeLevel: true,
            validFrom: true,
            validUntil: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credential Not Found',
          message: 'The scanned badge or staff identification does not match an active AURXON ERP institutional record.',
        },
        { status: 404 }
      );
    }

    // Tamper-evident cryptographic verification seal
    const sealData = `${profile.organizationId}|${profile.employeeId}|${profile.firstName}|${profile.lastName}|${profile.designation}|${profile.status}`;
    const digitalSignature = crypto.createHash('sha256').update(sealData).digest('hex').substring(0, 24).toUpperCase();

    const verifiedCredential = {
      verified: true,
      verificationStatus: profile.status === 'ACTIVE' ? 'AUTHENTIC_AND_ACTIVE' : 'INACTIVE_OR_FORMER',
      digitalSignature: `AURXON-SEAL-${digitalSignature}`,
      verifiedTimestamp: new Date().toISOString(),
      staff: {
        employeeId: profile.employeeId,
        fullName: `${profile.firstName} ${profile.lastName}`,
        designation: profile.designation,
        department: profile.department,
        employmentType: profile.employmentType,
        joiningDate: profile.joiningDate.toISOString().split('T')[0],
        status: profile.status,
        avatarUrl: profile.avatarUrl,
      },
      institution: {
        schoolName: profile.organization.name,
        schoolCode: profile.organization.code,
        schoolLogo: profile.organization.logoUrl || null,
        campusName: profile.branch?.name || profile.institution.name,
        affiliationBoard: profile.institution.board || 'CBSE',
        city: profile.branch?.city || profile.institution.city,
      },
      activeRoles: profile.responsibilities.map((r) => ({
        title: r.title,
        type: r.responsibilityType,
        scope: r.scopeLevel,
      })),
    };

    return NextResponse.json({ success: true, credential: verifiedCredential });
  } catch (error: any) {
    console.error('[VERIFY_STAFF_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Verification service error' },
      { status: 500 }
    );
  }
}
