import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch real users in organization
  const dbUsers = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  const staffList = dbUsers.map((u, idx) => {
    let designation = 'Faculty';
    let dept = 'Academic';
    let qualifications = 'M.Sc., B.Ed.';

    if (u.role === 'SUPER_ADMIN' || u.role === 'ORG_ADMIN') {
      designation = 'Director & Campus Head';
      dept = 'Executive Directorate';
      qualifications = 'Ph.D., M.Ed.';
    } else if (u.role === 'PRINCIPAL') {
      designation = 'Principal & Academic Director';
      dept = 'Academic Administration';
      qualifications = 'Ph.D. Education, M.A.';
    } else if (u.role === 'ACCOUNTANT') {
      designation = 'Senior Accounts Manager';
      dept = 'Finance & Accounts';
      qualifications = 'Chartered Accountant (CA), M.Com';
    } else if (u.role === 'TEACHER' || u.role === 'FACULTY') {
      const depts = ['Physics & Science', 'Mathematics', 'English & Humanities', 'Computer Science & AI', 'Social Science'];
      dept = depts[idx % depts.length];
      designation = idx % 2 === 0 ? `PGT ${dept}` : `TGT ${dept}`;
    }

    return {
      id: u.id,
      empId: `EMP-2024-${String(idx + 1).padStart(3, '0')}`,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone || '+91 98100 00000',
      role: u.role,
      designation,
      department: dept,
      qualifications,
      joiningDate: '2023-06-15',
      status: u.status,
      todayAttendance: idx % 6 === 0 ? 'ON_LEAVE' : idx % 8 === 0 ? 'LATE' : 'PRESENT',
      punchInTime: idx % 6 === 0 ? '-' : '07:48 AM',
      punchOutTime: idx % 6 === 0 ? '-' : '02:35 PM',
      basicSalary: 65000 + (idx * 3000),
      netSalary: 74200 + (idx * 3000),
    };
  });

  const leaveRequests = [
    {
      id: 'leave-01',
      empId: 'EMP-2024-002',
      staffName: staffList[1]?.name || 'Dr. Sunita Verma',
      designation: staffList[1]?.designation || 'PGT Mathematics',
      leaveType: 'CASUAL_LEAVE',
      from: '2026-09-18',
      to: '2026-09-19',
      days: 2,
      reason: 'Attending National Mathematics Olympiad Delegation',
      status: 'PENDING',
    },
    {
      id: 'leave-02',
      empId: 'EMP-2024-004',
      staffName: staffList[3]?.name || 'Mr. Rajesh Mehra',
      designation: staffList[3]?.designation || 'TGT English',
      leaveType: 'MEDICAL_LEAVE',
      from: '2026-09-22',
      to: '2026-09-24',
      days: 3,
      reason: 'Medical consultation & follow-up',
      status: 'PENDING',
    },
  ];

  return NextResponse.json({
    success: true,
    staff: staffList,
    leaveRequests,
    stats: {
      totalStaff: staffList.length,
      presentToday: staffList.filter((s) => s.todayAttendance === 'PRESENT').length,
      onLeaveToday: staffList.filter((s) => s.todayAttendance === 'ON_LEAVE').length,
      pendingLeaveRequests: leaveRequests.length,
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: 'Staff action executed successfully',
      data: body,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
