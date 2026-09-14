import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for AURXON ERP...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.studentFeeAllocation.deleteMany();
  await prisma.feeHead.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.marksEntry.deleteMany();
  await prisma.examSubject.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.admissionInquiry.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.parentGuardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subjectAssignment.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.course.deleteMany();
  await prisma.section.deleteMany();
  await prisma.classLevel.deleteMany();
  await prisma.academicSession.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.moduleEntitlement.deleteMany();
  await prisma.organization.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // --------------------------------------------------------------------------
  // ORGANIZATION 1: DELHI PUBLIC SCHOOL SOCIETY (K-12 SCHOOL CHAIN)
  // --------------------------------------------------------------------------
  const orgDPS = await prisma.organization.create({
    data: {
      name: 'Delhi Public School Society',
      slug: 'dps-society',
      code: 'DPS-ORG',
      primaryColor: '#0f766e', // Deep Teal
      status: 'ACTIVE',
    },
  });

  // Module Entitlements for DPS
  await prisma.moduleEntitlement.createMany({
    data: [
      { organizationId: orgDPS.id, moduleName: 'TRANSPORT', isEnabled: true },
      { organizationId: orgDPS.id, moduleName: 'LIBRARY', isEnabled: true },
      { organizationId: orgDPS.id, moduleName: 'HOSTEL', isEnabled: false },
      { organizationId: orgDPS.id, moduleName: 'INVENTORY', isEnabled: true },
      { organizationId: orgDPS.id, moduleName: 'PAYROLL', isEnabled: true },
      { organizationId: orgDPS.id, moduleName: 'LMS', isEnabled: false },
    ],
  });

  // Institution 1: DPS R.K. Puram
  const instDPS = await prisma.institution.create({
    data: {
      organizationId: orgDPS.id,
      name: 'Delhi Public School, R.K. Puram',
      code: 'DPS-RKP',
      type: 'SCHOOL',
      board: 'CBSE',
      affiliationNumber: 'CBSE-DEL-270014',
      email: 'contact@dpsrkp.net',
      phone: '+91 11 4911 5500',
      address: 'Sector 12, R.K. Puram',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110022',
      currency: 'INR',
      currencySymbol: '₹',
    },
  });

  const branchDPSMain = await prisma.branch.create({
    data: {
      institutionId: instDPS.id,
      name: 'Senior Wing Campus',
      code: 'DPS-RKP-SNR',
      address: 'Sector 12, R.K. Puram',
      city: 'New Delhi',
      state: 'Delhi',
      phone: '+91 11 4911 5501',
    },
  });

  // Academic Session 2025-2026
  const session2025 = await prisma.academicSession.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      name: '2025-2026',
      startDate: new Date('2025-04-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.000Z'),
      isCurrent: true,
    },
  });

  // Users for DPS
  const userSuperAdmin = await prisma.user.create({
    data: {
      organizationId: orgDPS.id,
      email: 'superadmin@aurxon.io',
      passwordHash: defaultPasswordHash,
      firstName: 'Vikramaditya',
      lastName: 'Singhania',
      phone: '+91 98100 00001',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const userOrgAdmin = await prisma.user.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      email: 'admin@dps-society.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Rajesh',
      lastName: 'Malhotra',
      phone: '+91 98111 22334',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
    },
  });

  const userPrincipal = await prisma.user.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      email: 'principal.rkp@dps-society.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Dr. Meenakshi',
      lastName: 'Sundaram',
      phone: '+91 98112 33445',
      role: 'PRINCIPAL',
      status: 'ACTIVE',
    },
  });

  const userTeacherMath = await prisma.user.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      email: 'teacher.math@dps-society.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Amit',
      lastName: 'Kulkarni',
      phone: '+91 98223 44556',
      role: 'TEACHER',
      status: 'ACTIVE',
    },
  });

  const userTeacherScience = await prisma.user.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      email: 'teacher.science@dps-society.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Sunita',
      lastName: 'Deshmukh',
      phone: '+91 98334 55667',
      role: 'TEACHER',
      status: 'ACTIVE',
    },
  });

  const userAccountant = await prisma.user.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      email: 'accountant@dps-society.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Ramesh',
      lastName: 'Bansal',
      phone: '+91 98445 66778',
      role: 'ACCOUNTANT',
      status: 'ACTIVE',
    },
  });

  const userParent = await prisma.user.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      email: 'parent.aarav@gmail.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Sanjay',
      lastName: 'Sharma',
      phone: '+91 98188 99001',
      role: 'PARENT',
      status: 'ACTIVE',
    },
  });

  const userStudent = await prisma.user.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      email: 'student.aarav@dps-society.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '+91 98188 99002',
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  // Class Levels & Sections for School
  const class10 = await prisma.classLevel.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      name: 'Class 10',
      code: '10',
      displayOrder: 10,
    },
  });

  const class9 = await prisma.classLevel.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      name: 'Class 9',
      code: '9',
      displayOrder: 9,
    },
  });

  const sec10A = await prisma.section.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      classLevelId: class10.id,
      name: 'Section A',
      roomNumber: 'Room 204',
    },
  });

  const sec10B = await prisma.section.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      classLevelId: class10.id,
      name: 'Section B',
      roomNumber: 'Room 205',
    },
  });

  const sec9A = await prisma.section.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      classLevelId: class9.id,
      name: 'Section A',
      roomNumber: 'Room 104',
    },
  });

  // Subjects
  const subMath = await prisma.subject.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      name: 'Mathematics',
      code: 'MATH-10',
      type: 'THEORY',
    },
  });

  const subScience = await prisma.subject.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      name: 'Science (Physics & Chem)',
      code: 'SCI-10',
      type: 'HYBRID',
    },
  });

  const subEnglish = await prisma.subject.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      name: 'English Language & Lit',
      code: 'ENG-10',
      type: 'THEORY',
    },
  });

  const subSocial = await prisma.subject.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      name: 'Social Studies',
      code: 'SST-10',
      type: 'THEORY',
    },
  });

  // Subject Assignments
  await prisma.subjectAssignment.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      academicSessionId: session2025.id,
      subjectId: subMath.id,
      teacherId: userTeacherMath.id,
      sectionId: sec10A.id,
    },
  });

  await prisma.subjectAssignment.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      academicSessionId: session2025.id,
      subjectId: subScience.id,
      teacherId: userTeacherScience.id,
      sectionId: sec10A.id,
    },
  });

  // Students in Class 10-A
  const studentAarav = await prisma.student.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      academicSessionId: session2025.id,
      sectionId: sec10A.id,
      admissionNumber: 'DPS-2025-001',
      rollNumber: '1',
      firstName: 'Aarav',
      lastName: 'Sharma',
      dob: new Date('2010-05-14T00:00:00.000Z'),
      gender: 'MALE',
      bloodGroup: 'B+',
      category: 'GENERAL',
      nationality: 'Indian',
      address: 'D-42, Hauz Khas Enclave',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      contactPhone: '+91 98188 99001',
      email: 'student.aarav@dps-society.edu',
      status: 'ACTIVE',
    },
  });

  const studentAnanya = await prisma.student.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      academicSessionId: session2025.id,
      sectionId: sec10A.id,
      admissionNumber: 'DPS-2025-002',
      rollNumber: '2',
      firstName: 'Ananya',
      lastName: 'Iyer',
      dob: new Date('2010-08-22T00:00:00.000Z'),
      gender: 'FEMALE',
      bloodGroup: 'O+',
      category: 'GENERAL',
      nationality: 'Indian',
      address: 'B-108, Vasant Vihar',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110057',
      contactPhone: '+91 98101 22334',
      email: 'ananya.iyer@gmail.com',
      status: 'ACTIVE',
    },
  });

  const studentRohan = await prisma.student.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      academicSessionId: session2025.id,
      sectionId: sec10A.id,
      admissionNumber: 'DPS-2025-003',
      rollNumber: '3',
      firstName: 'Rohan',
      lastName: 'Verma',
      dob: new Date('2010-02-18T00:00:00.000Z'),
      gender: 'MALE',
      bloodGroup: 'A+',
      category: 'OBC',
      nationality: 'Indian',
      address: 'C-5/23, Safdarjung Development Area',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      contactPhone: '+91 98112 44556',
      email: 'rohan.verma@gmail.com',
      status: 'ACTIVE',
    },
  });

  const studentPriya = await prisma.student.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      academicSessionId: session2025.id,
      sectionId: sec10A.id,
      admissionNumber: 'DPS-2025-004',
      rollNumber: '4',
      firstName: 'Priya',
      lastName: 'Patel',
      dob: new Date('2010-11-05T00:00:00.000Z'),
      gender: 'FEMALE',
      bloodGroup: 'AB+',
      category: 'GENERAL',
      nationality: 'Indian',
      address: 'Flat 402, Green Glen Towers, Saket',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110017',
      contactPhone: '+91 98123 66778',
      email: 'priya.patel@gmail.com',
      status: 'ACTIVE',
    },
  });

  const studentKabir = await prisma.student.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      branchId: branchDPSMain.id,
      academicSessionId: session2025.id,
      sectionId: sec10B.id,
      admissionNumber: 'DPS-2025-005',
      rollNumber: '1',
      firstName: 'Kabir',
      lastName: 'Mehta',
      dob: new Date('2010-03-30T00:00:00.000Z'),
      gender: 'MALE',
      bloodGroup: 'O-',
      category: 'GENERAL',
      nationality: 'Indian',
      address: 'House 14, Golf Links',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110003',
      contactPhone: '+91 98134 77889',
      status: 'ACTIVE',
    },
  });

  // Parent Profile for Aarav's father
  const parentProfile = await prisma.parentGuardian.create({
    data: {
      organizationId: orgDPS.id,
      userId: userParent.id,
      firstName: 'Sanjay',
      lastName: 'Sharma',
      relation: 'FATHER',
      phone: '+91 98188 99001',
      email: 'parent.aarav@gmail.com',
      occupation: 'Chartered Accountant',
      annualIncome: '₹28,00,000',
    },
  });

  await prisma.studentParent.create({
    data: {
      studentId: studentAarav.id,
      parentId: parentProfile.id,
      isPrimaryContact: true,
      isEmergencyContact: true,
    },
  });

  // 14 Days of Realistic Attendance for Class 10-A
  const students10A = [studentAarav, studentAnanya, studentRohan, studentPriya];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const attDate = new Date();
    attDate.setDate(today.getDate() - i);
    attDate.setHours(9, 0, 0, 0);

    // Skip Sundays
    if (attDate.getDay() === 0) continue;

    for (const st of students10A) {
      let status = 'PRESENT';
      let remarks = undefined;

      // Realistic variation: Rohan absent on 2 days ago; Priya late 5 days ago
      if (st.id === studentRohan.id && i === 2) {
        status = 'ABSENT';
        remarks = 'Fever reported by parent';
      } else if (st.id === studentPriya.id && i === 5) {
        status = 'LATE';
        remarks = 'Arrived 20 mins late due to traffic';
      }

      await prisma.attendanceRecord.create({
        data: {
          organizationId: orgDPS.id,
          institutionId: instDPS.id,
          academicSessionId: session2025.id,
          studentId: st.id,
          sectionId: sec10A.id,
          date: attDate,
          status,
          remarks,
          markedById: userTeacherMath.id,
        },
      });
    }
  }

  // Timetable for Class 10-A (Mon - Fri)
  const days = [1, 2, 3, 4, 5];
  for (const day of days) {
    // Period 1: Maths
    await prisma.timetableSlot.create({
      data: {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        academicSessionId: session2025.id,
        dayOfWeek: day,
        periodNumber: 1,
        startTime: '08:00',
        endTime: '08:45',
        subjectId: subMath.id,
        teacherId: userTeacherMath.id,
        sectionId: sec10A.id,
        roomNumber: 'Room 204',
      },
    });

    // Period 2: Science
    await prisma.timetableSlot.create({
      data: {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        academicSessionId: session2025.id,
        dayOfWeek: day,
        periodNumber: 2,
        startTime: '08:50',
        endTime: '09:35',
        subjectId: subScience.id,
        teacherId: userTeacherScience.id,
        sectionId: sec10A.id,
        roomNumber: 'Physics Lab 1',
      },
    });

    // Period 3: English
    await prisma.timetableSlot.create({
      data: {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        academicSessionId: session2025.id,
        dayOfWeek: day,
        periodNumber: 3,
        startTime: '09:50',
        endTime: '10:35',
        subjectId: subEnglish.id,
        teacherId: userTeacherMath.id, // Assigned
        sectionId: sec10A.id,
        roomNumber: 'Room 204',
      },
    });
  }

  // Examination: Term 1 Mid-Year Examination
  const examTerm1 = await prisma.exam.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      academicSessionId: session2025.id,
      name: 'Term-1 Mid-Year Examination 2025',
      examType: 'HALF_YEARLY',
      startDate: new Date('2025-09-10T00:00:00.000Z'),
      endDate: new Date('2025-09-20T00:00:00.000Z'),
      status: 'PUBLISHED',
    },
  });

  const examSubMath = await prisma.examSubject.create({
    data: {
      examId: examTerm1.id,
      subjectId: subMath.id,
      sectionId: sec10A.id,
      maxMarks: 100,
      passMarks: 33,
      examDate: new Date('2025-09-12T09:00:00.000Z'),
    },
  });

  const examSubScience = await prisma.examSubject.create({
    data: {
      examId: examTerm1.id,
      subjectId: subScience.id,
      sectionId: sec10A.id,
      maxMarks: 100,
      passMarks: 33,
      examDate: new Date('2025-09-15T09:00:00.000Z'),
    },
  });

  // Marks Entries for Class 10-A
  await prisma.marksEntry.createMany({
    data: [
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        examSubjectId: examSubMath.id,
        studentId: studentAarav.id,
        marksObtained: 94,
        grade: 'A1',
        enteredById: userTeacherMath.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        examSubjectId: examSubScience.id,
        studentId: studentAarav.id,
        marksObtained: 89,
        grade: 'A1',
        enteredById: userTeacherScience.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        examSubjectId: examSubMath.id,
        studentId: studentAnanya.id,
        marksObtained: 98,
        grade: 'A1',
        enteredById: userTeacherMath.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        examSubjectId: examSubScience.id,
        studentId: studentAnanya.id,
        marksObtained: 96,
        grade: 'A1',
        enteredById: userTeacherScience.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        examSubjectId: examSubMath.id,
        studentId: studentRohan.id,
        marksObtained: 72,
        grade: 'B1',
        enteredById: userTeacherMath.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        examSubjectId: examSubScience.id,
        studentId: studentRohan.id,
        marksObtained: 68,
        grade: 'B2',
        enteredById: userTeacherScience.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        examSubjectId: examSubMath.id,
        studentId: studentPriya.id,
        marksObtained: 85,
        grade: 'A2',
        enteredById: userTeacherMath.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        examSubjectId: examSubScience.id,
        studentId: studentPriya.id,
        marksObtained: 82,
        grade: 'A2',
        enteredById: userTeacherScience.id,
      },
    ],
  });

  // Fee Structure: Class 10 (Total ₹85,000)
  const feeStruct10 = await prisma.feeStructure.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      academicSessionId: session2025.id,
      classLevelId: class10.id,
      name: 'Class 10 Annual Academic Fee (2025-26)',
      totalAmount: 85000,
    },
  });

  await prisma.feeHead.createMany({
    data: [
      { feeStructureId: feeStruct10.id, title: 'Tuition Fee', amount: 60000, frequency: 'ANNUAL' },
      { feeStructureId: feeStruct10.id, title: 'Science & Computer Lab', amount: 12000, frequency: 'ANNUAL' },
      { feeStructureId: feeStruct10.id, title: 'Examination & Assessment', amount: 5000, frequency: 'ANNUAL' },
      { feeStructureId: feeStruct10.id, title: 'Development Fund', amount: 8000, frequency: 'ANNUAL' },
    ],
  });

  // Student Fee Allocations
  // 1. Aarav: Partial payment
  const allocAarav = await prisma.studentFeeAllocation.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      studentId: studentAarav.id,
      feeStructureId: feeStruct10.id,
      grossAmount: 85000,
      discountAmount: 5000, // Merit concession
      netAmount: 80000,
      paidAmount: 50000,
      balanceAmount: 30000,
      status: 'PARTIAL',
      dueDate: new Date('2025-10-15T00:00:00.000Z'),
    },
  });

  await prisma.feePayment.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      studentId: studentAarav.id,
      allocationId: allocAarav.id,
      receiptNumber: 'REC-2025-00101',
      amount: 50000,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-HDFC-992817261',
      paymentDate: new Date('2025-04-10T11:30:00.000Z'),
      receivedById: userAccountant.id,
      remarks: 'First installment via parent UPI',
    },
  });

  // 2. Ananya: Full payment
  const allocAnanya = await prisma.studentFeeAllocation.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      studentId: studentAnanya.id,
      feeStructureId: feeStruct10.id,
      grossAmount: 85000,
      discountAmount: 0,
      netAmount: 85000,
      paidAmount: 85000,
      balanceAmount: 0,
      status: 'PAID',
      dueDate: new Date('2025-10-15T00:00:00.000Z'),
    },
  });

  await prisma.feePayment.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      studentId: studentAnanya.id,
      allocationId: allocAnanya.id,
      receiptNumber: 'REC-2025-00102',
      amount: 85000,
      paymentMethod: 'NET_BANKING',
      transactionRef: 'NEFT-ICICI-8819201',
      paymentDate: new Date('2025-04-05T14:15:00.000Z'),
      receivedById: userAccountant.id,
      remarks: 'Full annual tuition paid online',
    },
  });

  // 3. Rohan: Unpaid
  await prisma.studentFeeAllocation.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      studentId: studentRohan.id,
      feeStructureId: feeStruct10.id,
      grossAmount: 85000,
      discountAmount: 0,
      netAmount: 85000,
      paidAmount: 0,
      balanceAmount: 85000,
      status: 'UNPAID',
      dueDate: new Date('2025-10-15T00:00:00.000Z'),
    },
  });

  // Admission Inquiries
  await prisma.admissionInquiry.createMany({
    data: [
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        inquiryNumber: 'INQ-2025-089',
        applicantName: 'Devansh Singhal',
        parentName: 'Alok Singhal',
        phone: '+91 98114 55667',
        email: 'alok.singhal@yahoo.com',
        targetClass: 'Class 9',
        source: 'WEBSITE',
        status: 'INTERVIEW_SCHEDULED',
        notes: 'Shortlisted for written assessment and interview on Saturday',
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        inquiryNumber: 'INQ-2025-090',
        applicantName: 'Myra Chawla',
        parentName: 'Gaurav Chawla',
        phone: '+91 98115 66778',
        email: 'gaurav.chawla@gmail.com',
        targetClass: 'Class 10',
        source: 'WALK_IN',
        status: 'INQUIRY',
        notes: 'Transfer case from Mumbai branch; requested prospectus',
      },
    ],
  });

  // Financial Transactions
  await prisma.financialTransaction.createMany({
    data: [
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        type: 'INCOME',
        category: 'FEE_COLLECTION',
        amount: 135000,
        paymentMethod: 'ONLINE',
        referenceNo: 'BATCH-COLLECT-0410',
        description: 'Consolidated Fee Collection April Installment',
        recordedById: userAccountant.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        type: 'EXPENSE',
        category: 'UTILITIES',
        amount: 34500,
        paymentMethod: 'NET_BANKING',
        referenceNo: 'BSES-ELEC-MAY25',
        description: 'Campus Electricity Bill payment for Senior Block',
        recordedById: userAccountant.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        type: 'EXPENSE',
        category: 'MAINTENANCE',
        amount: 18200,
        paymentMethod: 'CHEQUE',
        referenceNo: 'CHQ-882910',
        description: 'Physics Laboratory Glassware & Reagents Restock',
        recordedById: userAccountant.id,
      },
    ],
  });

  // Announcements
  await prisma.announcement.createMany({
    data: [
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        title: 'Mid-Year Term 1 Examination Report Card Distribution',
        content:
          'Parents and guardians are cordially invited to the Parent-Teacher Conference scheduled for Saturday, 28th September 2025 between 8:30 AM and 1:00 PM. Digital report cards will also be unlocked on the AURXON Parent Portal.',
        targetAudience: 'PARENTS',
        priority: 'URGENT',
        authorId: userPrincipal.id,
      },
      {
        organizationId: orgDPS.id,
        institutionId: instDPS.id,
        title: 'Inter-School CBSE Science Olympiad Registration Open',
        content:
          'Students of Classes 9, 10, 11, and 12 interested in representing DPS R.K. Puram at the National Science Olympiad may submit their nominations to their respective Science subject coordinators by Wednesday.',
        targetAudience: 'STUDENTS',
        priority: 'NORMAL',
        authorId: userTeacherScience.id,
      },
    ],
  });

  // --------------------------------------------------------------------------
  // ORGANIZATION 2: APEX CAREER INSTITUTE (COACHING & TEST PREP CHAIN)
  // --------------------------------------------------------------------------
  const orgApex = await prisma.organization.create({
    data: {
      name: 'Apex Career Institute Network',
      slug: 'apex-coaching',
      code: 'APEX-ORG',
      primaryColor: '#7c3aed', // Purple / Indigo
      status: 'ACTIVE',
    },
  });

  await prisma.moduleEntitlement.createMany({
    data: [
      { organizationId: orgApex.id, moduleName: 'LMS', isEnabled: true },
      { organizationId: orgApex.id, moduleName: 'TRANSPORT', isEnabled: false },
      { organizationId: orgApex.id, moduleName: 'LIBRARY', isEnabled: false },
      { organizationId: orgApex.id, moduleName: 'HOSTEL', isEnabled: false },
      { organizationId: orgApex.id, moduleName: 'INVENTORY', isEnabled: false },
      { organizationId: orgApex.id, moduleName: 'PAYROLL', isEnabled: true },
    ],
  });

  const instApex = await prisma.institution.create({
    data: {
      organizationId: orgApex.id,
      name: 'Apex Kota Main Campus (IIT-JEE & NEET)',
      code: 'APEX-KOTA',
      type: 'COACHING',
      board: 'NEET_JEE',
      email: 'admissions@apexkota.com',
      phone: '+91 744 243 0001',
      address: 'Road No. 1, IPIA',
      city: 'Kota',
      state: 'Rajasthan',
      pincode: '324005',
    },
  });

  const sessionApex = await prisma.academicSession.create({
    data: {
      organizationId: orgApex.id,
      institutionId: instApex.id,
      name: 'Session 2025-26',
      startDate: new Date('2025-04-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.000Z'),
      isCurrent: true,
    },
  });

  // Apex Users
  const userApexAdmin = await prisma.user.create({
    data: {
      organizationId: orgApex.id,
      institutionId: instApex.id,
      email: 'admin@apex-coaching.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Alok',
      lastName: 'Gupta',
      phone: '+91 94141 22334',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
    },
  });

  const userApexFaculty = await prisma.user.create({
    data: {
      organizationId: orgApex.id,
      institutionId: instApex.id,
      email: 'faculty.physics@apex-coaching.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Prof. Hemant',
      lastName: 'Tripathi',
      phone: '+91 94141 33445',
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  // Coaching Courses & Batches
  const courseJEE = await prisma.course.create({
    data: {
      organizationId: orgApex.id,
      institutionId: instApex.id,
      name: 'JEE Advanced 2-Year Target Batch',
      code: 'JEE-ADV-2YR',
      targetExam: 'JEE_ADVANCED',
      description: 'Rigorous 2-year preparation for IIT-JEE Advanced aspirants',
    },
  });

  const batchPhoenix = await prisma.batch.create({
    data: {
      organizationId: orgApex.id,
      institutionId: instApex.id,
      courseId: courseJEE.id,
      name: 'Batch Phoenix 2025 (Morning)',
      maxCapacity: 45,
    },
  });

  // Apex Student
  await prisma.student.create({
    data: {
      organizationId: orgApex.id,
      institutionId: instApex.id,
      academicSessionId: sessionApex.id,
      batchId: batchPhoenix.id,
      admissionNumber: 'APEX-2025-101',
      rollNumber: 'P-01',
      firstName: 'Arjun',
      lastName: 'Deshmukh',
      dob: new Date('2008-07-19T00:00:00.000Z'),
      gender: 'MALE',
      bloodGroup: 'B+',
      contactPhone: '+91 98230 11223',
      email: 'arjun.deshmukh@apex.student.edu',
      status: 'ACTIVE',
    },
  });

  // --------------------------------------------------------------------------
  // ORGANIZATION 3: SHARMA EDUCATION GROUP (INDORE MULTI-CAMPUS & COACHING)
  // --------------------------------------------------------------------------
  const orgSharma = await prisma.organization.create({
    data: {
      name: 'Sharma Education Group',
      slug: 'sharma-education-group',
      code: 'SEG-IND',
      primaryColor: '#1e40af', // Royal Blue
      status: 'ACTIVE',
    },
  });

  await prisma.moduleEntitlement.createMany({
    data: [
      { organizationId: orgSharma.id, moduleName: 'TRANSPORT', isEnabled: true },
      { organizationId: orgSharma.id, moduleName: 'LIBRARY', isEnabled: true },
      { organizationId: orgSharma.id, moduleName: 'HOSTEL', isEnabled: false },
      { organizationId: orgSharma.id, moduleName: 'INVENTORY', isEnabled: true },
      { organizationId: orgSharma.id, moduleName: 'PAYROLL', isEnabled: true },
      { organizationId: orgSharma.id, moduleName: 'LMS', isEnabled: true },
    ],
  });

  // Institution 1: Sharma Public School (K-12 CBSE)
  const instSPS = await prisma.institution.create({
    data: {
      organizationId: orgSharma.id,
      name: 'Sharma Public School',
      code: 'SPS-IND',
      type: 'SCHOOL',
      board: 'CBSE',
      affiliationNumber: 'CBSE-IND-45012',
      email: 'info@sharmapublicschool.in',
      phone: '+91 731 254 8800',
      address: 'AB Road, Near LIG Square',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452008',
      currency: 'INR',
      currencySymbol: '₹',
    },
  });

  // Campuses for Sharma Public School
  const branchSPSMain = await prisma.branch.create({
    data: {
      institutionId: instSPS.id,
      name: 'Indore Main Campus',
      code: 'SPS-MAIN',
      address: 'AB Road, Near LIG Square',
      city: 'Indore',
      state: 'Madhya Pradesh',
      phone: '+91 731 254 8801',
    },
  });

  const branchSPSRau = await prisma.branch.create({
    data: {
      institutionId: instSPS.id,
      name: 'Rau Campus',
      code: 'SPS-RAU',
      address: 'Bypass Road, Silicon City Junction',
      city: 'Indore',
      state: 'Madhya Pradesh',
      phone: '+91 731 289 4410',
    },
  });

  // Institution 2: Sharma Coaching Academy (Test Prep)
  const instSCA = await prisma.institution.create({
    data: {
      organizationId: orgSharma.id,
      name: 'Sharma Coaching Academy',
      code: 'SCA-IND',
      type: 'COACHING',
      board: 'NEET_JEE',
      email: 'admissions@sharmacoaching.in',
      phone: '+91 731 420 5500',
      address: 'Geeta Bhawan Square, A.B. Road',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      currency: 'INR',
      currencySymbol: '₹',
    },
  });

  const branchSCAGeetaBhawan = await prisma.branch.create({
    data: {
      institutionId: instSCA.id,
      name: 'Geeta Bhawan Campus',
      code: 'SCA-GB',
      address: 'Geeta Bhawan Square',
      city: 'Indore',
      state: 'Madhya Pradesh',
      phone: '+91 731 420 5501',
    },
  });

  const branchSCAVijayNagar = await prisma.branch.create({
    data: {
      institutionId: instSCA.id,
      name: 'Vijay Nagar Campus',
      code: 'SCA-VN',
      address: 'Scheme 54, Near Velocity III',
      city: 'Indore',
      state: 'Madhya Pradesh',
      phone: '+91 731 420 5502',
    },
  });

  // Academic Sessions for Sharma Group
  const sessionSharma2025 = await prisma.academicSession.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      name: '2025-2026',
      startDate: new Date('2025-04-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.000Z'),
      isCurrent: true,
    },
  });

  // Academic Structure for SPS: Class 10 & Class 9
  const class10SPS = await prisma.classLevel.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      name: 'Class 10',
      code: 'CLS-10',
      displayOrder: 10,
    },
  });

  const class9SPS = await prisma.classLevel.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      name: 'Class 9',
      code: 'CLS-9',
      displayOrder: 9,
    },
  });

  const sec10ASPS = await prisma.section.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      classLevelId: class10SPS.id,
      name: 'Section A (Main Campus)',
      roomNumber: 'M-101',
    },
  });

  const sec10BSPS = await prisma.section.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      classLevelId: class10SPS.id,
      name: 'Section B (Rau Campus)',
      roomNumber: 'R-201',
    },
  });

  // SPS Users: Director, Principals, Faculty, Accountant
  await prisma.user.create({
    data: {
      organizationId: orgSharma.id,
      email: 'director@sharma-group.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Rameshwar',
      lastName: 'Sharma',
      phone: '+91 98260 01100',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
    },
  });

  const userSPSPrincipal = await prisma.user.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      branchId: branchSPSMain.id,
      email: 'principal.sps@sharma-group.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Meenakshi',
      lastName: 'Verma',
      phone: '+91 98260 01101',
      role: 'PRINCIPAL',
      status: 'ACTIVE',
    },
  });

  await prisma.user.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      branchId: branchSPSRau.id,
      email: 'principal.rau@sharma-group.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Suresh',
      lastName: 'Rathore',
      phone: '+91 98260 01102',
      role: 'PRINCIPAL',
      status: 'ACTIVE',
    },
  });

  const userSPSTeacher = await prisma.user.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      branchId: branchSPSMain.id,
      email: 'teacher.sharma@sharma-group.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Anita',
      lastName: 'Saxena',
      phone: '+91 98260 01103',
      role: 'TEACHER',
      status: 'ACTIVE',
    },
  });

  await prisma.user.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      branchId: branchSPSMain.id,
      email: 'accountant.sharma@sharma-group.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Rajesh',
      lastName: 'Verma',
      phone: '+91 98260 01104',
      role: 'ACCOUNTANT',
      status: 'ACTIVE',
    },
  });

  // Subjects for SPS
  const subjMathSPS = await prisma.subject.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      name: 'Mathematics',
      code: 'MATH-10',
      type: 'THEORY',
    },
  });

  await prisma.subjectAssignment.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      academicSessionId: sessionSharma2025.id,
      subjectId: subjMathSPS.id,
      teacherId: userSPSTeacher.id,
      sectionId: sec10ASPS.id,
    },
  });

  // Students in Indore Main Campus
  const stuPriyansh = await prisma.student.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      branchId: branchSPSMain.id,
      academicSessionId: sessionSharma2025.id,
      sectionId: sec10ASPS.id,
      admissionNumber: 'SPS-2025-101',
      rollNumber: '1001',
      firstName: 'Priyansh',
      lastName: 'Sharma',
      dob: new Date('2010-04-12T00:00:00.000Z'),
      gender: 'MALE',
      bloodGroup: 'O+',
      contactPhone: '+91 98261 44551',
      email: 'priyansh.sharma@sps.student.edu',
      status: 'ACTIVE',
    },
  });

  const stuAnanya = await prisma.student.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      branchId: branchSPSMain.id,
      academicSessionId: sessionSharma2025.id,
      sectionId: sec10ASPS.id,
      admissionNumber: 'SPS-2025-102',
      rollNumber: '1002',
      firstName: 'Ananya',
      lastName: 'Joshi',
      dob: new Date('2010-09-24T00:00:00.000Z'),
      gender: 'FEMALE',
      bloodGroup: 'B+',
      contactPhone: '+91 98261 44552',
      email: 'ananya.joshi@sps.student.edu',
      status: 'ACTIVE',
    },
  });

  // Students in Rau Campus
  const stuHardik = await prisma.student.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      branchId: branchSPSRau.id,
      academicSessionId: sessionSharma2025.id,
      sectionId: sec10BSPS.id,
      admissionNumber: 'SPS-2025-201',
      rollNumber: '1011',
      firstName: 'Hardik',
      lastName: 'Patel',
      dob: new Date('2010-06-18T00:00:00.000Z'),
      gender: 'MALE',
      bloodGroup: 'A+',
      contactPhone: '+91 98261 44553',
      email: 'hardik.patel@sps.student.edu',
      status: 'ACTIVE',
    },
  });

  const stuIshita = await prisma.student.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      branchId: branchSPSRau.id,
      academicSessionId: sessionSharma2025.id,
      sectionId: sec10BSPS.id,
      admissionNumber: 'SPS-2025-202',
      rollNumber: '1012',
      firstName: 'Ishita',
      lastName: 'Choudhary',
      dob: new Date('2010-11-03T00:00:00.000Z'),
      gender: 'FEMALE',
      bloodGroup: 'AB+',
      contactPhone: '+91 98261 44554',
      email: 'ishita.choudhary@sps.student.edu',
      status: 'ACTIVE',
    },
  });

  // Attendance Records for Sharma Public School
  const sharmaToday = new Date();
  sharmaToday.setHours(0, 0, 0, 0);

  // Main campus: both present (100%)
  await prisma.attendanceRecord.createMany({
    data: [
      {
        organizationId: orgSharma.id,
        institutionId: instSPS.id,
        academicSessionId: sessionSharma2025.id,
        studentId: stuPriyansh.id,
        sectionId: sec10ASPS.id,
        date: sharmaToday,
        status: 'PRESENT',
        markedById: userSPSTeacher.id,
      },
      {
        organizationId: orgSharma.id,
        institutionId: instSPS.id,
        academicSessionId: sessionSharma2025.id,
        studentId: stuAnanya.id,
        sectionId: sec10ASPS.id,
        date: sharmaToday,
        status: 'PRESENT',
        markedById: userSPSTeacher.id,
      },
      // Rau campus: 1 present, 1 absent (50% - generating operational alert!)
      {
        organizationId: orgSharma.id,
        institutionId: instSPS.id,
        academicSessionId: sessionSharma2025.id,
        studentId: stuHardik.id,
        sectionId: sec10BSPS.id,
        date: sharmaToday,
        status: 'PRESENT',
        markedById: userSPSTeacher.id,
      },
      {
        organizationId: orgSharma.id,
        institutionId: instSPS.id,
        academicSessionId: sessionSharma2025.id,
        studentId: stuIshita.id,
        sectionId: sec10BSPS.id,
        date: sharmaToday,
        status: 'ABSENT',
        remarks: 'Medical leave reported',
        markedById: userSPSTeacher.id,
      },
    ],
  });

  // Fees for Sharma Public School
  const feeStructureSPS = await prisma.feeStructure.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      academicSessionId: sessionSharma2025.id,
      name: 'Class 10 Standard Annual Fee 2025-26',
      totalAmount: 48000,
    },
  });

  await prisma.feeHead.createMany({
    data: [
      { feeStructureId: feeStructureSPS.id, title: 'Tuition Fee', amount: 36000, frequency: 'ANNUAL' },
      { feeStructureId: feeStructureSPS.id, title: 'Development & Activities', amount: 12000, frequency: 'ANNUAL' },
    ],
  });

  // Allocation & Payments for Priyansh (Paid ₹48,000)
  const allocPriyansh = await prisma.studentFeeAllocation.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      studentId: stuPriyansh.id,
      feeStructureId: feeStructureSPS.id,
      grossAmount: 48000,
      netAmount: 48000,
      paidAmount: 48000,
      balanceAmount: 0,
      status: 'PAID',
    },
  });

  await prisma.feePayment.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      studentId: stuPriyansh.id,
      allocationId: allocPriyansh.id,
      receiptNumber: 'REC-SPS-2025-001',
      amount: 48000,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-IND-88123',
      paymentDate: new Date(),
      receivedById: userSPSTeacher.id,
      remarks: 'Full annual fee payment via UPI',
    },
  });

  // Allocation for Hardik (Rau Campus - ₹24,000 paid, ₹24,000 overdue)
  const allocHardik = await prisma.studentFeeAllocation.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      studentId: stuHardik.id,
      feeStructureId: feeStructureSPS.id,
      grossAmount: 48000,
      netAmount: 48000,
      paidAmount: 24000,
      balanceAmount: 24000,
      status: 'PARTIAL',
    },
  });

  await prisma.feePayment.create({
    data: {
      organizationId: orgSharma.id,
      institutionId: instSPS.id,
      studentId: stuHardik.id,
      allocationId: allocHardik.id,
      receiptNumber: 'REC-SPS-2025-002',
      amount: 24000,
      paymentMethod: 'NET_BANKING',
      transactionRef: 'HDFC-PAY-44129',
      paymentDate: new Date(),
      receivedById: userSPSTeacher.id,
      remarks: 'First installment via NetBanking',
    },
  });

  // --------------------------------------------------------------------------
  // ORGANIZATION 4: ST. MARY'S EDUCATION SOCIETY (MULTI-CAMPUS INDORE)
  // --------------------------------------------------------------------------
  const orgStMarys = await prisma.organization.create({
    data: {
      name: "St. Mary's Education Society",
      slug: 'st-marys-society',
      code: 'SMES-IND',
      primaryColor: '#047857', // Forest Emerald
      status: 'ACTIVE',
    },
  });

  const instStMarys = await prisma.institution.create({
    data: {
      organizationId: orgStMarys.id,
      name: "St. Mary's Higher Secondary School",
      code: 'SMHSS-IND',
      type: 'SCHOOL',
      board: 'ICSE',
      affiliationNumber: 'ICSE-MP-091',
      city: 'Indore',
      state: 'Madhya Pradesh',
    },
  });

  await prisma.branch.createMany({
    data: [
      { institutionId: instStMarys.id, name: 'Main Campus (Residency Area)', code: 'SM-MAIN', city: 'Indore' },
      { institutionId: instStMarys.id, name: 'North Campus (Sukhlia)', code: 'SM-NORTH', city: 'Indore' },
      { institutionId: instStMarys.id, name: 'South Campus (Rau Pithampur Road)', code: 'SM-SOUTH', city: 'Indore' },
    ],
  });

  await prisma.user.create({
    data: {
      organizationId: orgStMarys.id,
      institutionId: instStMarys.id,
      email: 'admin@stmarys.org',
      passwordHash: defaultPasswordHash,
      firstName: 'Fr. George',
      lastName: 'D Souza',
      phone: '+91 98270 33445',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
    },
  });

  // --------------------------------------------------------------------------
  // ORGANIZATION 5: INDEPENDENT ABC SCHOOL (SINGLE-CAMPUS INDEPENDENT)
  // --------------------------------------------------------------------------
  const orgABC = await prisma.organization.create({
    data: {
      name: 'Independent ABC Educational Trust',
      slug: 'abc-educational-trust',
      code: 'ABC-TRUST',
      primaryColor: '#7c3aed', // Violet
      status: 'ACTIVE',
    },
  });

  const instABC = await prisma.institution.create({
    data: {
      organizationId: orgABC.id,
      name: 'ABC Higher Secondary School',
      code: 'ABC-HSS',
      type: 'SCHOOL',
      board: 'STATE',
      city: 'Indore',
      state: 'Madhya Pradesh',
    },
  });

  await prisma.branch.create({
    data: {
      institutionId: instABC.id,
      name: 'Main Campus',
      code: 'ABC-MAIN',
      city: 'Indore',
    },
  });

  await prisma.user.create({
    data: {
      organizationId: orgABC.id,
      institutionId: instABC.id,
      email: 'admin@abcschool.edu',
      passwordHash: defaultPasswordHash,
      firstName: 'Dr. Alok',
      lastName: 'Tiwari',
      phone: '+91 98260 55667',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
    },
  });

  // Initial Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: orgDPS.id,
      institutionId: instDPS.id,
      actorId: userSuperAdmin.id,
      actorName: 'Vikramaditya Singhania',
      actorRole: 'SUPER_ADMIN',
      resource: 'SYSTEM',
      action: 'INITIALIZE',
      detailsJson: JSON.stringify({ message: 'AURXON ERP Seed Fixtures successfully initialized with multi-branch commercial data' }),
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Default Seed Accounts (Password: Password@123):');
  console.log('1. Super Admin: superadmin@aurxon.io');
  console.log('2. DPS Org Admin: admin@dps-society.edu');
  console.log('3. DPS Principal: principal.rkp@dps-society.edu');
  console.log('4. DPS Teacher (Maths): teacher.math@dps-society.edu');
  console.log('5. DPS Teacher (Science): teacher.science@dps-society.edu');
  console.log('6. DPS Accountant: accountant@dps-society.edu');
  console.log('7. DPS Parent: parent.aarav@gmail.com');
  console.log('8. DPS Student: student.aarav@dps-society.edu');
  console.log('9. Apex Coaching Admin: admin@apex-coaching.edu');
  console.log('10. Apex Faculty: faculty.physics@apex-coaching.edu');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
