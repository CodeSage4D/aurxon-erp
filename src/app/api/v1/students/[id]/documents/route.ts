import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getSecurityActor, authorize } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';

const uploadDocumentSchema = z.object({
  documentType: z.enum([
    'BIRTH_CERTIFICATE',
    'AADHAR_CARD',
    'TRANSFER_CERTIFICATE',
    'CASTE_CERTIFICATE',
    'INCOME_CERTIFICATE',
    'MARKSHEET',
    'PASSPORT_PHOTO',
    'OTHER',
  ]),
  title: z.string().min(1, 'Title is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: { section: true },
  });

  if (!student || student.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
  }

  const actor = await getSecurityActor(user);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'User session invalid or suspended' }, { status: 403 });
  }

  const authDecision = authorize(actor, 'students.view', {
    type: 'STUDENT',
    organizationId: student.organizationId,
    institutionId: student.institutionId || undefined,
    branchId: student.branchId || undefined,
    sectionId: student.sectionId || undefined,
    classLevelId: student.section?.classLevelId || undefined,
    studentId: student.id,
  });

  if (!authDecision.allowed) {
    return NextResponse.json({ success: false, error: authDecision.reason || 'Forbidden' }, { status: 403 });
  }

  const documents = await prisma.studentDocument.findMany({
    where: { studentId: params.id, organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  // Map protected download URLs to prevent direct unauthenticated static URL exposure
  const protectedDocs = documents.map((doc) => ({
    ...doc,
    downloadUrl: `/api/v1/documents/${doc.id}/download?type=student`,
  }));

  return NextResponse.json({ success: true, documents: protectedDocs });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: { section: true },
  });

  if (!student || student.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
  }

  const actor = await getSecurityActor(user);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'User session invalid or suspended' }, { status: 403 });
  }

  const authDecision = authorize(actor, 'students.edit', {
    type: 'STUDENT',
    organizationId: student.organizationId,
    institutionId: student.institutionId || undefined,
    branchId: student.branchId || undefined,
    sectionId: student.sectionId || undefined,
    classLevelId: student.section?.classLevelId || undefined,
    studentId: student.id,
  });

  if (!authDecision.allowed) {
    return NextResponse.json({ success: false, error: authDecision.reason || 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = uploadDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const doc = await prisma.studentDocument.create({
      data: {
        studentId: params.id,
        organizationId: user.organizationId,
        documentType: parsed.data.documentType,
        title: parsed.data.title,
        fileUrl: parsed.data.fileUrl,
        fileSize: parsed.data.fileSize || null,
        mimeType: parsed.data.mimeType || null,
        status: 'VERIFIED',
        verifiedByUserId: user.id,
        verifiedAt: new Date(),
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: user.institutionId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'STUDENT_DOCUMENT',
      action: 'UPLOAD',
      recordId: doc.id,
      details: { studentId: params.id, documentType: doc.documentType, title: doc.title },
    });

    return NextResponse.json({
      success: true,
      document: {
        ...doc,
        downloadUrl: `/api/v1/documents/${doc.id}/download?type=student`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[STUDENT_DOC_UPLOAD_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to upload document' }, { status: 500 });
  }
}
