import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const enrollInstituteSchema = z.object({
  name: z.string().min(2, 'Institute name is required'),
  customSlug: z.string().optional(),
  type: z.enum(['SCHOOL', 'COACHING', 'HYBRID']).default('SCHOOL'),
  board: z.enum(['CBSE', 'ICSE', 'STATE', 'NEET_JEE', 'CAMBRIDGE']).default('CBSE'),
  city: z.string().default('Indore'),
  branches: z.array(z.string()).default(['Main Campus']),
  adminName: z.string().min(2, 'Administrator name is required'),
  adminEmail: z.string().email('Valid administrator email is required'),
  adminPassword: z.string().default('Password@123'),
  primaryColor: z.string().default('#0284c7'),
  modules: z.array(z.string()).default(['LMS', 'PAYROLL', 'LIBRARY', 'INVENTORY']),
});

// Helper to generate the shortest, clean URL slug from name
function generateShortSlug(name: string): string {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/);

  // If acronym is available and > 2 words (e.g. "Delhi Public School" -> "dps")
  if (words.length >= 3) {
    const acronym = words.map((w) => w[0]).join('');
    if (acronym.length >= 3) {
      return acronym;
    }
  }

  // Otherwise, hyphenated clean slug
  return words.slice(0, 3).join('-');
}

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden: Requires AURXON Super Admin' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = enrollInstituteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    // 1. Determine slug (use customSlug if specified and clean, else auto shortest slug)
    let slug = d.customSlug
      ? d.customSlug
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .replace(/^-+|-+$/g, '')
      : generateShortSlug(d.name);

    if (!slug) slug = `inst-${Date.now().toString().slice(-4)}`;

    // Check if slug is already taken; if so, append unique suffix
    const existingSlug = await prisma.organization.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 899 + 100)}`;
    }

    // Short uppercase code
    const code = slug.toUpperCase().replace(/-/g, '').slice(0, 8);

    const [adminFirstName, ...rest] = d.adminName.split(' ');
    const adminLastName = rest.join(' ') || 'Admin';
    const passwordHash = await hashPassword(d.adminPassword || 'Password@123');

    // 2. Transactional deployment of entire setup ERP
    const result = await prisma.$transaction(async (tx) => {
      // Create Organization
      const org = await tx.organization.create({
        data: {
          name: d.name,
          slug,
          code,
          primaryColor: d.primaryColor,
          status: 'ACTIVE',
        },
      });

      // Create Institution
      const inst = await tx.institution.create({
        data: {
          organizationId: org.id,
          name: d.name,
          code: `${code}-INST`,
          type: d.type,
          board: d.board,
          city: d.city,
          state: 'Madhya Pradesh',
        },
      });

      // Create Branches / Campuses
      const branchList = d.branches.length > 0 ? d.branches : ['Main Campus'];
      const createdBranches = [];
      for (let idx = 0; idx < branchList.length; idx++) {
        const branchName = branchList[idx];
        const br = await tx.branch.create({
          data: {
            institutionId: inst.id,
            name: branchName,
            code: `${code}-BR${idx + 1}`,
            city: d.city,
          },
        });
        createdBranches.push(br);
      }

      // Create Current Academic Session (2026-2027)
      const session = await tx.academicSession.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          name: '2026-2027',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isCurrent: true,
        },
      });

      // Create Initial Classes & Sections
      const class9 = await tx.classLevel.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          name: 'Class 9',
          code: 'CLS-9',
          displayOrder: 9,
        },
      });

      await tx.section.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          classLevelId: class9.id,
          name: 'Section A',
        },
      });

      const class10 = await tx.classLevel.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          name: 'Class 10',
          code: 'CLS-10',
          displayOrder: 10,
        },
      });

      await tx.section.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          classLevelId: class10.id,
          name: 'Section A',
        },
      });

      // Create Org Admin User
      const adminUser = await tx.user.create({
        data: {
          organizationId: org.id,
          institutionId: inst.id,
          branchId: createdBranches[0]?.id || null,
          email: d.adminEmail.toLowerCase(),
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
        },
      });

      // Module Entitlements
      for (const mod of d.modules) {
        await tx.moduleEntitlement.create({
          data: {
            organizationId: org.id,
            moduleName: mod,
            isEnabled: true,
          },
        });
      }

      return { org, inst, branches: createdBranches, session, adminUser };
    });

    // Immutable Audit Log
    await logAudit({
      organizationId: result.org.id,
      institutionId: result.inst.id,
      actorId: sessionUser.id,
      actorName: `${sessionUser.firstName} ${sessionUser.lastName}`,
      actorRole: sessionUser.role,
      resource: 'ORGANIZATION',
      action: 'ENROLL_SAAS',
      details: {
        name: d.name,
        slug,
        type: d.type,
        board: d.board,
        adminEmail: d.adminEmail,
        branchesCount: result.branches.length,
      },
    });

    const portalUrl = `/s/${slug}`;

    return NextResponse.json({
      success: true,
      message: `Successfully enrolled ${d.name}! Dedicated ERP portal generated.`,
      portalUrl,
      slug,
      shortLink: `aurxon.io/s/${slug}`,
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        code: result.org.code,
      },
      admin: {
        email: result.adminUser.email,
        temporaryPassword: d.adminPassword || 'Password@123',
      },
    });
  } catch (err: any) {
    console.error('[ENROLL_INSTITUTE_ERROR]', err);
    return NextResponse.json({ success: false, error: 'Failed to enroll institute: ' + err.message }, { status: 500 });
  }
}
