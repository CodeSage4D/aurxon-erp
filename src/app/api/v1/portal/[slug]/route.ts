import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ success: false, error: 'School identifier missing' }, { status: 400 });
  }

  try {
    const cleanSlug = slug.trim().toLowerCase();

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

    if (!org) {
      return NextResponse.json(
        { success: false, error: `Institution workspace for "${slug}" not found.` },
        { status: 404 }
      );
    }

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
          currentSession: i.academicSessions[0]?.name || '2026-2027',
        })),
      },
    });
  } catch (err: any) {
    console.error('[PORTAL_GET_ERROR]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
