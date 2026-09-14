import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { generateEmployeeId } from '../src/lib/authorization/id-generator';
import { generateStaffQRCode } from '../src/lib/authorization/qr';
import { sanitizeStaffRecord } from '../src/lib/authorization/engine';
import { hashPassword, verifyPassword } from '../src/lib/auth';

describe('AURXON ERP — Staff Onboarding, QR Badging, License & Security Workflows', () => {
  let testOrgId: string;
  let testInstId: string;
  let testStaffId: string;
  let testEmployeeId: string;

  beforeAll(async () => {
    // Ensure test organization exists
    let org = await prisma.organization.findFirst({
      where: { code: 'TEST-DPS' },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Delhi Public School Test Society',
          slug: 'dps-test',
          code: 'TEST-DPS',
          licenseTier: 'PROFESSIONAL',
          licenseKey: 'AURXON-LIC-TEST-2026',
          licenseValidUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          maxStudents: 1500,
          maxStaff: 120,
          maxCampuses: 3,
        },
      });
    }
    testOrgId = org.id;

    let inst = await prisma.institution.findFirst({
      where: { organizationId: testOrgId },
    });

    if (!inst) {
      inst = await prisma.institution.create({
        data: {
          organizationId: testOrgId,
          name: 'Delhi Public School Test Campus',
          code: 'DPS-TEST-CAMPUS',
          type: 'SCHOOL',
          board: 'CBSE',
          city: 'New Delhi',
        },
      });
    }
    testInstId = inst.id;
  });

  afterAll(async () => {
    // Clean up test records
    if (testStaffId) {
      await prisma.staffProfile.deleteMany({ where: { id: testStaffId } });
    }
  });

  it('1. Auto-generates deterministic, unique and sequential Employee IDs', async () => {
    const empId1 = await generateEmployeeId(testOrgId, 'TEST-DPS');
    expect(empId1).toMatch(/^EMP-TESTDPS-\d{4}-\d{4}$/);

    const empId2 = await generateEmployeeId(testOrgId, 'TEST-DPS');
    expect(empId2).toMatch(/^EMP-TESTDPS-\d{4}-\d{4}$/);
    testEmployeeId = empId1;
  });

  it('2. Generates scannable verification QR Code data URL with high ECC', async () => {
    const qrDataUrl = await generateStaffQRCode({
      employeeId: testEmployeeId,
      staffName: 'Dr. Ramesh Chandra',
      schoolName: 'Delhi Public School Society',
      designation: 'Senior Faculty Mathematics',
      department: 'Mathematics',
      institutionId: testInstId,
      issuedDate: '2026-09-14',
    });

    expect(qrDataUrl).toBeDefined();
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(qrDataUrl.length).toBeGreaterThan(100);
  });

  it('3. Creates comprehensive relational Staff Profile with auto ID and QR badge', async () => {
    const qrDataUrl = await generateStaffQRCode({
      employeeId: testEmployeeId,
      staffName: 'Dr. Ramesh Chandra',
      schoolName: 'Delhi Public School Society',
      designation: 'PGT Mathematics',
      department: 'Mathematics',
      institutionId: testInstId,
      issuedDate: '2026-09-14',
    });

    const staff = await prisma.staffProfile.create({
      data: {
        organizationId: testOrgId,
        institutionId: testInstId,
        employeeId: testEmployeeId,
        firstName: 'Ramesh',
        lastName: 'Chandra',
        email: `ramesh.chandra.${Date.now()}@aurxon.test`,
        phone: '+91 98111 22233',
        dob: new Date('1985-06-20'),
        gender: 'MALE',
        department: 'Mathematics',
        designation: 'PGT Mathematics',
        profileCompleteness: 90,
        qrCodeDataUrl: qrDataUrl,
        basicSalary: 85000,
        bankName: 'State Bank of India',
        bankAccountNumber: '30291827364',
        panNumber: 'ABCDE1234F',
        aadhaarNumber: '9988 7766 5544',
        education: {
          create: [
            {
              qualification: 'Post Graduate',
              degree: 'M.Sc.',
              specialization: 'Applied Mathematics',
              institution: 'IIT Delhi',
              universityBoard: 'IIT Delhi',
              passingYear: 2008,
              percentageGrade: '9.1 CGPA',
            },
          ],
        },
        teachingExperience: {
          create: [
            {
              subjectsTaught: 'Calculus, Vectors, Probability',
              classesTaught: 'Class 11, Class 12',
              curricula: 'CBSE, JEE Advanced',
              yearsExperience: 14.0,
              isCoaching: true,
            },
          ],
        },
        responsibilities: {
          create: [
            {
              responsibilityType: 'CLASS_TEACHER',
              title: 'Class Teacher - Grade 12 Section A',
              scopeLevel: 'SECTION',
              scopeId: 'sec-12a',
              sectionId: 'sec-12a',
              assignedById: 'admin-01',
              status: 'ACTIVE',
            },
          ],
        },
      },
      include: {
        education: true,
        teachingExperience: true,
        responsibilities: true,
      },
    });

    testStaffId = staff.id;
    expect(staff.id).toBeDefined();
    expect(staff.employeeId).toBe(testEmployeeId);
    expect(staff.education).toHaveLength(1);
    expect(staff.teachingExperience).toHaveLength(1);
    expect(staff.responsibilities).toHaveLength(1);
  });

  it('4. Enforces strict zero-trust sanitization on sensitive financial & identity data', () => {
    const rawStaff = {
      id: 'staff-01',
      firstName: 'Ramesh',
      lastName: 'Chandra',
      email: 'ramesh@aurxon.test',
      basicSalary: 85000,
      bankAccountNumber: '30291827364',
      bankName: 'SBI',
      bankIfsc: 'SBIN000123',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '9988 7766 5544',
    };

    // Teacher or normal viewer CANNOT see sensitive details
    const teacherView = sanitizeStaffRecord(rawStaff, false);
    expect(teacherView.basicSalary).toBeUndefined();
    expect(teacherView.bankAccountNumber).toBeUndefined();
    expect(teacherView.panNumber).toBeUndefined();
    expect(teacherView.aadhaarNumber).toBeUndefined();

    // HR Manager or Principal CAN see sensitive details
    const hrView = sanitizeStaffRecord(rawStaff, true);
    expect(hrView.basicSalary).toBe(85000);
    expect(hrView.bankAccountNumber).toBe('30291827364');
    expect(hrView.panNumber).toBe('ABCDE1234F');
  });

  it('5. Enforces mandatory password reset flags on provisioned accounts', async () => {
    const tempPassword = 'TempPass@2026!';
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        organizationId: testOrgId,
        email: `newfaculty.${Date.now()}@aurxon.test`,
        passwordHash,
        firstName: 'Anjali',
        lastName: 'Deshmukh',
        role: 'TEACHER',
        status: 'ACTIVE',
        mustResetPassword: true, // Crucial flag
        isTemporaryPassword: true,
      },
    });

    expect(user.mustResetPassword).toBe(true);
    expect(user.isTemporaryPassword).toBe(true);

    const isMatch = await verifyPassword(tempPassword, user.passwordHash);
    expect(isMatch).toBe(true);

    // Simulate password reset on first login
    const newStrongPassword = 'SecurePermanentPass#2026';
    const newHash = await hashPassword(newStrongPassword);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustResetPassword: false,
        isTemporaryPassword: false,
      },
    });

    expect(updatedUser.mustResetPassword).toBe(false);
    expect(updatedUser.isTemporaryPassword).toBe(false);

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('6. Allows HQ Control Plane to update organization logo and license quotas', async () => {
    const updatedOrg = await prisma.organization.update({
      where: { id: testOrgId },
      data: {
        logoUrl: 'https://aurxon.app/logos/dps-crest-official.png',
        licenseTier: 'ENTERPRISE',
        maxStudents: 3000,
        maxStaff: 250,
        maxCampuses: 5,
      },
    });

    expect(updatedOrg.logoUrl).toBe('https://aurxon.app/logos/dps-crest-official.png');
    expect(updatedOrg.licenseTier).toBe('ENTERPRISE');
    expect(updatedOrg.maxStudents).toBe(3000);
    expect(updatedOrg.maxStaff).toBe(250);
    expect(updatedOrg.maxCampuses).toBe(5);
  });
});
