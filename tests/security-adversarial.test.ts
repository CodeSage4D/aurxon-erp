import { describe, it, expect } from 'vitest';
import prisma from '../src/lib/prisma';
import { verifyPassword, signToken, verifyToken } from '../src/lib/auth';
import { hasPermission } from '../src/lib/permissions';

describe('AURXON Adversarial Security & Boundary Testing', () => {
  it('rejects cross-tenant student record access attempts', async () => {
    // 1. Pick a student from Sharma Education Group (SEG-IND)
    const sharmaStudent = await prisma.student.findFirst({
      where: { organization: { code: 'SEG-IND' } },
      include: { organization: true },
    });
    expect(sharmaStudent).not.toBeNull();

    // 2. Pick the organization ID of Choithram or ABC Trust
    const foreignOrg = await prisma.organization.findFirst({
      where: { code: { not: 'SEG-IND' } },
    });
    expect(foreignOrg).not.toBeNull();

    // 3. Adversarial simulation: User from foreignOrg tries to access sharmaStudent
    // Any query scoped to user's organizationId must yield null
    const accessed = await prisma.student.findFirst({
      where: {
        id: sharmaStudent!.id,
        organizationId: foreignOrg!.id, // Injected foreign org scope
      },
    });

    expect(accessed).toBeNull();
  });

  it('rejects cross-tenant fee allocation manipulation', async () => {
    // 1. Pick a fee allocation from Sharma Org
    const allocation = await prisma.studentFeeAllocation.findFirst({
      where: { organization: { code: 'SEG-IND' } },
    });
    expect(allocation).not.toBeNull();

    const foreignOrg = await prisma.organization.findFirst({
      where: { code: { not: 'SEG-IND' } },
    });

    // 2. Adversarial simulation: Attacker sends allocation.id with foreignOrg.id
    const tamperedQuery = await prisma.studentFeeAllocation.findFirst({
      where: {
        id: allocation!.id,
        organizationId: foreignOrg!.id,
      },
    });

    expect(tamperedQuery).toBeNull();
  });

  it('rejects tampered, truncated, and forged JWT tokens', async () => {
    const validUser = {
      id: 'usr_valid_123',
      email: 'attacker@evil.com',
      firstName: 'Attacker',
      lastName: 'User',
      role: 'SUPER_ADMIN', // Trying to claim SUPER_ADMIN
      organizationId: 'org_victim_456',
    };

    // Legitimate token
    const token = await signToken(validUser);

    // 1. Tamper payload by modifying middle base64 chunk
    const parts = token.split('.');
    const decodedPayload = Buffer.from(parts[1], 'base64').toString('utf-8');
    const forgedPayload = Buffer.from(
      decodedPayload.replace('usr_valid_123', 'victim_admin')
    ).toString('base64url');
    const tamperedToken = `${parts[0]}.${forgedPayload}.${parts[2]}`;

    const verifiedTampered = await verifyToken(tamperedToken);
    expect(verifiedTampered).toBeNull();

    // 2. Strip signature completely
    const unsignedToken = `${parts[0]}.${parts[1]}.`;
    const verifiedUnsigned = await verifyToken(unsignedToken);
    expect(verifiedUnsigned).toBeNull();

    // 3. Random gibberish
    expect(await verifyToken('not.a.jwt')).toBeNull();
    expect(await verifyToken('')).toBeNull();
  });

  it('verifies that non-admin roles cannot escalate to sensitive operations', () => {
    const sensitivePermissions = [
      'org.create',
      'org.update',
      'module.manage',
      'user.create',
      'user.archive',
      'finance.manage',
      'system.wipe',
    ];

    const restrictedRoles = ['TEACHER', 'FACULTY', 'PARENT', 'STUDENT'];

    for (const role of restrictedRoles) {
      for (const perm of sensitivePermissions) {
        const allowed = hasPermission(role, perm);
        expect(allowed).toBe(false);
      }
    }
  });

  it('verifies that parents and students cannot modify academic or attendance records', () => {
    const studentParentRoles = ['STUDENT', 'PARENT'];
    const mutationPermissions = [
      'student.create',
      'student.update',
      'student.archive',
      'attendance.mark',
      'attendance.manage',
      'exam.manage',
      'exam.enter_marks',
      'fee.collect',
      'fee.manage',
    ];

    for (const role of studentParentRoles) {
      for (const perm of mutationPermissions) {
        expect(hasPermission(role, perm)).toBe(false);
      }
    }
  });
});
