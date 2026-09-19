import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const createExamSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  examType: z.enum([
    'UNIT_TEST_1',
    'PERIODIC_TEST_1',
    'HALF_YEARLY',
    'UNIT_TEST_2',
    'PERIODIC_TEST_2',
    'ANNUAL',
    'PRE_BOARD_1',
    'PRE_BOARD_2',
    'MOCK_TEST',
    'BOARD_EXAM',
    'PERIODIC_TEST', // Legacy backward-compatibility
  ]),
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'PUBLISHED']).default('SCHEDULED'),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const exams = await prisma.exam.findMany({
      where: { organizationId: user.organizationId },
      include: {
        academicSession: true,
        examSubjects: {
          include: {
            subject: true,
            section: { include: { classLevel: true } },
            batch: true,
            marksEntries: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ success: true, exams });
  } catch (error) {
    console.error('[EXAMS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch examinations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'exam.manage')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createExamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    let session = await prisma.academicSession.findFirst({
      where: { organizationId: user.organizationId, isCurrent: true },
    });

    if (!session) {
      session = await prisma.academicSession.findFirst({
        where: { organizationId: user.organizationId },
      });
    }

    if (!session) {
      return NextResponse.json({ success: false, error: 'Academic session not found' }, { status: 400 });
    }

    const instId = user.institutionId || session.institutionId;

    const exam = await prisma.exam.create({
      data: {
        organizationId: user.organizationId,
        institutionId: instId,
        academicSessionId: session.id,
        name: d.name,
        examType: d.examType,
        startDate: new Date(d.startDate),
        endDate: new Date(d.endDate),
        status: d.status,
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: instId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'EXAMINATION',
      action: 'CREATE',
      recordId: exam.id,
      details: { name: exam.name, type: exam.examType },
    });

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    console.error('[EXAM_CREATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to create exam' }, { status: 500 });
  }
}
