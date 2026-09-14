import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q || q.length < 2) {
    return NextResponse.json({
      success: true,
      results: {
        students: [],
        staff: [],
        academics: [],
        actions: [],
      },
    });
  }

  const { organizationId, institutionId, role } = sessionUser;
  const orgFilter = role === 'SUPER_ADMIN' ? {} : { organizationId };
  const instFilter = institutionId ? { institutionId } : {};

  try {
    const [students, staff, classes, batches] = await Promise.all([
      // 1. Search Students
      prisma.student.findMany({
        where: {
          ...orgFilter,
          ...instFilter,
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { admissionNumber: { contains: q } },
            { rollNumber: { contains: q } },
          ],
        },
        take: 6,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          rollNumber: true,
          section: {
            select: { name: true, classLevel: { select: { name: true } } },
          },
          batch: {
            select: { name: true },
          },
        },
      }),

      // 2. Search Staff / Faculty
      prisma.user.findMany({
        where: {
          ...orgFilter,
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
          ],
        },
        take: 4,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      }),

      // 3. Search Classes
      prisma.classLevel.findMany({
        where: {
          ...orgFilter,
          ...instFilter,
          name: { contains: q },
        },
        take: 3,
        select: { id: true, name: true, code: true },
      }),

      // 4. Search Coaching Batches
      prisma.batch.findMany({
        where: {
          ...orgFilter,
          ...instFilter,
          name: { contains: q },
        },
        take: 3,
        select: { id: true, name: true },
      }),
    ]);

    // Built-in Quick Actions
    const standardActions = [
      { id: 'act-attendance', title: 'Take Today\'s Attendance', href: '/attendance', category: 'ACTION' },
      { id: 'act-collect-fee', title: 'Collect Fee Payment', href: '/fees/collect', category: 'ACTION' },
      { id: 'act-new-student', title: 'New Student Admission', href: '/students?create=true', category: 'ACTION' },
      { id: 'act-report-card', title: 'Examinations & Report Cards', href: '/examinations', category: 'ACTION' },
      { id: 'act-timetable', title: 'Timetable Scheduling Grid', href: '/timetable', category: 'ACTION' },
      { id: 'act-notice', title: 'Publish Institutional Notice', href: '/communication', category: 'ACTION' },
    ].filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));

    return NextResponse.json({
      success: true,
      results: {
        students: students.map((s) => ({
          id: s.id,
          title: `${s.firstName} ${s.lastName}`,
          subtitle: s.section
            ? `${s.section.classLevel?.name} - ${s.section.name} (Roll: ${s.rollNumber || 'N/A'})`
            : s.batch?.name || `Adm: ${s.admissionNumber}`,
          href: `/students?search=${s.admissionNumber}`,
          category: 'STUDENT',
        })),
        staff: staff.map((u) => ({
          id: u.id,
          title: `${u.firstName} ${u.lastName}`,
          subtitle: `${u.role.replace('_', ' ')} • ${u.email}`,
          href: `/academics?staff=${u.id}`,
          category: 'STAFF',
        })),
        academics: [
          ...classes.map((c) => ({
            id: c.id,
            title: c.name,
            subtitle: `Class Level (${c.code})`,
            href: `/academics`,
            category: 'CLASS',
          })),
          ...batches.map((b) => ({
            id: b.id,
            title: b.name,
            subtitle: 'Coaching Batch',
            href: `/academics`,
            category: 'BATCH',
          })),
        ],
        actions: standardActions,
      },
    });
  } catch (err: any) {
    console.error('Error in command palette search:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
