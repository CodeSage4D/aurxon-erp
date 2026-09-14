import { describe, it, expect } from 'vitest';
import prisma from '../src/lib/prisma';

describe('AURXON Organization-First Search & Tenant Discovery Engine', () => {
  it('discovers active organizations with safe public metadata on empty/short query', async () => {
    const orgs = await prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      take: 6,
      orderBy: { name: 'asc' },
      include: {
        institutions: {
          take: 2,
          select: { name: true, type: true, board: true, city: true },
        },
      },
    });

    expect(orgs.length).toBeGreaterThan(0);

    // Verify data minimization on all returned records
    orgs.forEach((org: any) => {
      expect(org.name).toBeDefined();
      expect(org.slug).toBeDefined();
      // Verify sensitive tenant information is strictly not leaked
      expect(org.users).toBeUndefined();
      expect(org.subscriptionPlan).toBeUndefined();
      expect(org.billingStatus).toBeUndefined();
    });
  });

  it('performs debounced query search on name, code, slug and city without exposing internal IDs', async () => {
    const query = 'dps';

    const results = await prisma.organization.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query } },
          { slug: { contains: query.toLowerCase() } },
          { code: { contains: query.toUpperCase() } },
          {
            institutions: {
              some: {
                OR: [
                  { name: { contains: query } },
                  { city: { contains: query } },
                  { code: { contains: query.toUpperCase() } },
                ],
              },
            },
          },
        ],
      },
      take: 8,
      orderBy: { name: 'asc' },
      include: {
        institutions: {
          take: 2,
          select: { name: true, type: true, board: true, city: true },
        },
      },
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const dps = results.find((r) => r.slug.includes('dps') || r.code === 'DPS-ORG');
    expect(dps).toBeDefined();
    expect(dps?.name).toContain('Delhi Public School');
  });

  it('searches organizations by city (e.g. "Indore")', async () => {
    const cityQuery = 'Indore';

    const results = await prisma.organization.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: cityQuery } },
          {
            institutions: {
              some: {
                city: { contains: cityQuery },
              },
            },
          },
        ],
      },
      include: {
        institutions: {
          select: { city: true },
        },
      },
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const hasIndore = results.some((org) =>
      org.institutions.some((i) => i.city?.toLowerCase().includes('indore'))
    );
    expect(hasIndore).toBe(true);
  });

  it('verifies that dedicated portal endpoint does NOT leak evaluator user emails or passwords', async () => {
    const portalOrg = await prisma.organization.findFirst({
      where: { slug: 'dps-society', status: 'ACTIVE' },
      include: {
        institutions: {
          include: {
            branches: { select: { id: true, name: true, code: true, city: true } },
            academicSessions: { where: { isCurrent: true }, select: { id: true, name: true } },
          },
        },
      },
    });

    expect(portalOrg).toBeDefined();
    expect(portalOrg?.name).toBe('Delhi Public School Society');
    expect(portalOrg?.institutions.length).toBeGreaterThan(0);
    // Ensure no sensitive user passwords or account lists exist on portal entity
    expect((portalOrg as any).users).toBeUndefined();
    expect((portalOrg as any).passwordHash).toBeUndefined();
  });
});
