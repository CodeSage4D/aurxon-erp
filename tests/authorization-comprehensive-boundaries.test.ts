import { describe, it, expect } from 'vitest';
import {
  authorize,
  getEffectivePermissions,
  sanitizeStaffRecord,
  assertNoHardDelete,
  getScopedStudentQuery,
  getScopedAttendanceQuery,
  getScopedFeeQuery,
  SecurityActor,
  ResourceTarget,
} from '../src/lib/authorization';

describe('AURXON Complete Identity & Authorization Boundary Test Suite', () => {
  // Mock Organizations
  const ORG_A = 'org-dps-delhi';
  const ORG_B = 'org-modern-school';

  // --------------------------------------------------------------------------
  // 1. HORIZONTAL PRIVILEGE ESCALATION PROTECTION
  // --------------------------------------------------------------------------
  describe('Horizontal Escalation Protection', () => {
    const teacherA: SecurityActor = {
      id: 'usr-teacher-a',
      email: 'teacher.a@dps.edu',
      firstName: 'Anita',
      lastName: 'Sharma',
      role: 'TEACHER',
      actorType: 'TEACHER',
      status: 'ACTIVE',
      organizationId: ORG_A,
      institutionId: 'inst-01',
      branchId: 'branch-01',
      assignedSectionIds: ['sec-10a', 'sec-10b'],
      assignedClassIds: ['cls-10'],
      assignedSubjectIds: ['sub-math'],
      responsibilities: [],
      verifiedChildIds: [],
    };

    const studentInSecA: ResourceTarget = {
      type: 'STUDENT',
      organizationId: ORG_A,
      institutionId: 'inst-01',
      branchId: 'branch-01',
      sectionId: 'sec-10a',
      classLevelId: 'cls-10',
      studentId: 'stud-01',
    };

    const studentInSecC: ResourceTarget = {
      type: 'STUDENT',
      organizationId: ORG_A,
      institutionId: 'inst-01',
      branchId: 'branch-01',
      sectionId: 'sec-10c', // Unassigned section!
      classLevelId: 'cls-10',
      studentId: 'stud-02',
    };

    it('allows Teacher A to access assigned student in Section 10-A', () => {
      const decision = authorize(teacherA, 'students.view', studentInSecA);
      expect(decision.allowed).toBe(true);
    });

    it('MUST DENY Teacher A from accessing student in unassigned Section 10-C (Horizontal Escalation)', () => {
      const decision = authorize(teacherA, 'students.view', studentInSecC);
      expect(decision.allowed).toBe(false);
      expect(decision.denialCode).toBe('OUT_OF_SCOPE');
    });

    // Parent Horizontal Escalation
    const parentA: SecurityActor = {
      id: 'usr-parent-a',
      email: 'parent.a@gmail.com',
      firstName: 'Ramesh',
      lastName: 'Kumar',
      role: 'PARENT',
      actorType: 'PARENT',
      status: 'ACTIVE',
      organizationId: ORG_A,
      responsibilities: [],
      verifiedChildIds: ['stud-child-1', 'stud-child-2'],
    };

    it('allows Parent A to access their own verified child records', () => {
      const childResource: ResourceTarget = {
        type: 'STUDENT',
        organizationId: ORG_A,
        studentId: 'stud-child-1',
      };
      const decision = authorize(parentA, 'students.view_own', childResource);
      expect(decision.allowed).toBe(true);
    });

    it("MUST DENY Parent A from accessing another parent's child (Horizontal Escalation)", () => {
      const otherChildResource: ResourceTarget = {
        type: 'STUDENT',
        organizationId: ORG_A,
        studentId: 'stud-child-999',
      };
      const decision = authorize(parentA, 'students.view_own', otherChildResource);
      expect(decision.allowed).toBe(false);
      expect(decision.denialCode).toBe('UNVERIFIED_CHILD_RELATION');
    });

    // Student Horizontal Escalation
    const studentA: SecurityActor = {
      id: 'usr-student-a',
      email: 'student.a@dps.edu',
      firstName: 'Aarav',
      lastName: 'Kumar',
      role: 'STUDENT',
      actorType: 'STUDENT',
      status: 'ACTIVE',
      organizationId: ORG_A,
      studentProfileId: 'stud-profile-a',
      responsibilities: [],
      verifiedChildIds: [],
    };

    it('allows Student A to access self academic records', () => {
      const selfResource: ResourceTarget = {
        type: 'STUDENT',
        organizationId: ORG_A,
        studentId: 'stud-profile-a',
      };
      const decision = authorize(studentA, 'students.view_own', selfResource);
      expect(decision.allowed).toBe(true);
    });

    it('MUST DENY Student A from accessing another student records (Horizontal Escalation)', () => {
      const peerResource: ResourceTarget = {
        type: 'STUDENT',
        organizationId: ORG_A,
        studentId: 'stud-profile-b',
      };
      const decision = authorize(studentA, 'students.view_own', peerResource);
      expect(decision.allowed).toBe(false);
      expect(decision.denialCode).toBe('OUT_OF_SCOPE');
    });
  });

  // --------------------------------------------------------------------------
  // 2. VERTICAL PRIVILEGE ESCALATION PROTECTION
  // --------------------------------------------------------------------------
  describe('Vertical Escalation Protection', () => {
    const teacher: SecurityActor = {
      id: 'usr-teacher',
      email: 'teacher@dps.edu',
      firstName: 'Pooja',
      lastName: 'Verma',
      role: 'TEACHER',
      actorType: 'TEACHER',
      status: 'ACTIVE',
      organizationId: ORG_A,
      responsibilities: [],
      verifiedChildIds: [],
    };

    const accountant: SecurityActor = {
      id: 'usr-accountant',
      email: 'accountant@dps.edu',
      firstName: 'Rajesh',
      lastName: 'Gupta',
      role: 'ACCOUNTANT',
      actorType: 'ACCOUNTANT',
      status: 'ACTIVE',
      organizationId: ORG_A,
      responsibilities: [],
      verifiedChildIds: [],
    };

    const receptionist: SecurityActor = {
      id: 'usr-receptionist',
      email: 'reception@dps.edu',
      firstName: 'Sunita',
      lastName: 'Rao',
      role: 'FRONT_OFFICE',
      actorType: 'RECEPTIONIST',
      scope: 'BASIC_PROFILE',
      status: 'ACTIVE',
      organizationId: ORG_A,
      responsibilities: [],
      verifiedChildIds: [],
    };

    const hrManager: SecurityActor = {
      id: 'usr-hr',
      email: 'hr@dps.edu',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      role: 'HR_MANAGER',
      actorType: 'HR_MANAGER',
      status: 'ACTIVE',
      organizationId: ORG_A,
      responsibilities: [],
      verifiedChildIds: [],
    };

    it('MUST DENY Teacher from accessing payroll (Vertical Escalation)', () => {
      const decision = authorize(teacher, 'payroll.read', {
        type: 'STAFF',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(false);
    });

    it('MUST DENY Accountant from accessing staff payroll or confidential salary (Vertical Escalation)', () => {
      const decision = authorize(accountant, 'payroll.read', {
        type: 'STAFF',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('strictly prohibited');
    });

    it('MUST ALLOW Accountant to access student fees and collections', () => {
      const decision = authorize(accountant, 'fees.collect', {
        type: 'FEE',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(true);
    });

    it('MUST ALLOW HR Manager to access payroll and staff sensitive HR data', () => {
      const decision = authorize(hrManager, 'staff.view_sensitive_hr', {
        type: 'STAFF',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(true);
    });

    it('MUST DENY Receptionist from accessing sensitive student identity data', () => {
      const decision = authorize(receptionist, 'students.view_sensitive', {
        type: 'STUDENT',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.denialCode).toBe('RESTRICTED_SENSITIVE_DATA');
    });

    it('allows Receptionist to view basic student directory', () => {
      const decision = authorize(receptionist, 'students.view', {
        type: 'STUDENT',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. CROSS-TENANT ISOLATION
  // --------------------------------------------------------------------------
  describe('Cross-Tenant Isolation', () => {
    const orgAAdmin: SecurityActor = {
      id: 'usr-admin-a',
      email: 'admin@dps.edu',
      firstName: 'Karan',
      lastName: 'Admin',
      role: 'ORG_ADMIN',
      actorType: 'INSTITUTION_ADMIN',
      status: 'ACTIVE',
      organizationId: ORG_A,
      responsibilities: [],
      verifiedChildIds: [],
    };

    const orgBResource: ResourceTarget = {
      type: 'STUDENT',
      organizationId: ORG_B,
      studentId: 'stud-modern-01',
    };

    it('MUST DENY Organization A Admin from accessing Organization B resource (Tenant Isolation)', () => {
      const decision = authorize(orgAAdmin, 'students.view', orgBResource);
      expect(decision.allowed).toBe(false);
      expect(decision.denialCode).toBe('TENANT_MISMATCH');
    });

    it('allows Platform Super Admin global bypass across tenants', () => {
      const superAdmin: SecurityActor = {
        id: 'usr-superadmin',
        email: 'super@aurxon.internal',
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        actorType: 'PLATFORM_SUPER_ADMIN',
        status: 'ACTIVE',
        organizationId: 'platform-org',
        responsibilities: [],
        verifiedChildIds: [],
      };
      const decision = authorize(superAdmin, 'students.view', orgBResource);
      expect(decision.allowed).toBe(true);
      expect(decision.matchedRule).toBe('PLATFORM_SUPER_ADMIN_OVERRIDE');
    });
  });

  // --------------------------------------------------------------------------
  // 4. USER CUSTOM PERMISSION OVERRIDES & ACCOUNT STATUS
  // --------------------------------------------------------------------------
  describe('User Custom Permission Overrides & Inactive Status', () => {
    it('applies custom permission override: explicit grant allows action not in default role', () => {
      const teacherWithSpecialGrant: SecurityActor = {
        id: 'usr-teacher-grant',
        email: 'teacher.grant@dps.edu',
        firstName: 'Siddharth',
        lastName: 'Sen',
        role: 'TEACHER',
        status: 'ACTIVE',
        organizationId: ORG_A,
        responsibilities: [],
        verifiedChildIds: [],
        customPermissions: {
          'fees.view': true, // Custom explicit grant
        },
      };

      const decision = authorize(teacherWithSpecialGrant, 'fees.view', {
        type: 'FEE',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(true);
    });

    it('applies custom permission override: explicit deny revokes action normally in default role', () => {
      const teacherWithRevoke: SecurityActor = {
        id: 'usr-teacher-revoke',
        email: 'teacher.revoke@dps.edu',
        firstName: 'Manish',
        lastName: 'Dubey',
        role: 'TEACHER',
        status: 'ACTIVE',
        organizationId: ORG_A,
        responsibilities: [],
        verifiedChildIds: [],
        customPermissions: {
          'attendance.mark': false, // Custom explicit denial
        },
      };

      const decision = authorize(teacherWithRevoke, 'attendance.mark', {
        type: 'ATTENDANCE',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('explicitly denied via user permission override');
    });

    it('FAILS CLOSED if user account is disabled or suspended', () => {
      const suspendedUser: SecurityActor = {
        id: 'usr-suspended',
        email: 'suspended@dps.edu',
        firstName: 'Inactive',
        lastName: 'User',
        role: 'PRINCIPAL',
        status: 'SUSPENDED',
        organizationId: ORG_A,
        responsibilities: [],
        verifiedChildIds: [],
      };

      const decision = authorize(suspendedUser, 'students.view', {
        type: 'STUDENT',
        organizationId: ORG_A,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('suspended');
    });
  });

  // --------------------------------------------------------------------------
  // 5. QUERY SCOPING ENGINE TESTS
  // --------------------------------------------------------------------------
  describe('Query Scoper Service', () => {
    it('scopes Teacher query to assigned sections and classes', () => {
      const teacher: SecurityActor = {
        id: 't1',
        email: 't1@dps.edu',
        firstName: 'T',
        lastName: 'One',
        role: 'TEACHER',
        status: 'ACTIVE',
        organizationId: ORG_A,
        assignedSectionIds: ['sec-1', 'sec-2'],
        assignedClassIds: ['cls-1'],
        responsibilities: [],
        verifiedChildIds: [],
      };

      const query = getScopedStudentQuery(teacher);
      expect(query.organizationId).toBe(ORG_A);
      expect(query.OR).toBeDefined();
      expect(query.OR).toContainEqual({ sectionId: { in: ['sec-1', 'sec-2'] } });
      expect(query.OR).toContainEqual({ section: { classLevelId: { in: ['cls-1'] } } });
    });

    it('scopes Parent query strictly to verified child IDs', () => {
      const parent: SecurityActor = {
        id: 'p1',
        email: 'p1@dps.edu',
        firstName: 'P',
        lastName: 'One',
        role: 'PARENT',
        status: 'ACTIVE',
        organizationId: ORG_A,
        verifiedChildIds: ['child-101', 'child-102'],
        responsibilities: [],
      };

      const query = getScopedStudentQuery(parent);
      expect(query.organizationId).toBe(ORG_A);
      expect(query.id).toEqual({ in: ['child-101', 'child-102'] });
    });

    it('scopes Student query strictly to self studentProfileId', () => {
      const student: SecurityActor = {
        id: 's1',
        email: 's1@dps.edu',
        firstName: 'S',
        lastName: 'One',
        role: 'STUDENT',
        status: 'ACTIVE',
        organizationId: ORG_A,
        studentProfileId: 'profile-student-99',
        responsibilities: [],
        verifiedChildIds: [],
      };

      const query = getScopedStudentQuery(student);
      expect(query.organizationId).toBe(ORG_A);
      expect(query.id).toBe('profile-student-99');
    });

    it('scopes Fee query for parent to verified children', () => {
      const parent: SecurityActor = {
        id: 'p1',
        email: 'p1@dps.edu',
        firstName: 'P',
        lastName: 'One',
        role: 'PARENT',
        status: 'ACTIVE',
        organizationId: ORG_A,
        verifiedChildIds: ['child-101'],
        responsibilities: [],
      };

      const query = getScopedFeeQuery(parent);
      expect(query.organizationId).toBe(ORG_A);
      expect(query.studentId).toEqual({ in: ['child-101'] });
    });

    it('scopes Attendance query for student to self profile', () => {
      const student: SecurityActor = {
        id: 's1',
        email: 's1@dps.edu',
        firstName: 'S',
        lastName: 'One',
        role: 'STUDENT',
        status: 'ACTIVE',
        organizationId: ORG_A,
        studentProfileId: 'profile-student-99',
        responsibilities: [],
        verifiedChildIds: [],
      };

      const query = getScopedAttendanceQuery(student);
      expect(query.organizationId).toBe(ORG_A);
      expect(query.studentId).toBe('profile-student-99');
    });
  });

  // --------------------------------------------------------------------------
  // 6. SENSITIVE HR DATA SANITIZATION
  // --------------------------------------------------------------------------
  describe('Sensitive HR Data Sanitization', () => {
    const rawStaffRecord = {
      id: 'staff-01',
      firstName: 'Rohan',
      lastName: 'Verma',
      employeeId: 'EMP-DPS-001',
      department: 'Mathematics',
      designation: 'Senior Faculty',
      basicSalary: 85000,
      bankAccountNumber: '918237192837',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '1234-5678-9012',
    };

    it('redacts basicSalary, bank details, and tax identifiers for unauthorized actors (Accountant/Teacher/Public)', () => {
      const sanitized = sanitizeStaffRecord(rawStaffRecord, false);
      expect(sanitized.firstName).toBe('Rohan');
      expect(sanitized.designation).toBe('Senior Faculty');
      expect((sanitized as any).basicSalary).toBeUndefined();
      expect((sanitized as any).bankAccountNumber).toBeUndefined();
      expect((sanitized as any).panNumber).toBeUndefined();
      expect((sanitized as any).aadhaarNumber).toBeUndefined();
    });

    it('preserves confidential fields for authorized HR Manager or Principal', () => {
      const unredacted = sanitizeStaffRecord(rawStaffRecord, true);
      expect(unredacted.basicSalary).toBe(85000);
      expect(unredacted.bankAccountNumber).toBe('918237192837');
      expect(unredacted.panNumber).toBe('ABCDE1234F');
    });
  });

  // --------------------------------------------------------------------------
  // 7. HARD DELETE PROHIBITION
  // --------------------------------------------------------------------------
  describe('Hard Delete Prohibition', () => {
    it('throws error when hard delete is attempted on protected core school entity', () => {
      expect(() => assertNoHardDelete('STUDENT', 'delete')).toThrow(
        /Hard delete prohibited for core entity 'STUDENT'/
      );
      expect(() => assertNoHardDelete('ATTENDANCE', 'destroy')).toThrow();
      expect(() => assertNoHardDelete('FEE', 'purge')).toThrow();
    });

    it('allows non-destructive operations on core entities', () => {
      expect(() => assertNoHardDelete('STUDENT', 'archive')).not.toThrow();
      expect(() => assertNoHardDelete('FEE', 'void')).not.toThrow();
    });
  });
});
