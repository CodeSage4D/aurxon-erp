import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';

// Validation Schema for Organization Provisioning
const ProvisionSchema = z.object({
  organization: z.object({
    name: z.string().min(3, 'Organization name must be at least 3 characters'),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    code: z.string().min(2).max(10).toUpperCase(),
    primaryColor: z.string().default('#1e40af'),
  }),
  institution: z.object({
    name: z.string().min(3),
    code: z.string().min(2).max(10).toUpperCase(),
    type: z.enum(['SCHOOL', 'COACHING', 'HYBRID']).default('SCHOOL'),
    board: z.string().optional().default('CBSE'),
    affiliationNumber: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2).default('Madhya Pradesh'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
  branches: z.array(z.object({
    name: z.string().min(2),
    code: z.string().min(2).toUpperCase(),
    city: z.string().min(2),
    address: z.string().optional(),
  })).min(1, 'At least one branch or campus is required'),
  modules: z.array(z.string()).default([]),
  academicSession: z.object({
    name: z.string().min(4).default('2025-2026'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  initialAdmin: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email('Valid administrator email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
  }),
});

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden: Requires Platform Super Admin' }, { status: 403 });
  }

  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        institutions: {
          include: {
            branches: true,
            _count: {
              select: {
                students: true,
                classLevels: true,
                courses: true,
              },
            },
          },
        },
        moduleEntitlements: {
          where: { isEnabled: true },
          select: { moduleName: true },
        },
        _count: {
          select: {
            users: true,
            students: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, organizations: orgs });
  } catch (err: any) {
    console.error('Error listing organizations:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden: Requires Platform Super Admin' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = ProvisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.format(),
      }, { status: 400 });
    }

    const { organization, institution, branches, modules, academicSession, initialAdmin } = parsed.data;

    // Check slug and code uniqueness
    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: organization.slug },
          { code: organization.code },
        ],
      },
    });

    if (existingOrg) {
      return NextResponse.json({
        success: false,
        error: `Organization with slug '${organization.slug}' or code '${organization.code}' already exists.`,
      }, { status: 409 });
    }

    // Check admin email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: initialAdmin.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: `User email '${initialAdmin.email}' is already registered.`,
      }, { status: 409 });
    }

    const passwordHash = await hashPassword(initialAdmin.password);

    // Atomic Transaction: Provision Organization, Institution, Branches, Entitlements, Session, Admin User
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: organization.name,
          slug: organization.slug,
          code: organization.code,
          primaryColor: organization.primaryColor,
          status: 'ACTIVE',
        },
      });

      // 2. Create Module Entitlements
      const standardModules = ['TRANSPORT', 'LIBRARY', 'HOSTEL', 'INVENTORY', 'PAYROLL', 'LMS'];
      for (const mod of standardModules) {
        await tx.moduleEntitlement.create({
          data: {
            organizationId: org.id,
            moduleName: mod,
            isEnabled: modules.includes(mod),
          },
        });
      }

      // 3. Create Primary Institution
      const inst = await tx.institution.create({
        data: {
          organizationId: org.id,
          name: institution.name,
          code: institution.code,
          type: institution.type,
          board: institution.board,
          affiliationNumber: institution.affiliationNumber,
          city: institution.city,
          state: institution.state,
          address: institution.address,
          phone: institution.phone,
          email: institution.email,
        },
      });

      // 4. Create Branches / Campuses
      const createdBranches = [];
      for (const b of branches) {
        const branch = await tx.branch.create({
          data: {
            institutionId: inst.id,
            name: b.name,
            code: b.code,
            city: b.city,
            address: b.address,
          },
        });
        createdBranches.push(branch);
      }

      // 5. Create Academic Session
      const sessionStart = academicSession.startDate ? new Date(academicSession.startDate) : new Date('2025-04-01T00:00:00.000Z');
      const sessionEnd = academicSession.endDate ? new Date(academicSession.endDate) : new Date('2026-03-31T23:59:59.000Z');

      const session = await tx.academicSession.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          name: academicSession.name,
          startDate: sessionStart,
          endDate: sessionEnd,
          isCurrent: true,
        },
      });

      // 6. Create Initial Admin User
      const adminUser = await tx.user.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          branchId: createdBranches[0]?.id,
          email: initialAdmin.email.toLowerCase(),
          passwordHash,
          firstName: initialAdmin.firstName,
          lastName: initialAdmin.lastName,
          phone: initialAdmin.phone,
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
        },
      });

      // 7. Initialize standard class levels if school
      if (institution.type === 'SCHOOL' || institution.type === 'HYBRID') {
        const defaultClasses = [
          { name: 'Class 9', code: 'CLS-9', order: 9 },
          { name: 'Class 10', code: 'CLS-10', order: 10 },
          { name: 'Class 11', code: 'CLS-11', order: 11 },
          { name: 'Class 12', code: 'CLS-12', order: 12 },
        ];

        for (const c of defaultClasses) {
          const classLvl = await tx.classLevel.create({
            data: {
              organizationId: org.id,
              institutionId: inst.id,
              name: c.name,
              code: c.code,
              displayOrder: c.order,
            },
          });

          await tx.section.create({
            data: {
              organizationId: org.id,
              institutionId: inst.id,
              classLevelId: classLvl.id,
              name: 'Section A',
            },
          });
        }
      }

      return { org, inst, branches: createdBranches, adminUser, session };
    });

    // Record Immutable Audit Log
    await recordAudit({
      organizationId: result.org.id,
      institutionId: result.inst.id,
      actorId: sessionUser.id,
      actorName: `${sessionUser.firstName} ${sessionUser.lastName}`,
      actorRole: sessionUser.role,
      resource: 'ORGANIZATION',
      action: 'PROVISION',
      details: {
        organizationName: result.org.name,
        code: result.org.code,
        institutionName: result.inst.name,
        branchesCount: result.branches.length,
        adminEmail: result.adminUser.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Organization '${result.org.name}' successfully provisioned.`,
      data: {
        organizationId: result.org.id,
        slug: result.org.slug,
        code: result.org.code,
        institutionId: result.inst.id,
        adminEmail: result.adminUser.email,
        branchesCount: result.branches.length,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error provisioning organization:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
