import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateCBSEGrade, calculateDivision } from '@/lib/cbse-grading';

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

    // Build subject report cards using CBSE 9-Point Engine
    let totalMaxMarks = 0;
    let totalMarksObtained = 0;
    let totalGradePoints = 0;
    let allPassed = true;

    const subjects = exam.examSubjects.map((es) => {
      const entry = es.marksEntries[0];
      const marks = entry ? entry.marksObtained : 0;
      const isAbsent = entry ? entry.isAbsent : false;
      
      const cbseInfo = calculateCBSEGrade(marks, es.maxMarks);
      const grade = entry?.grade || cbseInfo.grade;
      const isPass = !isAbsent && cbseInfo.isPass && marks >= es.passMarks;

      if (!isPass) allPassed = false;
      totalMaxMarks += es.maxMarks;
      totalMarksObtained += marks;
      totalGradePoints += cbseInfo.gradePoint;

      return {
        subjectName: es.subject.name,
        subjectCode: es.subject.code,
        maxMarks: es.maxMarks,
        passMarks: es.passMarks,
        marksObtained: marks,
        grade,
        gradePoint: cbseInfo.gradePoint,
        description: cbseInfo.description,
        isAbsent,
        isPass,
      };
    });

    const percentageVal = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
    const percentage = percentageVal.toFixed(2);
    const cgpa = subjects.length > 0 ? (totalGradePoints / subjects.length).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      reportCard: {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          fatherName: student.fatherName || 'N/A',
          motherName: student.motherName || 'N/A',
          dob: student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A',
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber || 'N/A',
          aadharNumber: student.aadharNumber || 'N/A',
          category: student.casteCategory || student.category || 'GENERAL',
          classSection: student.section
            ? `${student.section.classLevel?.name} - ${student.section.name}`
            : (student.batch?.name || ''),
        },
        institution: {
          name: student.institution.name,
          board: student.schoolBoard || student.institution.board || 'CBSE',
          address: `${student.institution.address || ''}, ${student.institution.city || ''}`,
          affiliationNumber: student.institution.affiliationNumber || 'CBSE/AFF/2026/AUR',
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
          cgpa,
          resultStatus: allPassed ? 'PASSED' : 'NEEDS_IMPROVEMENT',
          division: calculateDivision(percentageVal),
        },
      },
    });
  } catch (error) {
    console.error('[REPORT_CARD_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report card' }, { status: 500 });
  }
}
