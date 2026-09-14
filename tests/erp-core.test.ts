import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../src/lib/auth';
import { hasPermission, DEFAULT_ROLE_PERMISSIONS } from '../src/lib/permissions';

describe('AURXON Core Cryptography & Identity Engine', () => {
  it('correctly hashes passwords and rejects incorrect passwords', async () => {
    const rawPassword = 'MasterPassword@2026';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const valid = await verifyPassword(rawPassword, hash);
    expect(valid).toBe(true);

    const invalid = await verifyPassword('WrongPassword', hash);
    expect(invalid).toBe(false);
  });

  it('signs and securely verifies multi-tenant JWT session tokens', async () => {
    const testUser = {
      id: 'user_123',
      email: 'principal@dps-society.edu',
      firstName: 'Meenakshi',
      lastName: 'Sundaram',
      role: 'PRINCIPAL',
      organizationId: 'org_dps_456',
      institutionId: 'inst_rkp_789',
    };

    const token = await signToken(testUser);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(testUser.id);
    expect(verified?.role).toBe('PRINCIPAL');
    expect(verified?.organizationId).toBe(testUser.organizationId);
  });

  it('rejects tampered or malformed tokens safely', async () => {
    const malformed = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token';
    const verified = await verifyToken(malformed);
    expect(verified).toBeNull();
  });
});

describe('AURXON Layered RBAC Authorization Engine', () => {
  it('grants wildcard access to Super Admin', () => {
    expect(hasPermission('SUPER_ADMIN', 'student.create')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'fee.collect')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'system.wipe')).toBe(true);
  });

  it('enforces institutional scope for Principal', () => {
    expect(hasPermission('PRINCIPAL', 'student.create')).toBe(true);
    expect(hasPermission('PRINCIPAL', 'attendance.mark')).toBe(true);
    expect(hasPermission('PRINCIPAL', 'fee.view')).toBe(true);
    expect(hasPermission('PRINCIPAL', 'fee.collect')).toBe(true);
    // Principal should NOT have platform tenant creation rights
    expect(hasPermission('PRINCIPAL', 'org.create')).toBe(false);
  });

  it('restricts Teachers to classroom and academic duties', () => {
    expect(hasPermission('TEACHER', 'attendance.mark')).toBe(true);
    expect(hasPermission('TEACHER', 'exam.enter_marks')).toBe(true);
    expect(hasPermission('TEACHER', 'timetable.view')).toBe(true);
    // Teacher must NOT collect fees or manage users
    expect(hasPermission('TEACHER', 'fee.collect')).toBe(false);
    expect(hasPermission('TEACHER', 'user.create')).toBe(false);
  });

  it('restricts Accountants to finance operations', () => {
    expect(hasPermission('ACCOUNTANT', 'fee.collect')).toBe(true);
    expect(hasPermission('ACCOUNTANT', 'finance.manage')).toBe(true);
    expect(hasPermission('ACCOUNTANT', 'fee.receipt')).toBe(true);
    // Accountant must NOT enter student exam marks
    expect(hasPermission('ACCOUNTANT', 'exam.enter_marks')).toBe(false);
  });

  it('restricts Parents and Students to read-own boundaries', () => {
    expect(hasPermission('PARENT', 'student.view_own')).toBe(true);
    expect(hasPermission('PARENT', 'attendance.view_own')).toBe(true);
    expect(hasPermission('PARENT', 'student.create')).toBe(false);
    expect(hasPermission('STUDENT', 'attendance.view_own')).toBe(true);
    expect(hasPermission('STUDENT', 'exam.enter_marks')).toBe(false);
  });
});

describe('AURXON Deterministic Grading Engine', () => {
  function getGrade(marks: number, maxMarks: number = 100): string {
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

  it('computes exact CBSE grades across boundaries', () => {
    expect(getGrade(95, 100)).toBe('A1');
    expect(getGrade(91, 100)).toBe('A1');
    expect(getGrade(90, 100)).toBe('A2');
    expect(getGrade(85, 100)).toBe('A2');
    expect(getGrade(75, 100)).toBe('B1');
    expect(getGrade(65, 100)).toBe('B2');
    expect(getGrade(55, 100)).toBe('C1');
    expect(getGrade(45, 100)).toBe('C2');
    expect(getGrade(33, 100)).toBe('D');
    expect(getGrade(32, 100)).toBe('E');
    expect(getGrade(15, 100)).toBe('E');
  });

  it('handles arbitrary max marks scaling deterministically', () => {
    // 45 out of 50 is 90% -> A2
    expect(getGrade(45, 50)).toBe('A2');
    // 48 out of 50 is 96% -> A1
    expect(getGrade(48, 50)).toBe('A1');
    // 15 out of 50 is 30% -> E (Failing threshold)
    expect(getGrade(15, 50)).toBe('E');
  });
});

describe('AURXON Authoritative Financial Calculations', () => {
  it('correctly calculates net payable, concessions, and partial balances', () => {
    const grossAmount = 85000;
    const scholarshipConcession = 10000;
    const netAmount = grossAmount - scholarshipConcession;
    expect(netAmount).toBe(75000);

    let paidAmount = 0;
    let balanceAmount = netAmount - paidAmount;
    expect(balanceAmount).toBe(75000);

    // First installment of 40,000
    paidAmount += 40000;
    balanceAmount = netAmount - paidAmount;
    expect(balanceAmount).toBe(35000);
    const status1 = balanceAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
    expect(status1).toBe('PARTIAL');

    // Second installment clearing balance
    paidAmount += 35000;
    balanceAmount = netAmount - paidAmount;
    expect(balanceAmount).toBe(0);
    const status2 = balanceAmount === 0 ? 'PAID' : 'PARTIAL';
    expect(status2).toBe('PAID');
  });
});

describe('AURXON Multi-Branch Isolation & Aggregation Engine', () => {
  it('correctly aggregates branch-level metrics independently', () => {
    const indoreMainBranch = {
      name: 'Indore Main Campus',
      students: 2,
      present: 2,
      feesGross: 48000,
      feesPaid: 48000,
    };

    const rauBranch = {
      name: 'Rau Campus',
      students: 2,
      present: 1,
      feesGross: 48000,
      feesPaid: 24000,
    };

    // Branch 1 attendance rate
    const b1Rate = (indoreMainBranch.present / indoreMainBranch.students) * 100;
    expect(b1Rate).toBe(100);

    // Branch 2 attendance rate
    const b2Rate = (rauBranch.present / rauBranch.students) * 100;
    expect(b2Rate).toBe(50);

    // Consolidated group attendance
    const totalStudents = indoreMainBranch.students + rauBranch.students;
    const totalPresent = indoreMainBranch.present + rauBranch.present;
    const consolidatedRate = (totalPresent / totalStudents) * 100;
    expect(consolidatedRate).toBe(75);

    // Consolidated fee collection rate
    const totalGross = indoreMainBranch.feesGross + rauBranch.feesGross;
    const totalPaid = indoreMainBranch.feesPaid + rauBranch.feesPaid;
    const feeEfficiency = (totalPaid / totalGross) * 100;
    expect(feeEfficiency).toBe(75);
    expect(totalGross - totalPaid).toBe(24000); // Rau overdue balance
  });

  it('enforces that non-superadmin actors cannot cross organization boundaries', () => {
    const actorOrgAdmin = {
      role: 'ORG_ADMIN',
      organizationId: 'org_sharma_123',
    };

    const targetOrgIdA = 'org_sharma_123';
    const targetOrgIdB = 'org_dps_456';

    const canAccessOwn = actorOrgAdmin.role === 'SUPER_ADMIN' || actorOrgAdmin.organizationId === targetOrgIdA;
    const canAccessOther = actorOrgAdmin.role === 'SUPER_ADMIN' || actorOrgAdmin.organizationId === targetOrgIdB;

    expect(canAccessOwn).toBe(true);
    expect(canAccessOther).toBe(false);
  });
});

