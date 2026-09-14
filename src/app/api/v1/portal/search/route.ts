import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FALLBACK_ORGANIZATIONS } from '@/lib/auth-fallbacks';

export const dynamic = 'force-dynamic';

export interface SafeOrganizationResult {
  name: string;
  slug: string;
  code: string;
  city: string;
  organizationType: string;
  board: string;
  logoUrl: string | null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();

  try {
    // If query is empty, return curated set of top registered active organizations for quick suggestion
    if (!query) {
      const topOrgs = await prisma.organization.findMany({
        where: { status: 'ACTIVE' },
        take: 6,
        orderBy: { name: 'asc' },
        include: {
          institutions: {
            take: 2,
            select: {
              name: true,
              type: true,
              board: true,
              city: true,
            },
          },
        },
      });

      if (topOrgs.length > 0) {
        const sanitized: SafeOrganizationResult[] = topOrgs.map((org) => {
          const primaryInst = org.institutions[0];
          const instTypes = Array.from(new Set(org.institutions.map((i) => i.type))).join(' + ');

          return {
            name: org.name,
            slug: org.slug,
            code: org.code,
            city: primaryInst?.city ? `${primaryInst.city}` : 'India',
            organizationType: instTypes || 'School',
            board: primaryInst?.board || 'CBSE Affiliated',
            logoUrl: org.logoUrl || null,
          };
        });

        return NextResponse.json({
          success: true,
          count: sanitized.length,
          results: sanitized,
        });
      }
    } else {
      // Meaningful query (>= 1 character): live auto-predict search directly connected with database
      const orgs = await prisma.organization.findMany({
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
            take: 3,
            select: {
              name: true,
              type: true,
              board: true,
              city: true,
            },
          },
        },
      });

      if (orgs.length > 0) {
        const sanitized: SafeOrganizationResult[] = orgs.map((org) => {
          const primaryInst = org.institutions[0];
          const instTypes = Array.from(new Set(org.institutions.map((i) => i.type))).join(' + ');

          return {
            name: org.name,
            slug: org.slug,
            code: org.code,
            city: primaryInst?.city ? `${primaryInst.city}` : 'India',
            organizationType: instTypes || 'School',
            board: primaryInst?.board || 'CBSE Affiliated',
            logoUrl: org.logoUrl || null,
          };
        });

        return NextResponse.json({
          success: true,
          count: sanitized.length,
          results: sanitized,
        });
      }
    }
  } catch (dbErr) {
    console.warn('[PORTAL_SEARCH_DB_WARN] Database query failed, using resilient fallback organizations:', dbErr);
  }

  // Resilient fallback for serverless deployments (Netlify, Vercel, Cloudflare, etc.)
  const cleanQ = query.toLowerCase();
  const filtered = cleanQ
    ? FALLBACK_ORGANIZATIONS.filter(
        (o) =>
          o.name.toLowerCase().includes(cleanQ) ||
          o.slug.toLowerCase().includes(cleanQ) ||
          o.code.toLowerCase().includes(cleanQ) ||
          o.city.toLowerCase().includes(cleanQ)
      )
    : FALLBACK_ORGANIZATIONS;

  return NextResponse.json({
    success: true,
    count: filtered.length,
    results: filtered,
  });
}
