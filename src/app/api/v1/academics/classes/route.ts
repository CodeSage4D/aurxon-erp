import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [classLevels, sections, courses, batches, branches] = await Promise.all([
    prisma.classLevel.findMany({
      where: { organizationId: user.organizationId },
      include: { sections: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.section.findMany({
      where: { organizationId: user.organizationId },
      include: { classLevel: true },
    }),
    prisma.course.findMany({
      where: { organizationId: user.organizationId },
      include: { batches: true },
    }),
    prisma.batch.findMany({
      where: { organizationId: user.organizationId },
      include: { course: true },
    }),
    prisma.branch.findMany({
      where: { institution: { organizationId: user.organizationId } },
      select: { id: true, name: true, code: true, city: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    classLevels,
    sections,
    courses,
    batches,
    branches,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, sectionName = 'Section A', roomNumber } = body;

    let instId = user.institutionId;
    if (!instId) {
      const inst = await prisma.institution.findFirst({ where: { organizationId: user.organizationId } });
      instId = inst?.id;
    }

    if (!instId) {
      return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 400 });
    }

    const classLevel = await prisma.classLevel.create({
      data: {
        organizationId: user.organizationId,
        institutionId: instId,
        name,
        code: name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
        sections: {
          create: {
            organizationId: user.organizationId,
            institutionId: instId,
            name: sectionName,
            roomNumber,
          },
        },
      },
      include: { sections: true },
    });

    return NextResponse.json({ success: true, classLevel }, { status: 201 });
  } catch (error) {
    console.error('[CLASS_CREATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to create class' }, { status: 500 });
  }
}
