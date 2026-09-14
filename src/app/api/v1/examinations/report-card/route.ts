import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const examId = searchParams.get('examId');

  if (!studentId || !examId) {
    return NextResponse.json({ success: false, error: 'studentId and examId are required' }, { status: 400 });
  }

  try {
    const [student, exam] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        include: {
          section: { include: { classLevel: true } },
          batch: { include: { course: true } },
          institution: true,
          organization: true,
        },
      }),
      prisma.exam.findUnique({
        where: { id: examId },
        include: {
          examSubjects: {
            include: {
              subject: true,
              marksEntries: { where: { studentId } },
            },
          },
        },
      }),
    ]);

    if (!student || student.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    if (!exam || exam.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    // Build subject report cards
    let totalMaxMarks = 0;
    let totalMarksObtained = 0;
    let allPassed = true;

    const subjects = exam.examSubjects.map((es) => {
      const entry = es.marksEntries[0];
      const marks = entry ? entry.marksObtained : 0;
      const isAbsent = entry ? entry.isAbsent : false;
      const grade = entry?.grade || 'E';
      const isPass = !isAbsent && marks >= es.passMarks;

      if (!isPass) allPassed = false;
      totalMaxMarks += es.maxMarks;
      totalMarksObtained += marks;

      return {
        subjectName: es.subject.name,
        subjectCode: es.subject.code,
        maxMarks: es.maxMarks,
        passMarks: es.passMarks,
        marksObtained: marks,
        grade,
        isAbsent,
        isPass,
      };
    });

    const percentage = totalMaxMarks > 0 ? ((totalMarksObtained / totalMaxMarks) * 100).toFixed(2) : '0.00';

    return NextResponse.json({
      success: true,
      reportCard: {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          classSection: student.section
            ? `${student.section.classLevel?.name} - ${student.section.name}`
            : (student.batch?.name || ''),
        },
        institution: {
          name: student.institution.name,
          board: student.institution.board || 'CBSE',
          address: `${student.institution.address || ''}, ${student.institution.city || ''}`,
        },
        exam: {
          id: exam.id,
          name: exam.name,
          examType: exam.examType,
          status: exam.status,
        },
        subjects,
        summary: {
          totalMaxMarks,
          totalMarksObtained,
          percentage: `${percentage}%`,
          resultStatus: allPassed ? 'PASSED' : 'NEEDS_IMPROVEMENT',
          division: Number(percentage) >= 60 ? 'First Division' : Number(percentage) >= 50 ? 'Second Division' : 'Third Division',
        },
      },
    });
  } catch (error) {
    console.error('[REPORT_CARD_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report card' }, { status: 500 });
  }
}
