import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const timetableSlotSchema = z.object({
  academicSessionId: z.string().optional(),
  dayOfWeek: z.number().min(1).max(6), // 1=Mon, 6=Sat
  periodNumber: z.number().min(1).max(10),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  sectionId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get('sectionId');
  const batchId = searchParams.get('batchId');
  const teacherId = searchParams.get('teacherId');

  const whereClause: any = {
    organizationId: user.organizationId,
  };

  if (sectionId) whereClause.sectionId = sectionId;
  if (batchId) whereClause.batchId = batchId;
  if (teacherId) whereClause.teacherId = teacherId;

  try {
    const slots = await prisma.timetableSlot.findMany({
      where: whereClause,
      include: {
        subject: true,
        teacher: true,
        section: { include: { classLevel: true } },
        batch: { include: { course: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });

    return NextResponse.json({ success: true, slots });
  } catch (error) {
    console.error('[TIMETABLE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch timetable slots' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'academic.manage')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = timetableSlotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    // Resolve academic session
    let sessionId = d.academicSessionId;
    if (!sessionId) {
      const currentSession = await prisma.academicSession.findFirst({
        where: { organizationId: user.organizationId, isCurrent: true },
      });
      sessionId = currentSession?.id;
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Academic session not found' }, { status: 400 });
    }

    // ------------------------------------------------------------------------
    // CONFLICT DETECTION ENGINE (Section 13)
    // ------------------------------------------------------------------------

    // 1. Check Teacher Conflict: Is the teacher already scheduled in another class at this day and period?
    const teacherConflict = await prisma.timetableSlot.findFirst({
      where: {
        organizationId: user.organizationId,
        teacherId: d.teacherId,
        dayOfWeek: d.dayOfWeek,
        periodNumber: d.periodNumber,
      },
      include: {
        teacher: true,
        subject: true,
        section: { include: { classLevel: true } },
        batch: true,
      },
    });

    if (teacherConflict) {
      const assignedTo = teacherConflict.section
        ? `${teacherConflict.section.classLevel?.name} - ${teacherConflict.section.name}`
        : teacherConflict.batch?.name;
      return NextResponse.json(
        {
          success: false,
          error: `Teacher Conflict: ${teacherConflict.teacher.firstName} ${teacherConflict.teacher.lastName} is already scheduled for ${teacherConflict.subject.name} in ${assignedTo} during Period ${d.periodNumber}.`,
          conflictType: 'TEACHER_DOUBLE_BOOKING',
        },
        { status: 409 }
      );
    }

    // 2. Check Room Conflict: Is the room already occupied at this day and period?
    if (d.roomNumber) {
      const roomConflict = await prisma.timetableSlot.findFirst({
        where: {
          organizationId: user.organizationId,
          roomNumber: d.roomNumber,
          dayOfWeek: d.dayOfWeek,
          periodNumber: d.periodNumber,
        },
        include: {
          subject: true,
          section: { include: { classLevel: true } },
          batch: true,
        },
      });

      if (roomConflict) {
        const assignedTo = roomConflict.section
          ? `${roomConflict.section.classLevel?.name} - ${roomConflict.section.name}`
          : roomConflict.batch?.name;
        return NextResponse.json(
          {
            success: false,
            error: `Room Conflict: ${d.roomNumber} is already occupied by ${assignedTo} for ${roomConflict.subject.name} during Period ${d.periodNumber}.`,
            conflictType: 'ROOM_DOUBLE_BOOKING',
          },
          { status: 409 }
        );
      }
    }

    // 3. Check Class/Section Conflict: Does this section already have a lecture at this period?
    if (d.sectionId) {
      const sectionConflict = await prisma.timetableSlot.findFirst({
        where: {
          sectionId: d.sectionId,
          dayOfWeek: d.dayOfWeek,
          periodNumber: d.periodNumber,
        },
        include: { subject: true },
      });

      if (sectionConflict) {
        return NextResponse.json(
          {
            success: false,
            error: `Class Conflict: This section already has ${sectionConflict.subject.name} scheduled in Period ${d.periodNumber}.`,
            conflictType: 'CLASS_DOUBLE_BOOKING',
          },
          { status: 409 }
        );
      }
    }

    // If all conflict checks pass, persist slot
    let instId = user.institutionId;
    if (!instId) {
      const inst = await prisma.institution.findFirst({ where: { organizationId: user.organizationId } });
      instId = inst?.id;
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        organizationId: user.organizationId,
        institutionId: instId || '',
        academicSessionId: sessionId,
        dayOfWeek: d.dayOfWeek,
        periodNumber: d.periodNumber,
        startTime: d.startTime,
        endTime: d.endTime,
        subjectId: d.subjectId,
        teacherId: d.teacherId,
        sectionId: d.sectionId || null,
        batchId: d.batchId || null,
        roomNumber: d.roomNumber || null,
      },
    });

    await logAudit({
      organizationId: user.organizationId,
      institutionId: instId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'TIMETABLE',
      action: 'CREATE',
      recordId: slot.id,
      details: { day: d.dayOfWeek, period: d.periodNumber, subjectId: d.subjectId },
    });

    return NextResponse.json({ success: true, slot }, { status: 201 });
  } catch (error) {
    console.error('[TIMETABLE_CREATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to create timetable slot' }, { status: 500 });
  }
}
