// AURXON Institutional Roles, Scoped Access, Decision Engine & Leave Management Test Suite
import { describe, it, expect } from 'vitest';
import {
  authorize,
  assertCan,
  assertNoHardDelete,
  evaluateAccessLevel,
  sanitizeStaffRecord,
  AuthorizationError,
} from '../src/lib/authorization/engine';
import {
  SecurityActor,
  ResourceTarget,
  ResponsibilityAssignment,
} from '../src/lib/authorization/types';
import {
  getModuleAccessLevel,
  CENTRAL_MODULE_ACCESS_MATRIX,
} from '../src/lib/authorization/permissions-registry';
import {
  resolveTeacherLeaveRoute,
  resolveStudentLeaveRoute,
  validateApprovalAction,
} from '../src/lib/authorization/decision-engine';
import {
  validateStaffLeaveApplication,
  validateStudentLeaveApplication,
} from '../src/lib/leave/leave-validator';
import { rankSubstituteCandidates } from '../src/lib/leave/substitute-recommender';

describe('AURXON Institutional Role, Scoped Access & Decision Architecture', () => {
  const mockOrgId = 'org_abc_school';
  const branchIndore = 'branch_indore';
  const branchBhopal = 'branch_bhopal';
  const session2026 = 'session_2026_27';

  // 1. Setup "Rahul" — Standard Teacher with Scoped Responsibilities
  const rahulResponsibilities: ResponsibilityAssignment[] = [
    {
      responsibilityType: 'CLASS_TEACHER',
      title: 'Class Teacher — 8A',
      scopeLevel: 'SECTION',
      sectionId: 'section_8A',
      classLevelId: 'class_8',
      branchId: branchIndore,
      validFrom: new Date('2026-01-01'),
      status: 'ACTIVE',
    },
    {
      responsibilityType: 'SUBJECT_TEACHER',
      title: 'Mathematics Faculty — 8A',
      scopeLevel: 'SUBJECT',
      subjectId: 'sub_math',
      sectionId: 'section_8A',
      branchId: branchIndore,
      validFrom: new Date('2026-01-01'),
      status: 'ACTIVE',
    },
    {
      responsibilityType: 'SUBJECT_TEACHER',
      title: 'Mathematics Faculty — 8B',
      scopeLevel: 'SUBJECT',
      subjectId: 'sub_math',
      sectionId: 'section_8B',
      branchId: branchIndore,
      validFrom: new Date('2026-01-01'),
      status: 'ACTIVE',
    },
  ];

  const rahulTeacher: SecurityActor = {
    id: 'usr_rahul_01',
    email: 'rahul.teacher@abcschool.edu',
    firstName: 'Rahul',
    lastName: 'Sharma',
    role: 'TEACHER',
    organizationId: mockOrgId,
    institutionId: 'inst_abc_main',
    branchId: branchIndore,
    academicSessionId: session2026,
    department: 'Mathematics',
    responsibilities: rahulResponsibilities,
    verifiedChildIds: [],
    studentProfileId: null,
  };

  it('1. verifies Rahul can EDIT 8A attendance as Class Teacher', () => {
    const target8AAttendance: ResourceTarget = {
      type: 'ATTENDANCE',
      organizationId: mockOrgId,
      institutionId: 'inst_abc_main',
      branchId: branchIndore,
      sectionId: 'section_8A',
    };

    const decision = authorize(rahulTeacher, 'attendance.correct', target8AAttendance);
    expect(decision.allowed).toBe(true);
  });

  it('2. verifies Rahul can enter Mathematics marks for assigned 8A and 8B', () => {
    const target8AMath: ResourceTarget = {
      type: 'EXAMINATION',
      organizationId: mockOrgId,
      institutionId: 'inst_abc_main',
      branchId: branchIndore,
      sectionId: 'section_8A',
      subjectId: 'sub_math',
    };

    const target8BMath: ResourceTarget = {
      type: 'EXAMINATION',
      organizationId: mockOrgId,
      institutionId: 'inst_abc_main',
      branchId: branchIndore,
      sectionId: 'section_8B',
      subjectId: 'sub_math',
    };

    expect(authorize(rahulTeacher, 'examinations.enter_marks', target8AMath).allowed).toBe(true);
    expect(authorize(rahulTeacher, 'examinations.enter_marks', target8BMath).allowed).toBe(true);
  });

  it('3. strictly DENIES Rahul from entering marks for unassigned 7A or English subject', () => {
    const target7A: ResourceTarget = {
      type: 'EXAMINATION',
      organizationId: mockOrgId,
      institutionId: 'inst_abc_main',
      branchId: branchIndore,
      sectionId: 'section_7A',
      subjectId: 'sub_english', // Not assigned to Rahul
    };

    const decision = authorize(rahulTeacher, 'examinations.enter_marks', target7A);
    expect(decision.allowed).toBe(false);
    expect(decision.denialCode).toBe('OUT_OF_SCOPE');
  });

  it('4. strictly DENIES Rahul from accessing other branch records', () => {
    const targetBhopal: ResourceTarget = {
      type: 'STUDENT',
      organizationId: mockOrgId,
      institutionId: 'inst_abc_main',
      branchId: branchBhopal, // Different branch
      id: 'student_bhopal_101',
    };

    const decision = authorize(rahulTeacher, 'students.view', targetBhopal);
    expect(decision.allowed).toBe(false);
    expect(decision.denialCode).toBe('BRANCH_MISMATCH');
  });

  it('5. strictly DENIES Rahul from viewing or collecting student fees and staff salaries', () => {
    const feeTarget: ResourceTarget = {
      type: 'FEE',
      organizationId: mockOrgId,
      institutionId: 'inst_abc_main',
      branchId: branchIndore,
    };

    const feeDecision = authorize(rahulTeacher, 'fees.collect', feeTarget);
    expect(feeDecision.allowed).toBe(false);
    expect(feeDecision.denialCode).toBe('INSUFFICIENT_ROLE_PERMISSIONS');

    const salaryDecision = authorize(rahulTeacher, 'staff.view_sensitive_hr', {
      type: 'STAFF',
      organizationId: mockOrgId,
    });
    expect(salaryDecision.allowed).toBe(false);
    expect(salaryDecision.denialCode).toBe('INSUFFICIENT_ROLE_PERMISSIONS');
  });

  it('6. verifies Class Monitor (CR) is strictly advisory and barred from marks, attendance, and fees', () => {
    const classMonitor: SecurityActor = {
      id: 'usr_student_cr',
      email: 'cr.8a@abcschool.edu',
      firstName: 'Kabir',
      lastName: 'Monitor',
      role: 'STUDENT',
      organizationId: mockOrgId,
      branchId: branchIndore,
      responsibilities: [
        {
          responsibilityType: 'CLASS_MONITOR',
          title: 'Class Monitor — 8A',
          scopeLevel: 'SECTION',
          sectionId: 'section_8A',
          validFrom: new Date('2026-01-01'),
          status: 'ACTIVE',
        },
      ],
      verifiedChildIds: [],
      studentProfileId: 'student_kabir_id',
    };

    const markTarget: ResourceTarget = {
      type: 'ATTENDANCE',
      organizationId: mockOrgId,
      sectionId: 'section_8A',
    };

    // CR cannot mark attendance
    const attDecision = authorize(classMonitor, 'attendance.mark', markTarget);
    expect(attDecision.allowed).toBe(false);
    expect(attDecision.denialCode).toBe('INSUFFICIENT_ROLE_PERMISSIONS');

    // CR cannot enter marks
    const marksDecision = authorize(classMonitor, 'examinations.enter_marks', {
      type: 'EXAMINATION',
      organizationId: mockOrgId,
      sectionId: 'section_8A',
    });
    expect(marksDecision.allowed).toBe(false);
    expect(marksDecision.denialCode).toBe('INSUFFICIENT_ROLE_PERMISSIONS');

    // CR can create class announcement
    const announceDecision = authorize(classMonitor, 'announcement.create', {
      type: 'COMMUNICATION',
      organizationId: mockOrgId,
      sectionId: 'section_8A',
    });
    expect(announceDecision.allowed).toBe(true);
  });

  it('7. verifies Anti-Hard-Delete protection for core ERP entities', () => {
    expect(() => assertNoHardDelete('ATTENDANCE', 'delete')).toThrow(AuthorizationError);
    expect(() => assertNoHardDelete('MARKS', 'remove')).toThrow(AuthorizationError);
    expect(() => assertNoHardDelete('FEE', 'purge')).toThrow(AuthorizationError);
    expect(() => assertNoHardDelete('LEAVE', 'hard_delete')).toThrow(AuthorizationError);
    expect(() => assertNoHardDelete('STUDENT', 'destroy')).toThrow(AuthorizationError);

    // Non-delete action should NOT throw
    expect(() => assertNoHardDelete('STUDENT', 'archive')).not.toThrow();
  });

  it('8. validates Section 44 Central Module Access Matrix', () => {
    expect(getModuleAccessLevel('PRINCIPAL', 'RESULTS')).toBe('PUBLISH');
    expect(getModuleAccessLevel('TEACHER', 'RESULTS')).toBe('SUBMIT');
    expect(getModuleAccessLevel('ACCOUNTANT', 'RESULTS')).toBe('NONE');

    expect(getModuleAccessLevel('PRINCIPAL', 'SALARY')).toBe('VIEW_SENSITIVE');
    expect(getModuleAccessLevel('TEACHER', 'SALARY')).toBe('NONE');
    expect(getModuleAccessLevel('HR_MANAGER', 'SALARY')).toBe('VIEW_SENSITIVE');

    expect(getModuleAccessLevel('FINANCE_MANAGER', 'FEES')).toBe('APPROVE');
    expect(getModuleAccessLevel('ACCOUNTANT', 'FEES')).toBe('EDIT');
    expect(getModuleAccessLevel('TEACHER', 'FEES')).toBe('NONE');

    expect(getModuleAccessLevel('PRINCIPAL', 'ATTENDANCE')).toBe('APPROVE');
    expect(getModuleAccessLevel('TEACHER', 'ATTENDANCE')).toBe('EDIT');
    expect(getModuleAccessLevel('ACCOUNTANT', 'ATTENDANCE')).toBe('NONE');
  });

  it('9. enforces leave balance validation and rejects when request exceeds available quota', () => {
    const balances = [
      { leaveType: 'CASUAL' as const, totalAllocated: 12, usedDays: 10, pendingDays: 0, availableDays: 2 },
      { leaveType: 'SICK' as const, totalAllocated: 10, usedDays: 3, pendingDays: 0, availableDays: 7 },
    ];

    const result = validateStaffLeaveApplication({
      staffId: 'staff_rahul',
      leaveType: 'CASUAL',
      startDate: '2026-10-01',
      endDate: '2026-10-04',
      totalDays: 4, // Exceeds 2 available
      currentBalances: balances,
      existingLeaves: [],
    });

    expect(result.valid).toBe(false);
    expect(result.hasSufficientBalance).toBe(false);
    expect(result.reasons[0]).toContain('You have 2 CASUAL leave days remaining, but this request requires 4 days');
  });

  it('10. resolves multi-tier teacher leave approval routes by policy', () => {
    // 1 day -> Coordinator
    expect(resolveTeacherLeaveRoute(1)).toEqual(['COORDINATOR']);

    // 2-3 days -> HOD -> Vice Principal
    expect(resolveTeacherLeaveRoute(2)).toEqual(['HOD', 'VICE_PRINCIPAL']);
    expect(resolveTeacherLeaveRoute(3)).toEqual(['HOD', 'VICE_PRINCIPAL']);

    // Long or emergency -> Coordinator -> HOD -> VP -> Principal
    expect(resolveTeacherLeaveRoute(5)).toEqual(['COORDINATOR', 'HOD', 'VICE_PRINCIPAL', 'PRINCIPAL']);
    expect(resolveTeacherLeaveRoute(1, true)).toEqual(['COORDINATOR', 'HOD', 'VICE_PRINCIPAL', 'PRINCIPAL']);
  });

  it('11. ranks substitute teachers intelligently by subject, branch, free slots, and workload', () => {
    const affectedSlots = [
      {
        dayOfWeek: 1, // Monday
        periodNumber: 2,
        className: 'Class 8A',
        sectionName: '8A',
        subjectName: 'Mathematics',
        subjectId: 'sub_math',
        date: '2026-10-05',
      },
    ];

    const candidates = [
      {
        staffId: 'staff_amit',
        fullName: 'Amit Kulkarni',
        designation: 'Mathematics Teacher',
        department: 'Mathematics',
        subjectSpecializations: ['Mathematics', 'Statistics'],
        branchId: branchIndore,
        busySlots: [], // Free during Monday period 2
        weeklyPeriodCount: 16,
      },
      {
        staffId: 'staff_priya',
        fullName: 'Priya Sen',
        designation: 'English Faculty',
        department: 'English',
        subjectSpecializations: ['English Literature'],
        branchId: branchIndore,
        busySlots: [],
        weeklyPeriodCount: 22,
      },
      {
        staffId: 'staff_rajesh',
        fullName: 'Rajesh Nair',
        designation: 'Mathematics Teacher',
        department: 'Mathematics',
        subjectSpecializations: ['Mathematics'],
        branchId: branchBhopal, // Different branch
        busySlots: [{ dayOfWeek: 1, periodNumber: 2 }], // Busy during slot!
        weeklyPeriodCount: 20,
      },
    ];

    const ranked = rankSubstituteCandidates(affectedSlots, candidates, branchIndore);

    // Amit Kulkarni should rank #1: same subject (+40), same branch (+30), free period (+20), low load (+10) = 100
    expect(ranked[0].staffId).toBe('staff_amit');
    expect(ranked[0].isFreeDuringPeriod).toBe(true);
    expect(ranked[0].matchScore).toBe(100);
    expect(ranked[0].recommendedReason).toContain('Teaches same subject domain');
  });

  it('12. detects exam conflicts in student leave requests and escalates route', () => {
    const scheduledExams = [
      { examName: 'Mathematics Term Unit Test', date: '2026-10-15' },
    ];

    const result = validateStudentLeaveApplication({
      studentId: 'student_aarav',
      startDate: '2026-10-14',
      endDate: '2026-10-16',
      totalDays: 3,
      existingLeaves: [],
      scheduledExams,
    });

    expect(result.valid).toBe(true);
    expect(result.hasExamConflict).toBe(true);
    expect(result.examConflictDetails).toContain('Mathematics Term Unit Test');
    // Exam conflict escalates route to Principal
    expect(result.recommendedApprovalRoute).toEqual(['CLASS_TEACHER', 'COORDINATOR', 'PRINCIPAL']);
  });

  it('13. enforces anti-self-approval on multi-tier workflows', () => {
    // User cannot approve their own submission
    const selfApprovalCheck = validateApprovalAction({
      requesterUserId: 'usr_accountant_01',
      actorUserId: 'usr_accountant_01', // Same user!
      actorRole: 'FINANCE_MANAGER',
      currentStep: 'FINANCE_MANAGER_REVIEW',
      workflowType: 'FEE_CONCESSION',
    });

    expect(selfApprovalCheck.allowed).toBe(false);
    expect(selfApprovalCheck.reason).toContain('Self-approval is strictly disallowed');
  });

  it('14. validates multi-tier step advancement in fee concession workflow', () => {
    // Accountant verification -> Next is FINANCE_MANAGER_REVIEW
    const step1Check = validateApprovalAction({
      requesterUserId: 'usr_frontoffice_01',
      actorUserId: 'usr_accountant_01',
      actorRole: 'ACCOUNTANT',
      currentStep: 'ACCOUNTANT_VERIFICATION',
      workflowType: 'FEE_CONCESSION',
    });

    expect(step1Check.allowed).toBe(true);
    expect(step1Check.isFinalStep).toBe(false);
    expect(step1Check.nextStep).toBe('FINANCE_MANAGER_REVIEW');

    // Principal final approval -> isFinalStep: true
    const finalStepCheck = validateApprovalAction({
      requesterUserId: 'usr_frontoffice_01',
      actorUserId: 'usr_principal_01',
      actorRole: 'PRINCIPAL',
      currentStep: 'PRINCIPAL_FINAL_APPROVAL',
      workflowType: 'FEE_CONCESSION',
    });

    expect(finalStepCheck.allowed).toBe(true);
    expect(finalStepCheck.isFinalStep).toBe(true);
  });
});
