import { describe, it, expect } from 'vitest';
import prisma from '../src/lib/prisma';
import { hasPermission } from '../src/lib/permissions';

describe('AURXON Multi-Tenancy Security & Data Isolation', () => {
  it('strictly isolates students across different organizations', async () => {
    // 1. Fetch Sharma Education Group
    const sharmaOrg = await prisma.organization.findFirst({
      where: { code: 'SEG-IND' },
      include: { students: true },
    });

    // 2. Fetch St. Mary's or ABC Trust
    const otherOrg = await prisma.organization.findFirst({
      where: { code: 'ABC-TRUST' },
      include: { students: true },
    });

    expect(sharmaOrg).not.toBeNull();
    expect(otherOrg).not.toBeNull();

    // Verify Sharma Org students all have organizationId matching sharmaOrg.id
    for (const student of sharmaOrg!.students) {
      expect(student.organizationId).toBe(sharmaOrg!.id);
      expect(student.organizationId).not.toBe(otherOrg!.id);
    }

    // Attempting a query with otherOrg's ID on sharmaOrg's student should yield 0 results
    if (sharmaOrg!.students.length > 0) {
      const crossTenantAttempt = await prisma.student.findFirst({
        where: {
          id: sharmaOrg!.students[0].id,
          organizationId: otherOrg!.id, // Tampered tenant scope
        },
      });
      expect(crossTenantAttempt).toBeNull();
    }
  });

  it('strictly isolates multi-branch students within the same organization', async () => {
    const sharmaOrg = await prisma.organization.findFirst({
      where: { code: 'SEG-IND' },
      include: { institutions: { include: { branches: true } } },
    });

    expect(sharmaOrg).not.toBeNull();
    const branches = sharmaOrg!.institutions.flatMap((i) => i.branches);
    const mainBranch = branches.find((b) => b.code === 'SPS-MAIN');
    const rauBranch = branches.find((b) => b.code === 'SPS-RAU');

    expect(mainBranch).toBeDefined();
    expect(rauBranch).toBeDefined();

    // Students in Main Branch vs Rau Branch
    const mainStudents = await prisma.student.findMany({
      where: { organizationId: sharmaOrg!.id, branchId: mainBranch!.id },
    });

    const rauStudents = await prisma.student.findMany({
      where: { organizationId: sharmaOrg!.id, branchId: rauBranch!.id },
    });

    expect(mainStudents.length).toBeGreaterThan(0);
    expect(rauStudents.length).toBeGreaterThan(0);

    // Verify zero overlap between branch cohorts
    const mainStudentIds = new Set(mainStudents.map((s) => s.id));
    for (const rauStudent of rauStudents) {
      expect(mainStudentIds.has(rauStudent.id)).toBe(false);
    }
  });

  it('verifies that fee structures and payments cannot cross organization lines', async () => {
    const allAllocations = await prisma.studentFeeAllocation.findMany({
      include: { student: true, feeStructure: true },
    });

    expect(allAllocations.length).toBeGreaterThan(0);

    for (const alloc of allAllocations) {
      // The allocation's organizationId must match the student's organizationId
      expect(alloc.organizationId).toBe(alloc.student.organizationId);
      // The fee structure's organizationId must match the allocation's organizationId
      expect(alloc.feeStructure.organizationId).toBe(alloc.organizationId);
    }
  });

  it('enforces RBAC role privilege barriers against privilege escalation', () => {
    // 1. Teacher cannot perform financial or administrative mutations
    expect(hasPermission('TEACHER', 'fee.collect')).toBe(false);
    expect(hasPermission('TEACHER', 'fee.manage')).toBe(false);
    expect(hasPermission('TEACHER', 'user.create')).toBe(false);
    expect(hasPermission('TEACHER', 'module.manage')).toBe(false);

    // 2. Accountant cannot tamper with academics or grades
    expect(hasPermission('ACCOUNTANT', 'exam.enter_marks')).toBe(false);
    expect(hasPermission('ACCOUNTANT', 'exam.manage')).toBe(false);
    expect(hasPermission('ACCOUNTANT', 'attendance.mark')).toBe(false);

    // 3. Principal has institution-scoped operational rights but no SaaS platform management
    expect(hasPermission('PRINCIPAL', 'org.create')).toBe(false);
    expect(hasPermission('PRINCIPAL', 'system.wipe')).toBe(false);
    expect(hasPermission('PRINCIPAL', 'student.create')).toBe(true);
    expect(hasPermission('PRINCIPAL', 'attendance.manage')).toBe(true);

    // 4. Super Admin holds absolute administrative wildcard
    expect(hasPermission('SUPER_ADMIN', 'org.create')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'module.manage')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'system.wipe')).toBe(true);
  });
});
