import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FALLBACK_ORGANIZATIONS } from '@/lib/auth-fallbacks';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ success: false, error: 'School identifier missing' }, { status: 400 });
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    // 1. Resolve organization by slug or code (exact match first, then prefix/contains)
    let org = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: cleanSlug },
          { code: cleanSlug.toUpperCase() },
        ],
        status: 'ACTIVE',
      },
      include: {
        institutions: {
          include: {
            branches: {
              select: { id: true, name: true, code: true, city: true },
            },
            academicSessions: {
              where: { isCurrent: true },
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!org) {
      // Try prefix match (e.g. 'dps' matching 'dps-society')
      org = await prisma.organization.findFirst({
        where: {
          OR: [
            { slug: { startsWith: cleanSlug } },
            { code: { startsWith: cleanSlug.toUpperCase() } },
            { slug: { contains: cleanSlug } },
          ],
          status: 'ACTIVE',
        },
        include: {
          institutions: {
            include: {
              branches: {
                select: { id: true, name: true, code: true, city: true },
              },
              academicSessions: {
                where: { isCurrent: true },
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    }

    if (org) {
      return NextResponse.json({
        success: true,
        portal: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          code: org.code,
          logoUrl: org.logoUrl,
          primaryColor: org.primaryColor || '#0284c7',
          institutions: org.institutions.map((i) => ({
            id: i.id,
            name: i.name,
            type: i.type,
            board: i.board || 'CBSE',
            city: i.city,
            branches: i.branches,
            currentSession: i.academicSessions[0]?.name || '2025-2026',
          })),
        },
      });
    }
  } catch (err: any) {
    console.warn('[PORTAL_GET_DB_WARN] Database query failed, checking fallback registry:', err?.message || err);
  }

  // Resilient fallback for serverless deployments (Netlify, Vercel, etc.)
  const fallbackOrg = FALLBACK_ORGANIZATIONS.find(
    (o) =>
      o.slug === cleanSlug ||
      o.code.toLowerCase() === cleanSlug ||
      o.slug.startsWith(cleanSlug) ||
      cleanSlug.startsWith(o.slug.split('-')[0])
  );

  if (fallbackOrg) {
    return NextResponse.json({
      success: true,
      portal: {
        id: `org-${fallbackOrg.slug}`,
        name: fallbackOrg.name,
        slug: fallbackOrg.slug,
        code: fallbackOrg.code,
        logoUrl: fallbackOrg.logoUrl,
        primaryColor: '#0284c7',
        institutions: [
          {
            id: `inst-${fallbackOrg.slug}`,
            name: fallbackOrg.name,
            type: fallbackOrg.organizationType,
            board: fallbackOrg.board,
            city: fallbackOrg.city,
            branches: [{ id: 'branch-main', name: 'Main Campus', code: 'MAIN', city: fallbackOrg.city }],
            currentSession: '2025-2026',
          },
        ],
      },
    });
  }

  return NextResponse.json(
    { success: false, error: `Institution workspace for "${slug}" not found.` },
    { status: 404 }
  );
}
