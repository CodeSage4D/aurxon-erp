import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

function calculateGrade(marks: number, maxMarks: number = 100): string {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 91) return 'A1';
  if (percentage >= 81) return 'A2';
  if (percentage >= 71) return 'B1';
  if (percentage >= 61) return 'B2';
  if (percentage >= 51) return 'C1';
  if (percentage >= 41) return 'C2';
  if (percentage >= 33) return 'D';
  return 'E';
}

const submitMarksSchema = z.object({
  examSubjectId: z.string().min(1),
  entries: z.array(
    z.object({
      studentId: z.string(),
      marksObtained: z.number().min(0),
      isAbsent: z.boolean().default(false),
      remarks: z.string().optional(),
    })
  ),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examSubjectId = searchParams.get('examSubjectId');

  if (!examSubjectId) {
    return NextResponse.json({ success: false, error: 'examSubjectId query parameter required' }, { status: 400 });
  }

  try {
    const examSubject = await prisma.examSubject.findUnique({
      where: { id: examSubjectId },
      include: {
        subject: true,
        exam: true,
        section: {
          include: {
            classLevel: true,
            students: { where: { status: 'ACTIVE' }, orderBy: { rollNumber: 'asc' } },
          },
        },
        batch: {
          include: {
            students: { where: { status: 'ACTIVE' }, orderBy: { rollNumber: 'asc' } },
          },
        },
        marksEntries: true,
      },
    });

    if (!examSubject) {
      return NextResponse.json({ success: false, error: 'Exam paper not found' }, { status: 404 });
    }

    const marksMap = new Map(examSubject.marksEntries.map((m) => [m.studentId, m]));
    const students = examSubject.section?.students || examSubject.batch?.students || [];

    const roster = students.map((st) => {
      const entry = marksMap.get(st.id);
      return {
        studentId: st.id,
        rollNumber: st.rollNumber,
        name: `${st.firstName} ${st.lastName}`,
        admissionNumber: st.admissionNumber,
        marksObtained: entry?.marksObtained ?? 0,
        grade: entry?.grade ?? '',
        isAbsent: entry?.isAbsent ?? false,
        remarks: entry?.remarks ?? '',
        isEntered: !!entry,
      };
    });

    return NextResponse.json({
      success: true,
      examSubject: {
        id: examSubject.id,
        subjectName: examSubject.subject.name,
        maxMarks: examSubject.maxMarks,
        passMarks: examSubject.passMarks,
      },
      roster,
    });
  } catch (error) {
    console.error('[MARKS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch marks sheet' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'exam.enter_marks')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = submitMarksSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { examSubjectId, entries } = parsed.data;

    const examSubject = await prisma.examSubject.findUnique({
      where: { id: examSubjectId },
      include: { exam: true, subject: true },
    });

    if (!examSubject) {
      return NextResponse.json({ success: false, error: 'Exam subject not found' }, { status: 404 });
    }

    // Validate marks do not exceed maxMarks
    for (const ent of entries) {
      if (ent.marksObtained > examSubject.maxMarks) {
        return NextResponse.json(
          { success: false, error: `Marks obtained (${ent.marksObtained}) cannot exceed Maximum Marks (${examSubject.maxMarks}).` },
          { status: 400 }
        );
      }
    }

    let instId = user.institutionId || examSubject.exam.institutionId;

    // Transactional save of marks entries with deterministic grades
    await prisma.$transaction(async (tx) => {
      for (const ent of entries) {
        const grade = ent.isAbsent ? 'AB' : calculateGrade(ent.marksObtained, examSubject.maxMarks);

        await tx.marksEntry.upsert({
          where: {
            examSubjectId_studentId: {
              examSubjectId,
              studentId: ent.studentId,
            },
          },
          update: {
            marksObtained: ent.isAbsent ? 0 : ent.marksObtained,
            isAbsent: ent.isAbsent,
            grade,
            remarks: ent.remarks || null,
            enteredById: user.id,
          },
          create: {
            organizationId: user.organizationId,
            institutionId: instId,
            examSubjectId,
            studentId: ent.studentId,
            marksObtained: ent.isAbsent ? 0 : ent.marksObtained,
            isAbsent: ent.isAbsent,
            grade,
            remarks: ent.remarks || null,
            enteredById: user.id,
          },
        });
      }
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: instId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'EXAMINATION_MARKS',
      action: 'ENTER_MARKS',
      recordId: examSubjectId,
      details: { subject: examSubject.subject.name, totalEntries: entries.length },
    });

    return NextResponse.json({
      success: true,
      message: `Marks successfully entered and computed for ${entries.length} students.`,
    });
  } catch (error) {
    console.error('[MARKS_SAVE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to record marks' }, { status: 500 });
  }
}
