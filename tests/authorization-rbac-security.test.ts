// AURXON Autonomous RBAC, Role Responsibility & Security Unit Test Suite
import { describe, it, expect } from 'vitest';
import {
  authorize,
  assertCan,
  explainAccess,
  getEffectivePermissions,
  sanitizeStaffRecord,
  AuthorizationError,
} from '../src/lib/authorization/engine';
import { SecurityActor, ResourceTarget } from '../src/lib/authorization/types';
import { generateEmployeeId } from '../src/lib/authorization/id-generator';
import { generateStaffQRCode } from '../src/lib/authorization/qr';

describe('AURXON Pure Mathematical Authorization Engine', () => {
  const mockOrgId = 'org_dps_delhi';
  const foreignOrgId = 'org_apex_kota';

  const baseTeacher: SecurityActor = {
    id: 'usr_teacher_01',
    email: 'amit.math@dps.edu',
    firstName: 'Amit',
    lastName: 'Kulkarni',
    role: 'TEACHER',
    organizationId: mockOrgId,
    institutionId: 'inst_dps_rkp',
    branchId: 'branch_senior',
    responsibilities: [],
    verifiedChildIds: [],
    studentProfileId: null,
  };

  const principal: SecurityActor = {
    id: 'usr_principal_01',
    email: 'meenakshi@dps.edu',
    firstName: 'Dr. Meenakshi',
    lastName: 'Sundaram',
    role: 'PRINCIPAL',
    organizationId: mockOrgId,
    institutionId: 'inst_dps_rkp',
    branchId: 'branch_senior',
    responsibilities: [],
    verifiedChildIds: [],
    studentProfileId: null,
  };

  const branchHead: SecurityActor = {
    id: 'usr_branch_head_01',
    email: 'branchhead@dps.edu',
    firstName: 'Rajiv',
    lastName: 'Nath',
    role: 'BRANCH_HEAD',
    organizationId: mockOrgId,
    institutionId: 'inst_dps_rkp',
    branchId: 'branch_senior',
    responsibilities: [],
    verifiedChildIds: [],
    studentProfileId: null,
  };

  it('1. guarantees global bypass for Platform SUPER_ADMIN', () => {
    const superAdmin: SecurityActor = {
      ...baseTeacher,
      role: 'SUPER_ADMIN',
    };

    const target: ResourceTarget = {
      type: 'STUDENT',
      organizationId: foreignOrgId, // Even cross-tenant for platform support
    };

    const decision = authorize(superAdmin, 'students.view', target);
    expect(decision.allowed).toBe(true);
    expect(decision.matchedRule).toBe('PLATFORM_SUPER_ADMIN_OVERRIDE');
  });

  it('2. strictly denies cross-tenant access attempts', () => {
    const foreignTarget: ResourceTarget = {
      type: 'STUDENT',
      organizationId: foreignOrgId, // Cross-tenant target
      id: 'student_999',
    };

    const decision = authorize(principal, 'students.view', foreignTarget);
    expect(decision.allowed).toBe(false);
    expect(decision.denialCode).toBe('TENANT_MISMATCH');
  });

  it('3. enforces role-action boundaries (Teacher cannot refund or publish exams)', () => {
    const feeTarget: ResourceTarget = {
      type: 'FEE',
      organizationId: mockOrgId,
      institutionId: 'inst_dps_rkp',
    };

    const examTarget: ResourceTarget = {
      type: 'EXAMINATION',
      organizationId: mockOrgId,
      institutionId: 'inst_dps_rkp',
    };

    // Teacher cannot refund fee
    const refundDecision = authorize(baseTeacher, 'fees.refund', feeTarget);
    expect(refundDecision.allowed).toBe(false);
    expect(refundDecision.denialCode).toBe('INSUFFICIENT_ROLE_PERMISSIONS');

    // Teacher cannot publish school-wide exams
    const publishDecision = authorize(baseTeacher, 'examinations.publish', examTarget);
    expect(publishDecision.allowed).toBe(false);

    // Principal CAN publish school-wide exams
    const principalPublish = authorize(principal, 'examinations.publish', examTarget);
    expect(principalPublish.allowed).toBe(true);
  });

  it('4. grants Class Teacher section-scoped permissions (Attendance & Remarks)', () => {
    const classTeacherSectionA: SecurityActor = {
      ...baseTeacher,
      responsibilities: [
        {
          responsibilityType: 'CLASS_TEACHER',
          scopeLevel: 'SECTION',
          sectionId: 'sec_10_a',
          classLevelId: 'class_10',
          validFrom: new Date('2025-01-01'),
          validUntil: new Date('2027-01-01'),
          status: 'ACTIVE',
        },
      ],
    };

    const targetSectionA: ResourceTarget = {
      type: 'ATTENDANCE',
      organizationId: mockOrgId,
      institutionId: 'inst_dps_rkp',
      sectionId: 'sec_10_a',
    };

    const targetSectionB: ResourceTarget = {
      type: 'ATTENDANCE',
      organizationId: mockOrgId,
      institutionId: 'inst_dps_rkp',
      sectionId: 'sec_10_b', // Different section!
    };

    // Allowed to correct attendance in assigned Section 10-A
    const decisionA = authorize(classTeacherSectionA, 'attendance.correct', targetSectionA);
    expect(decisionA.allowed).toBe(true);
    expect(decisionA.matchedRule).toBe('RESPONSIBILITY:CLASS_TEACHER');

    // Denied on unassigned Section 10-B
    const decisionB = authorize(classTeacherSectionA, 'attendance.correct', targetSectionB);
    expect(decisionB.allowed).toBe(false);
    expect(decisionB.denialCode).toBe('OUT_OF_SCOPE');
  });

  it('5. grants Subject Teacher subject-scoped permissions (Enter Marks)', () => {
    const mathTeacher: SecurityActor = {
      ...baseTeacher,
      responsibilities: [
        {
          responsibilityType: 'SUBJECT_TEACHER',
          scopeLevel: 'SUBJECT',
          subjectId: 'sub_math_101',
          sectionId: 'sec_10_a',
          validFrom: new Date('2025-01-01'),
          validUntil: new Date('2027-01-01'),
          status: 'ACTIVE',
        },
      ],
    };

    const mathMarksTarget: ResourceTarget = {
      type: 'EXAMINATION',
      organizationId: mockOrgId,
      institutionId: 'inst_dps_rkp',
      subjectId: 'sub_math_101',
      sectionId: 'sec_10_a',
    };

    const physicsMarksTarget: ResourceTarget = {
      type: 'EXAMINATION',
      organizationId: mockOrgId,
      institutionId: 'inst_dps_rkp',
      subjectId: 'sub_physics_201', // Different subject!
      sectionId: 'sec_10_a',
    };

    const mathDecision = authorize(mathTeacher, 'examinations.enter_marks', mathMarksTarget);
    expect(mathDecision.allowed).toBe(true);

    const physicsDecision = authorize(mathTeacher, 'examinations.enter_marks', physicsMarksTarget);
    expect(physicsDecision.allowed).toBe(false);
    expect(physicsDecision.denialCode).toBe('OUT_OF_SCOPE');
  });

  it('6. strictly denies Class Monitor (CR) from editing official records', () => {
    const studentCR: SecurityActor = {
      id: 'usr_student_01',
      email: 'aarav@dps.edu',
      firstName: 'Aarav',
      lastName: 'Sharma',
      role: 'STUDENT',
      organizationId: mockOrgId,
      institutionId: 'inst_dps_rkp',
      responsibilities: [
        {
          responsibilityType: 'CLASS_MONITOR',
          scopeLevel: 'SECTION',
          sectionId: 'sec_10_a',
          validFrom: new Date('2025-01-01'),
          validUntil: new Date('2027-01-01'),
          status: 'ACTIVE',
        },
      ],
      verifiedChildIds: [],
      studentProfileId: 'student_aarav_id',
    };

    const target: ResourceTarget = {
      type: 'ATTENDANCE',
      organizationId: mockOrgId,
      sectionId: 'sec_10_a',
    };

    // CR CAN create class announcements
    const announceDecision = authorize(studentCR, 'announcement.create', target);
    expect(announceDecision.allowed).toBe(true);

    // CR CANNOT mark attendance
    const attendanceDecision = authorize(studentCR, 'attendance.mark', target);
    expect(attendanceDecision.allowed).toBe(false);
    expect(attendanceDecision.denialCode).toBe('INSUFFICIENT_ROLE_PERMISSIONS');

    // CR CANNOT enter marks
    const marksDecision = authorize(studentCR, 'examinations.enter_marks', target);
    expect(marksDecision.allowed).toBe(false);
  });

  it('7. enforces temporal expiration on assignments', () => {
    const expiredCoordinator: SecurityActor = {
      ...baseTeacher,
      responsibilities: [
        {
          responsibilityType: 'EXAM_COORDINATOR',
          scopeLevel: 'INSTITUTION',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'), // Expired in the past!
          status: 'ACTIVE',
        },
      ],
    };

    const target: ResourceTarget = {
      type: 'EXAMINATION',
      organizationId: mockOrgId,
      institutionId: 'inst_dps_rkp',
    };

    // Action requires Exam Coordinator responsibility (examinations.publish)
    const decision = authorize(expiredCoordinator, 'examinations.publish', target, {
      now: new Date('2026-09-14'),
    });
    expect(decision.allowed).toBe(false);
    expect(decision.denialCode).toBe('INSUFFICIENT_ROLE_PERMISSIONS');
  });

  it('8. restricts Parent access strictly to verified children', () => {
    const parent: SecurityActor = {
      id: 'usr_parent_01',
      email: 'parent.aarav@gmail.com',
      firstName: 'Sanjay',
      lastName: 'Sharma',
      role: 'PARENT',
      organizationId: mockOrgId,
      responsibilities: [],
      verifiedChildIds: ['child_aarav_101'], // Only Aarav is verified
      studentProfileId: null,
    };

    const ownChildTarget: ResourceTarget = {
      type: 'STUDENT',
      organizationId: mockOrgId,
      studentId: 'child_aarav_101',
    };

    const foreignChildTarget: ResourceTarget = {
      type: 'STUDENT',
      organizationId: mockOrgId,
      studentId: 'child_ananya_102', // Someone else's child!
    };

    // Can view own child
    const ownDecision = authorize(parent, 'students.view_own', ownChildTarget);
    expect(ownDecision.allowed).toBe(true);

    // Denied on foreign child
    const foreignDecision = authorize(parent, 'students.view_own', foreignChildTarget);
    expect(foreignDecision.allowed).toBe(false);
    expect(foreignDecision.denialCode).toBe('UNVERIFIED_CHILD_RELATION');
  });

  it('9. restricts Branch Head strictly to their assigned branch', () => {
    const seniorBranchTarget: ResourceTarget = {
      type: 'STUDENT',
      organizationId: mockOrgId,
      branchId: 'branch_senior',
    };

    const juniorBranchTarget: ResourceTarget = {
      type: 'STUDENT',
      organizationId: mockOrgId,
      branchId: 'branch_junior', // Another branch!
    };

    expect(authorize(branchHead, 'students.view', seniorBranchTarget).allowed).toBe(true);

    const juniorDecision = authorize(branchHead, 'students.view', juniorBranchTarget);
    expect(juniorDecision.allowed).toBe(false);
    expect(juniorDecision.denialCode).toBe('BRANCH_MISMATCH');
  });

  it('10. redacts sensitive HR fields from unauthorized users', () => {
    const fullStaffRecord = {
      id: 'stf_01',
      firstName: 'Sunita',
      lastName: 'Deshmukh',
      designation: 'PGT Science',
      department: 'Sciences',
      basicSalary: 85000,
      bankName: 'HDFC Bank',
      bankAccountNumber: '501002918271',
      bankIfsc: 'HDFC0001234',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '9988-7766-5544',
    };

    // Teacher viewing staff record -> sensitive fields redacted
    const sanitizedForTeacher = sanitizeStaffRecord(fullStaffRecord, baseTeacher);
    expect(sanitizedForTeacher.firstName).toBe('Sunita');
    expect(sanitizedForTeacher.basicSalary).toBeUndefined();
    expect(sanitizedForTeacher.bankAccountNumber).toBeUndefined();
    expect(sanitizedForTeacher.panNumber).toBeUndefined();

    // HR Manager viewing staff record -> sensitive fields preserved
    const hrManager: SecurityActor = {
      ...baseTeacher,
      role: 'HR_MANAGER',
    };
    const preservedForHR = sanitizeStaffRecord(fullStaffRecord, hrManager);
    expect(preservedForHR.basicSalary).toBe(85000);
    expect(preservedForHR.bankAccountNumber).toBe('501002918271');
    expect(preservedForHR.panNumber).toBe('ABCDE1234F');
  });

  it('11. provides clear explainability breakdown for audit logs', () => {
    const target: ResourceTarget = {
      type: 'ATTENDANCE',
      organizationId: mockOrgId,
      sectionId: 'sec_10_a',
    };

    const explanation = explainAccess(baseTeacher, 'attendance.mark', target);
    expect(explanation.decision.allowed).toBe(true);
    expect(explanation.auditExplanation).toContain('ALLOW: User');
    expect(explanation.actorSummary.role).toBe('TEACHER');

    const deniedExplanation = explainAccess(baseTeacher, 'fees.refund', target);
    expect(deniedExplanation.decision.allowed).toBe(false);
    expect(deniedExplanation.auditExplanation).toContain('DENY: User');
  });

  it('12. asserts permission and throws AuthorizationError on violation', () => {
    const foreignTarget: ResourceTarget = {
      type: 'STUDENT',
      organizationId: foreignOrgId,
    };

    expect(() => assertCan(principal, 'students.view', foreignTarget)).toThrowError(
      AuthorizationError
    );
  });

  it('13. computes full effective permissions matrix', () => {
    const matrix = getEffectivePermissions(principal);
    expect(matrix.length).toBeGreaterThan(15);

    const examPublish = matrix.find((p) => p.action === 'examinations.publish');
    expect(examPublish?.allowed).toBe(true);
    expect(examPublish?.source).toBe('ROLE');

    const feeRefund = matrix.find((p) => p.action === 'fees.refund');
    expect(feeRefund?.allowed).toBe(false);
  });

  it('14. generates valid, scannable Staff QR verification data URLs', async () => {
    const qrDataUrl = await generateStaffQRCode('stf_123', 'EMP-DPS-2026-001', 'DPS-ORG');
    expect(qrDataUrl).toBeDefined();
    expect(qrDataUrl.startsWith('data:image/')).toBe(true);
  });
});
