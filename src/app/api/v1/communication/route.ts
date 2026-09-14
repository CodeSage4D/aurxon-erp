import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Notice content is required'),
  targetAudience: z.enum(['ALL', 'TEACHERS', 'PARENTS', 'STUDENTS']).default('ALL'),
  priority: z.enum(['NORMAL', 'URGENT']).default('NORMAL'),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error('[COMMUNICATION_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'announcement.create')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    let instId = user.institutionId;
    if (!instId) {
      const inst = await prisma.institution.findFirst({ where: { organizationId: user.organizationId } });
      instId = inst?.id;
    }

    const announcement = await prisma.announcement.create({
      data: {
        organizationId: user.organizationId,
        institutionId: instId || '',
        title: d.title,
        content: d.content,
        targetAudience: d.targetAudience,
        priority: d.priority,
        authorId: user.id,
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: instId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'ANNOUNCEMENT',
      action: 'PUBLISH',
      recordId: announcement.id,
      details: { title: announcement.title, targetAudience: announcement.targetAudience, priority: announcement.priority },
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    console.error('[COMMUNICATION_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to broadcast announcement' }, { status: 500 });
  }
}
