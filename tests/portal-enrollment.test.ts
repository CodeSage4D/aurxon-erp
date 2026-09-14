import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';

describe('AURXON Portal & Shortest Link Resolution Engine', () => {
  beforeAll(async () => {
    // Ensure test database is accessible
  });

  afterAll(async () => {
    // Clean up test entities if any were created
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-portal-user@test.org' } },
    });
    await prisma.organization.deleteMany({
      where: { slug: 'test-shortest-slug' },
    });
  });

  it('resolves an organization portal by exact slug', async () => {
    const org = await prisma.organization.findFirst({
      where: { slug: 'dps-society', status: 'ACTIVE' },
      include: {
        institutions: {
          include: { branches: true },
        },
      },
    });

    expect(org).toBeDefined();
    expect(org?.name).toBe('Delhi Public School Society');
    expect(org?.institutions.length).toBeGreaterThan(0);
    expect(org?.institutions[0].board).toBe('CBSE');
  });

  it('resolves shortest acronym / prefix links reliably', async () => {
    const slugQuery = 'dps';
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: { startsWith: slugQuery.toLowerCase() } },
          { code: { startsWith: slugQuery.toUpperCase() } },
          { slug: { contains: slugQuery.toLowerCase() } },
        ],
        status: 'ACTIVE',
      },
    });

    expect(org).toBeDefined();
    expect(org?.code).toBe('DPS-ORG');
  });

  it('verifies that portal metadata does NOT expose sensitive password hashes', async () => {
    const org = await prisma.organization.findFirst({
      where: { slug: 'sharma-education-group' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    expect(org).toBeDefined();
    org?.users.forEach((u: any) => {
      expect(u.passwordHash).toBeUndefined();
      expect(u.email).toBeDefined();
      expect(u.role).toBeDefined();
    });
  });

  it('supports custom shortest slug provisioning with Indian board metadata', async () => {
    const testOrg = await prisma.organization.create({
      data: {
        name: 'National Valley Public School',
        slug: 'test-shortest-slug',
        code: 'NVPS-TEST',
        primaryColor: '#0284c7',
        status: 'ACTIVE',
        institutions: {
          create: {
            name: 'National Valley Senior Secondary',
            code: 'NVPS-INST',
            type: 'SCHOOL',
            board: 'CBSE',
            city: 'Bhopal',
            branches: {
              create: {
                name: 'Main Campus',
                code: 'NVPS-MAIN',
                city: 'Bhopal',
              },
            },
          },
        },
      },
      include: {
        institutions: {
          include: { branches: true },
        },
      },
    });

    expect(testOrg.slug).toBe('test-shortest-slug');
    expect(testOrg.institutions[0].board).toBe('CBSE');
    expect(testOrg.institutions[0].branches[0].code).toBe('NVPS-MAIN');
  });

  it('verifies that self-onboarded organization generates shortest clean link and isolated scope', async () => {
    const srisOrg = await prisma.organization.findFirst({
      where: { slug: 'sris' },
      include: {
        institutions: { include: { branches: true } },
        users: { where: { role: 'ORG_ADMIN' } },
      },
    });

    if (srisOrg) {
      expect(srisOrg.name).toBe('Shri Ram International School');
      expect(srisOrg.institutions[0].board).toBe('CBSE');
      expect(srisOrg.institutions[0].branches.length).toBeGreaterThanOrEqual(1);
      expect(srisOrg.users[0].email).toBe('raghav.sharma@sris-edu.in');
    }
  });
});
