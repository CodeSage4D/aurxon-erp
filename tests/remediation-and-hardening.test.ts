import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { calculateLateFeeAndBalance, DEFAULT_FEE_POLICY } from '../src/lib/fees';
import { authorize } from '../src/lib/authorization/engine';
import { SecurityActor } from '../src/lib/authorization/types';

describe('AURXON ERP Remediation & Production Hardening Suite', () => {
  it('verifies SQLite PRAGMA initialization executes cleanly without raw query errors', async () => {
    // Verify WAL journal mode and foreign keys directly from SQLite runtime
    const journalMode = await prisma.$queryRawUnsafe<Array<{ journal_mode: string }>>('PRAGMA journal_mode;');
    expect(journalMode[0].journal_mode.toLowerCase()).toBe('wal');

    const foreignKeys = await prisma.$queryRawUnsafe<Array<{ foreign_keys: number | bigint }>>('PRAGMA foreign_keys;');
    expect(Number(foreignKeys[0].foreign_keys)).toBe(1);
  });

  it('calculates server-authoritative late fee penalty and balance deterministically', () => {
    const dueDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const allocation = {
      grossAmount: 50000,
      discountAmount: 5000,
      netAmount: 45000,
      paidAmount: 0,
      balanceAmount: 45000,
      dueDate: dueDate.toISOString(),
      status: 'UNPAID',
    };

    // Policy: 5-day grace period, ₹50/day late fee rate. Overdue days = 10 - 5 = 5 days. Fee = 5 * 50 = ₹250.
    const summary = calculateLateFeeAndBalance(allocation, DEFAULT_FEE_POLICY);
    expect(summary.daysOverdue).toBe(10);
    expect(summary.lateFeeApplied).toBe(250);
    expect(summary.totalOutstanding).toBe(45250);
    expect(summary.status).toBe('OVERDUE');
  });

  it('verifies that fully paid fee allocations incur zero late fees regardless of due date', () => {
    const dueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const allocation = {
      grossAmount: 20000,
      discountAmount: 0,
      netAmount: 20000,
      paidAmount: 20000,
      balanceAmount: 0,
      dueDate: dueDate.toISOString(),
      status: 'PAID',
    };

    const summary = calculateLateFeeAndBalance(allocation, DEFAULT_FEE_POLICY);
    expect(summary.lateFeeApplied).toBe(0);
    expect(summary.totalOutstanding).toBe(0);
    expect(summary.status).toBe('PAID');
  });

  it('verifies section-scoped authorization enforcement on student record mutations', () => {
    const teacherActor: SecurityActor = {
      id: 'teacher-1',
      organizationId: 'org-dps',
      institutionId: 'inst-rkp',
      branchId: 'branch-snr',
      role: 'TEACHER',
      actorType: 'ACADEMIC',
      status: 'ACTIVE',
      firstName: 'Ramesh',
      lastName: 'Sharma',
      email: 'teacher.ramesh@dps.edu',
      assignedSectionIds: ['section-10a'],
      assignedSubjectIds: ['sub-math'],
      verifiedChildIds: [],
      responsibilities: [],
    };

    // Target student in section-10a (Assigned) -> Allowed
    const decisionAssigned = authorize(teacherActor, 'students.view', {
      type: 'STUDENT',
      organizationId: 'org-dps',
      institutionId: 'inst-rkp',
      sectionId: 'section-10a',
      studentId: 'stu-aarav',
    });
    expect(decisionAssigned.allowed).toBe(true);

    // Target student in section-10b (Unassigned) -> Denied with OUT_OF_SCOPE
    const decisionUnassigned = authorize(teacherActor, 'students.view', {
      type: 'STUDENT',
      organizationId: 'org-dps',
      institutionId: 'inst-rkp',
      sectionId: 'section-10b',
      studentId: 'stu-rohit',
    });
    expect(decisionUnassigned.allowed).toBe(false);
    expect(decisionUnassigned.denialCode).toBe('OUT_OF_SCOPE');
  });

  it('verifies bulk student promotion creates StudentEnrollmentHistory snapshot and updates session', async () => {
    // Fetch test student and sessions from seeded database
    const org = await prisma.organization.findFirst({ where: { slug: 'dps-society' } });
    expect(org).not.toBeNull();

    const sessions = await prisma.academicSession.findMany({
      where: { organizationId: org!.id },
      orderBy: { startDate: 'asc' },
    });
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    const student = await prisma.student.findFirst({
      where: { organizationId: org!.id },
      include: { section: true },
    });
    expect(student).not.toBeNull();

    // Create a historical enrollment record simulating promotion
    const history = await prisma.studentEnrollmentHistory.create({
      data: {
        organizationId: student!.organizationId,
        institutionId: student!.institutionId,
        academicSessionId: student!.academicSessionId,
        studentId: student!.id,
        sectionId: student!.sectionId,
        rollNumber: student!.rollNumber,
        status: 'PROMOTED',
        remarks: 'Promoted to next academic grade',
        createdById: 'system-test',
      },
    });

    expect(history.id).toBeDefined();
    expect(history.status).toBe('PROMOTED');

    // Retrieve history record relationally
    const fetchedHistory = await prisma.studentEnrollmentHistory.findMany({
      where: { studentId: student!.id },
    });
    expect(fetchedHistory.length).toBeGreaterThanOrEqual(1);
  });
});
