import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'SUMMARY';

  // Fetch institution info
  const institution = await prisma.institution.findFirst({
    where: { organizationId: user.organizationId },
  });

  // Fetch sample students for report generation
  const students = await prisma.student.findMany({
    where: { organizationId: user.organizationId },
    take: 10,
    include: {
      section: {
        include: {
          classLevel: true,
        },
      },
      marksEntries: {
        include: {
          examSubject: {
            include: { subject: true, exam: true },
          },
        },
      },
    },
  });

  // Pre-calculate sample CBSE report card for first student
  const sampleStudent = students[0];
  const sampleReportCard = {
    institutionName: institution?.name || 'Delhi Public School, R.K. Puram',
    affiliationNumber: institution?.affiliationNumber || 'CBSE-DEL-270014',
    board: institution?.board || 'CBSE',
    academicSession: '2025-2026',
    studentName: sampleStudent ? `${sampleStudent.firstName} ${sampleStudent.lastName}` : 'Aarav Sharma',
    admissionNumber: sampleStudent?.admissionNumber || 'DPS-2024-101',
    rollNumber: '10142',
    classAndSection: sampleStudent?.section ? `${sampleStudent.section.classLevel?.name} - ${sampleStudent.section.name}` : 'Class 10 - Section A',
    dob: sampleStudent?.dob ? new Date(sampleStudent.dob).toLocaleDateString('en-IN') : '14-Aug-2009',
    fatherName: 'Dr. Alok Sharma',
    motherName: 'Mrs. Sunita Sharma',
    scholasticSubjects: [
      { subject: 'English Communicative', ptMarks: 9, nbMarks: 5, seaMarks: 5, halfYearlyMarks: 72, total: 91, grade: 'A1' },
      { subject: 'Mathematics (Standard)', ptMarks: 10, nbMarks: 5, seaMarks: 5, halfYearlyMarks: 76, total: 96, grade: 'A1' },
      { subject: 'Science (Physics, Chem, Bio)', ptMarks: 8, nbMarks: 4.5, seaMarks: 5, halfYearlyMarks: 71, total: 88.5, grade: 'A2' },
      { subject: 'Social Science (His, Civ, Geo, Eco)', ptMarks: 9, nbMarks: 5, seaMarks: 5, halfYearlyMarks: 69, total: 88, grade: 'A2' },
      { subject: 'Hindi Course A', ptMarks: 8.5, nbMarks: 4.5, seaMarks: 5, halfYearlyMarks: 73, total: 91, grade: 'A1' },
      { subject: 'Artificial Intelligence & Coding', ptMarks: 10, nbMarks: 5, seaMarks: 5, halfYearlyMarks: 78, total: 98, grade: 'A1' },
    ],
    coScholasticAreas: [
      { area: 'Work Education / SUPW', grade: 'A' },
      { area: 'Art Education (Visual & Performing)', grade: 'A' },
      { area: 'Health & Physical Education (Sports)', grade: 'A' },
      { area: 'Discipline & General Conduct', grade: 'A' },
    ],
    overallPercentage: '92.1%',
    overallGrade: 'A1',
    attendance: '188 / 196 Days (95.9%)',
    remarks: 'Outstanding scholastic performance. Exhibits keen scientific curiosity and leadership acumen.',
    result: 'PROMOTED TO NEXT HIGHER CLASS',
  };

  return NextResponse.json({
    success: true,
    institution,
    sampleReportCard,
    availableReports: [
      {
        id: 'cbse-report-card',
        title: 'CBSE 2-Term Scholastic & Co-Scholastic Report Card',
        format: 'PDF / Printable A4',
        category: 'ACADEMIC',
        description: 'Compliant with CBSE circular guidelines with PT, NB, SEA and Term Exam weightages.',
      },
      {
        id: 'transfer-certificate',
        title: 'Official School Transfer Certificate (TC)',
        format: 'PDF / Security Watermark',
        category: 'LEGAL_DOC',
        description: 'Official Leaving Certificate with UDISE code, conduct grade, and board counter-signature slot.',
      },
      {
        id: 'tabulation-register',
        title: 'Class Tabulation & Master Marks Roll',
        format: 'Excel / CSV / PDF',
        category: 'EXAMINATION',
        description: 'Full roll containing all subject marks, highest, lowest, average, and class rankings.',
      },
      {
        id: 'fee-defaulter-ledger',
        title: 'Fee Dues & Outstanding Balances Statement',
        format: 'Excel / CSV',
        category: 'FINANCE',
        description: 'Detailed defaulters breakdown by class, section, installment head, and days overdue.',
      },
      {
        id: 'attendance-summary-75',
        title: 'CBSE Attendance Eligibility & Shortage Warning (<75%)',
        format: 'PDF / Notice',
        category: 'ATTENDANCE',
        description: 'Students failing to meet mandatory 75% attendance threshold for board exam eligibility.',
      },
    ],
  });
}
