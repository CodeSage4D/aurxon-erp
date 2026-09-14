import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const createInquirySchema = z.object({
  applicantName: z.string().min(1, 'Applicant name is required'),
  parentName: z.string().min(1, 'Parent name is required'),
  phone: z.string().min(5, 'Contact phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  targetClass: z.string().optional(),
  targetCourse: z.string().optional(),
  source: z.string().default('WALK_IN'),
  notes: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const inquiries = await prisma.admissionInquiry.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, inquiries });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;
    const count = await prisma.admissionInquiry.count({ where: { organizationId: user.organizationId } });
    const inquiryNumber = `INQ-2026-${String(count + 1).padStart(3, '0')}`;

    // Resolve institution
    let institutionId = user.institutionId;
    if (!institutionId) {
      const inst = await prisma.institution.findFirst({ where: { organizationId: user.organizationId } });
      institutionId = inst?.id;
    }

    if (!institutionId) {
      return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 400 });
    }

    const inquiry = await prisma.admissionInquiry.create({
      data: {
        organizationId: user.organizationId,
        institutionId,
        inquiryNumber,
        applicantName: d.applicantName,
        parentName: d.parentName,
        phone: d.phone,
        email: d.email || null,
        targetClass: d.targetClass || null,
        targetCourse: d.targetCourse || null,
        source: d.source,
        notes: d.notes || null,
        status: 'INQUIRY',
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'ADMISSION_INQUIRY',
      action: 'CREATE',
      recordId: inquiry.id,
      details: { inquiryNumber, applicantName: inquiry.applicantName },
    });

    return NextResponse.json({ success: true, inquiry }, { status: 201 });
  } catch (error) {
    console.error('[INQUIRY_CREATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to record inquiry' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, notes } = body;

    const existing = await prisma.admissionInquiry.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
    }

    const updated = await prisma.admissionInquiry.update({
      where: { id },
      data: {
        status: status ?? existing.status,
        notes: notes ?? existing.notes,
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: existing.institutionId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'ADMISSION_INQUIRY',
      action: 'STATUS_UPDATE',
      recordId: updated.id,
      details: { previousStatus: existing.status, newStatus: updated.status },
    });

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error('[INQUIRY_UPDATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update inquiry' }, { status: 500 });
  }
}
