import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const markAttendanceSchema = z.object({
  sectionId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  date: z.string().min(10), // YYYY-MM-DD
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE']),
      remarks: z.string().optional(),
    })
  ),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get('sectionId');
  const batchId = searchParams.get('batchId');
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Target date at 00:00:00 UTC
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  try {
    // 1. Fetch all active students in this section or batch
    const students = await prisma.student.findMany({
      where: {
        organizationId: user.organizationId,
        status: 'ACTIVE',
        ...(sectionId ? { sectionId } : {}),
        ...(batchId ? { batchId } : {}),
      },
      orderBy: { rollNumber: 'asc' },
    });

    // 2. Fetch existing attendance records for this date
    const existingRecords = await prisma.attendanceRecord.findMany({
      where: {
        organizationId: user.organizationId,
        date: targetDate,
        ...(sectionId ? { sectionId } : {}),
        ...(batchId ? { batchId } : {}),
      },
    });

    const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));

    // Combine roster with marked status
    const attendanceList = students.map((st) => {
      const rec = recordMap.get(st.id);
      return {
        studentId: st.id,
        rollNumber: st.rollNumber,
        firstName: st.firstName,
        lastName: st.lastName,
        admissionNumber: st.admissionNumber,
        status: rec ? rec.status : 'PRESENT', // Default to PRESENT if unmarked
        remarks: rec?.remarks || '',
        isSaved: !!rec,
      };
    });

    return NextResponse.json({
      success: true,
      date: dateStr,
      attendanceList,
      totalCount: students.length,
      isMarked: existingRecords.length > 0,
    });
  } catch (error) {
    console.error('[ATTENDANCE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch attendance roster' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'attendance.mark')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to mark attendance' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = markAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { sectionId, batchId, date, records } = parsed.data;
    const targetDate = new Date(`${date}T00:00:00.000Z`);

    // Resolve academic session
    let session = await prisma.academicSession.findFirst({
      where: { organizationId: user.organizationId, isCurrent: true },
    });

    if (!session) {
      session = await prisma.academicSession.findFirst({
        where: { organizationId: user.organizationId },
      });
    }

    if (!session) {
      return NextResponse.json({ success: false, error: 'Active academic session not found' }, { status: 400 });
    }

    let instId = user.institutionId || session.institutionId;

    // Transactional Upsert
    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        await tx.attendanceRecord.upsert({
          where: {
            studentId_date: {
              studentId: rec.studentId,
              date: targetDate,
            },
          },
          update: {
            status: rec.status,
            remarks: rec.remarks || null,
            markedById: user.id,
            sectionId: sectionId || null,
            batchId: batchId || null,
          },
          create: {
            organizationId: user.organizationId,
            institutionId: instId,
            academicSessionId: session.id,
            studentId: rec.studentId,
            sectionId: sectionId || null,
            batchId: batchId || null,
            date: targetDate,
            status: rec.status,
            remarks: rec.remarks || null,
            markedById: user.id,
          },
        });
      }
    });

    // Immutable Audit Log
    await logAudit({
      organizationId: user.organizationId,
      institutionId: instId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'ATTENDANCE',
      action: 'MARK_DAILY',
      details: {
        date,
        sectionId,
        batchId,
        totalMarked: records.length,
        presentCount: records.filter((r) => r.status === 'PRESENT').length,
        absentCount: records.filter((r) => r.status === 'ABSENT').length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully saved attendance for ${records.length} students.`,
    });
  } catch (error) {
    console.error('[ATTENDANCE_SAVE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to record attendance' }, { status: 500 });
  }
}
