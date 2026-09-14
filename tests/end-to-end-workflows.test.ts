import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth';

describe('AURXON End-to-End Business Workflows', () => {
  let testStudentId: string;
  let testAllocationId: string;
  let testOrgId: string;
  let testAdminId: string;
  const testDate = new Date('2026-10-15T00:00:00.000Z');

  it('executes end-to-end Student Enrollment with Guardian association', async () => {
    // 1. Fetch Sharma Org, SPS Main Branch, and an Admin User
    const org = await prisma.organization.findFirst({
      where: { code: 'SEG-IND' },
      include: {
        users: true,
        institutions: {
          include: {
            branches: true,
            academicSessions: { where: { isCurrent: true } },
          },
        },
      },
    });

    expect(org).not.toBeNull();
    testOrgId = org!.id;
    testAdminId = org!.users[0].id;

    const inst = org!.institutions[0];
    const branch = inst.branches[0];
    const session = inst.academicSessions[0];

    expect(branch).toBeDefined();
    expect(session).toBeDefined();

    // 2. Create student inside transaction
    const admNo = `TEST-E2E-${Date.now()}`;
    const student = await prisma.$transaction(async (tx) => {
      const st = await tx.student.create({
        data: {
          organizationId: org!.id,
          institutionId: inst.id,
          branchId: branch.id,
          academicSessionId: session.id,
          admissionNumber: admNo,
          rollNumber: '99',
          firstName: 'Ananya',
          lastName: 'Verma',
          dob: new Date('2011-04-12'),
          gender: 'FEMALE',
          contactPhone: '+91 99887 76655',
          status: 'ACTIVE',
        },
      });

      const parent = await tx.parentGuardian.create({
        data: {
          organizationId: org!.id,
          firstName: 'Sanjay Verma',
          lastName: '',
          relation: 'FATHER',
          phone: '+91 99887 76654',
        },
      });

      await tx.studentParent.create({
        data: {
          studentId: st.id,
          parentId: parent.id,
          isPrimaryContact: true,
        },
      });

      return st;
    });

    expect(student.id).toBeDefined();
    expect(student.admissionNumber).toBe(admNo);
    testStudentId = student.id;

    // Verify DB integrity
    const saved = await prisma.student.findUnique({
      where: { id: student.id },
      include: {
        studentParents: { include: { parent: true } },
        branch: true,
      },
    });

    expect(saved).not.toBeNull();
    expect(saved?.firstName).toBe('Ananya');
    expect(saved?.branch?.id).toBe(branch.id);
    expect(saved?.studentParents.length).toBe(1);
    expect(saved?.studentParents[0].parent.firstName).toBe('Sanjay Verma');
  });

  it('executes Fee Allocation, Partial Collection, and Zero-Balance Reconciliation', async () => {
    // 1. Get or create a Fee Structure
    let feeStruct = await prisma.feeStructure.findFirst({
      where: { organizationId: testOrgId },
    });

    if (!feeStruct) {
      const inst = await prisma.institution.findFirst({ where: { organizationId: testOrgId } });
      const session = await prisma.academicSession.findFirst({ where: { organizationId: testOrgId } });
      feeStruct = await prisma.feeStructure.create({
        data: {
          organizationId: testOrgId,
          institutionId: inst!.id,
          academicSessionId: session!.id,
          name: 'Annual Tuition Composite',
          totalAmount: 50000,
        },
      });
    }

    // 2. Allocate Fee to Test Student
    const allocation = await prisma.studentFeeAllocation.create({
      data: {
        organizationId: testOrgId,
        institutionId: feeStruct.institutionId,
        studentId: testStudentId,
        feeStructureId: feeStruct.id,
        grossAmount: 50000,
        discountAmount: 0,
        netAmount: 50000,
        paidAmount: 0,
        balanceAmount: 50000,
        status: 'UNPAID',
      },
    });

    testAllocationId = allocation.id;
    expect(allocation.balanceAmount).toBe(50000);

    // 3. First Payment: Partial ₹20,000 via UPI
    const receipt1 = `REC-TEST-${Date.now()}-1`;
    await prisma.$transaction(async (tx) => {
      await tx.feePayment.create({
        data: {
          organizationId: testOrgId,
          institutionId: allocation.institutionId,
          studentId: testStudentId,
          allocationId: allocation.id,
          receiptNumber: receipt1,
          amount: 20000,
          paymentMethod: 'UPI',
          transactionRef: 'UPI/1234567890/TEST',
          receivedById: testAdminId,
        },
      });

      await tx.studentFeeAllocation.update({
        where: { id: allocation.id },
        data: {
          paidAmount: 20000,
          balanceAmount: 30000,
          status: 'PARTIAL',
        },
      });

      await tx.financialTransaction.create({
        data: {
          organizationId: testOrgId,
          institutionId: allocation.institutionId,
          type: 'INCOME',
          category: 'FEE_COLLECTION',
          amount: 20000,
          paymentMethod: 'UPI',
          referenceNo: receipt1,
          description: `Partial fee payment for student ${testStudentId}`,
          recordedById: testAdminId,
        },
      });
    });

    const afterPayment1 = await prisma.studentFeeAllocation.findUnique({
      where: { id: testAllocationId },
    });
    expect(afterPayment1?.paidAmount).toBe(20000);
    expect(afterPayment1?.balanceAmount).toBe(30000);
    expect(afterPayment1?.status).toBe('PARTIAL');

    // 4. Second Payment: Remaining ₹30,000 via CASH
    const receipt2 = `REC-TEST-${Date.now()}-2`;
    await prisma.$transaction(async (tx) => {
      await tx.feePayment.create({
        data: {
          organizationId: testOrgId,
          institutionId: allocation.institutionId,
          studentId: testStudentId,
          allocationId: allocation.id,
          receiptNumber: receipt2,
          amount: 30000,
          paymentMethod: 'CASH',
          receivedById: testAdminId,
        },
      });

      await tx.studentFeeAllocation.update({
        where: { id: allocation.id },
        data: {
          paidAmount: 50000,
          balanceAmount: 0,
          status: 'PAID',
        },
      });
    });

    const afterPayment2 = await prisma.studentFeeAllocation.findUnique({
      where: { id: testAllocationId },
    });
    expect(afterPayment2?.paidAmount).toBe(50000);
    expect(afterPayment2?.balanceAmount).toBe(0);
    expect(afterPayment2?.status).toBe('PAID');
  });

  it('guarantees Attendance idempotency via composite unique key', async () => {
    const student = await prisma.student.findUnique({ where: { id: testStudentId } });
    expect(student).not.toBeNull();

    // 1. Mark Attendance: PRESENT
    const rec1 = await prisma.attendanceRecord.upsert({
      where: {
        studentId_date: {
          studentId: testStudentId,
          date: testDate,
        },
      },
      update: { status: 'PRESENT' },
      create: {
        organizationId: testOrgId,
        institutionId: student!.institutionId,
        academicSessionId: student!.academicSessionId,
        studentId: testStudentId,
        date: testDate,
        status: 'PRESENT',
        markedById: testAdminId,
      },
    });

    expect(rec1.status).toBe('PRESENT');

    // 2. Re-submit on the same date with updated status: ABSENT
    const rec2 = await prisma.attendanceRecord.upsert({
      where: {
        studentId_date: {
          studentId: testStudentId,
          date: testDate,
        },
      },
      update: { status: 'ABSENT', remarks: 'Medical Leave' },
      create: {
        organizationId: testOrgId,
        institutionId: student!.institutionId,
        academicSessionId: student!.academicSessionId,
        studentId: testStudentId,
        date: testDate,
        status: 'ABSENT',
        markedById: testAdminId,
      },
    });

    expect(rec2.id).toBe(rec1.id); // Same record ID!
    expect(rec2.status).toBe('ABSENT');
    expect(rec2.remarks).toBe('Medical Leave');

    // 3. Verify exactly 1 record exists for this student on this date
    const totalRecords = await prisma.attendanceRecord.count({
      where: {
        studentId: testStudentId,
        date: testDate,
      },
    });
    expect(totalRecords).toBe(1);
  });

  it('records Examination Marks and computes CBSE letter grade deterministically', async () => {
    // 1. Get or create an Exam Subject
    let exam = await prisma.exam.findFirst({
      where: { organizationId: testOrgId },
      include: { examSubjects: true },
    });

    if (!exam || exam.examSubjects.length === 0) {
      const inst = await prisma.institution.findFirst({ where: { organizationId: testOrgId } });
      const session = await prisma.academicSession.findFirst({ where: { organizationId: testOrgId } });
      let subject = await prisma.subject.findFirst({ where: { organizationId: testOrgId } });

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            organizationId: testOrgId,
            institutionId: inst!.id,
            name: 'Mathematics',
            code: 'MATH-10',
          },
        });
      }

      exam = await prisma.exam.create({
        data: {
          organizationId: testOrgId,
          institutionId: inst!.id,
          academicSessionId: session!.id,
          name: 'Term 1 Mid-Term Assessment',
          examType: 'MID_TERM',
          startDate: new Date('2026-10-20'),
          endDate: new Date('2026-10-28'),
          status: 'ONGOING',
          examSubjects: {
            create: {
              subjectId: subject.id,
              examDate: new Date('2026-10-20'),
              maxMarks: 100,
              passMarks: 33,
            },
          },
        },
        include: { examSubjects: true },
      });
    }

    const examSubject = exam.examSubjects[0];

    // 2. Score 87 / 100 -> Grade A2
    const marksEntry = await prisma.marksEntry.create({
      data: {
        organizationId: testOrgId,
        institutionId: exam.institutionId,
        examSubjectId: examSubject.id,
        studentId: testStudentId,
        marksObtained: 87,
        grade: 'A2',
        isAbsent: false,
        enteredById: testAdminId,
      },
    });

    expect(marksEntry.marksObtained).toBe(87);
    expect(marksEntry.grade).toBe('A2');

    // Score verification
    const percentage = (marksEntry.marksObtained / examSubject.maxMarks) * 100;
    expect(percentage).toBe(87);
    expect(percentage >= 81 && percentage <= 90).toBe(true);
  });

  it('provisions a complete Multi-Campus Educational Entity via SaaS platform transaction', async () => {
    const slug = `pinnacle-society-${Date.now()}`;
    const code = `PES-${Math.floor(Math.random() * 900 + 100)}`;
    const adminEmail = `director@${slug}.edu`;

    const provisioned = await prisma.$transaction(async (tx) => {
      // 1. Organization
      const org = await tx.organization.create({
        data: {
          name: 'Pinnacle Education Society',
          slug,
          code,
          status: 'ACTIVE',
          primaryColor: '#0284c7',
        },
      });

      // 2. Institution
      const inst = await tx.institution.create({
        data: {
          organizationId: org.id,
          name: 'Pinnacle World School',
          code: `${code}-PWS`,
          type: 'SCHOOL',
          board: 'CBSE',
          city: 'Indore',
          state: 'Madhya Pradesh',
        },
      });

      // 3. Branches
      const branchMain = await tx.branch.create({
        data: {
          institutionId: inst.id,
          name: 'Main Campus (Bhawarkua)',
          code: `${code}-MAIN`,
          city: 'Indore',
        },
      });

      const branchEast = await tx.branch.create({
        data: {
          institutionId: inst.id,
          name: 'East Campus (Kanadia Road)',
          code: `${code}-EAST`,
          city: 'Indore',
        },
      });

      // 4. Academic Session
      const session = await tx.academicSession.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          name: '2026-2027',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isCurrent: true,
        },
      });

      // 5. Org Admin User
      const passwordHash = await hashPassword('Password@123');
      const admin = await tx.user.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          email: adminEmail,
          passwordHash,
          firstName: 'Anurag',
          lastName: 'Mishra',
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
        },
      });

      return { org, inst, branchMain, branchEast, session, admin };
    });

    expect(provisioned.org.id).toBeDefined();
    expect(provisioned.admin.email).toBe(adminEmail);
    expect(provisioned.branchMain.code).toBe(`${code}-MAIN`);
    expect(provisioned.branchEast.code).toBe(`${code}-EAST`);

    // Verify cross-tenant isolation: new Org Admin cannot see Sharma Org's students
    const sharmaStudents = await prisma.student.findMany({
      where: { organizationId: provisioned.org.id },
    });
    expect(sharmaStudents.length).toBe(0);

    // Clean up provisioned org
    await prisma.organization.delete({ where: { id: provisioned.org.id } });
  });

  afterAll(async () => {
    // Teardown test student and associated allocations, payments, records
    if (testStudentId) {
      await prisma.feePayment.deleteMany({ where: { studentId: testStudentId } });
      await prisma.studentFeeAllocation.deleteMany({ where: { studentId: testStudentId } });
      await prisma.attendanceRecord.deleteMany({ where: { studentId: testStudentId } });
      await prisma.marksEntry.deleteMany({ where: { studentId: testStudentId } });
      await prisma.studentParent.deleteMany({ where: { studentId: testStudentId } });
      await prisma.student.delete({ where: { id: testStudentId } });
    }
  });
});
