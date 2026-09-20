import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getSecurityActor, authorize } from '@/lib/authorization';

const DOCUMENT_SECRET = process.env.JWT_SECRET || 'aurxon-document-signature-secret-2026';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const actor = await getSecurityActor(user);
  if (!actor) {
    return NextResponse.json({ success: false, error: 'User session invalid or suspended' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const docType = searchParams.get('type') || 'staff';

  try {
    if (docType === 'staff') {
      const staffDoc = await prisma.staffDocument.findUnique({
        where: { id: params.id },
        include: { staff: true },
      });

      if (!staffDoc || staffDoc.organizationId !== user.organizationId) {
        return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
      }

      // Self-access or authorized HR access check
      const isSelf = staffDoc.staff.userId === user.id;
      if (!isSelf) {
        const authDecision = authorize(actor, 'staff.view_documents', {
          type: 'STAFF',
          organizationId: staffDoc.organizationId,
          institutionId: staffDoc.staff.institutionId || undefined,
          branchId: staffDoc.staff.branchId || undefined,
        });

        if (!authDecision.allowed) {
          return NextResponse.json(
            { success: false, error: authDecision.reason || 'Forbidden: Access to staff document denied' },
            { status: 403 }
          );
        }
      }

      // Generate 15-minute expiring HMAC-SHA256 signed access signature
      const expiresAt = Date.now() + 15 * 60 * 1000;
      const signaturePayload = `${staffDoc.id}:${user.id}:${expiresAt}`;
      const signature = createHmac('sha256', DOCUMENT_SECRET).update(signaturePayload).digest('hex');

      return NextResponse.json({
        success: true,
        document: {
          id: staffDoc.id,
          title: staffDoc.title,
          documentType: staffDoc.documentType,
          status: staffDoc.status,
          fileUrl: staffDoc.fileUrl,
          downloadToken: signature,
          expiresAt: new Date(expiresAt).toISOString(),
        },
      });
    } else {
      const studentDoc = await prisma.studentDocument.findUnique({
        where: { id: params.id },
        include: { student: { include: { section: true } } },
      });

      if (!studentDoc || studentDoc.organizationId !== user.organizationId) {
        return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
      }

      const authDecision = authorize(actor, 'students.view', {
        type: 'STUDENT',
        organizationId: studentDoc.organizationId,
        institutionId: studentDoc.student.institutionId || undefined,
        branchId: studentDoc.student.branchId || undefined,
        sectionId: studentDoc.student.sectionId || undefined,
        classLevelId: studentDoc.student.section?.classLevelId || undefined,
        studentId: studentDoc.student.id,
      });

      if (!authDecision.allowed) {
        return NextResponse.json(
          { success: false, error: authDecision.reason || 'Forbidden: Access to student document denied' },
          { status: 403 }
        );
      }

      const expiresAt = Date.now() + 15 * 60 * 1000;
      const signaturePayload = `${studentDoc.id}:${user.id}:${expiresAt}`;
      const signature = createHmac('sha256', DOCUMENT_SECRET).update(signaturePayload).digest('hex');

      return NextResponse.json({
        success: true,
        document: {
          id: studentDoc.id,
          title: studentDoc.title,
          documentType: studentDoc.documentType,
          status: studentDoc.status,
          fileUrl: studentDoc.fileUrl,
          downloadToken: signature,
          expiresAt: new Date(expiresAt).toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('[DOCUMENT_DOWNLOAD_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to generate document download token' }, { status: 500 });
  }
}
