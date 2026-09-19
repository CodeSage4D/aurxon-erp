import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
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

  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student || student.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
  }

  const documents = await prisma.studentDocument.findMany({
    where: { studentId: params.id, organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, documents });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'student.update')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student || student.organizationId !== user.organizationId) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
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
        status: 'VERIFIED', // Auto-verified when uploaded by authorized staff
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

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error) {
    console.error('[STUDENT_DOC_UPLOAD_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to upload document' }, { status: 500 });
  }
}
