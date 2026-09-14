import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  branchId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  contactPhone: z.string().min(5, 'Valid phone required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  category: z.string().default('GENERAL'),
  bloodGroup: z.string().optional(),
  parentName: z.string().min(1, 'Parent/Guardian name is required'),
  parentPhone: z.string().min(5, 'Parent contact is required'),
  parentRelation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']).default('FATHER'),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'ACTIVE';
  const classLevelId = searchParams.get('classLevelId');
  const sectionId = searchParams.get('sectionId');
  const batchId = searchParams.get('batchId');

  const whereClause: any = {
    organizationId: user.organizationId,
  };

  if (user.institutionId) {
    whereClause.institutionId = user.institutionId;
  }

  if (status !== 'ALL') {
    whereClause.status = status;
  }

  if (sectionId) whereClause.sectionId = sectionId;
  if (batchId) whereClause.batchId = batchId;
  if (classLevelId) {
    whereClause.section = { classLevelId };
  }

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { admissionNumber: { contains: search } },
    ];
  }

  const branchParam = searchParams.get('branchId') || (user.role === 'PRINCIPAL' && user.branchId ? user.branchId : undefined);
  if (branchParam) {
    whereClause.branchId = branchParam;
  }

  try {
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        section: { include: { classLevel: true } },
        batch: { include: { course: true } },
        studentParents: { include: { parent: true } },
        feeAllocations: { select: { netAmount: true, paidAmount: true, balanceAmount: true, status: true } },
      },
      orderBy: { admissionNumber: 'asc' },
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('[STUDENTS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, 'student.create')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to create student' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    // Resolve current academic session
    let session = await prisma.academicSession.findFirst({
      where: { organizationId: user.organizationId, isCurrent: true },
    });

    if (!session) {
      session = await prisma.academicSession.findFirst({
        where: { organizationId: user.organizationId },
      });
    }

    if (!session) {
      return NextResponse.json({ success: false, error: 'No academic session found for institution' }, { status: 400 });
    }

    // Generate next admission number
    const count = await prisma.student.count({ where: { organizationId: user.organizationId } });
    const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
    const admissionNumber = `${org?.code || 'ADM'}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Transactional creation of student + parent
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create student
      const student = await tx.student.create({
        data: {
          organizationId: user.organizationId,
          institutionId: user.institutionId || session.institutionId,
          branchId: d.branchId || user.branchId || null,
          academicSessionId: session.id,
          admissionNumber,
          rollNumber: String(count + 1),
          firstName: d.firstName,
          lastName: d.lastName,
          dob: new Date(d.dob),
          gender: d.gender,
          contactPhone: d.contactPhone,
          email: d.email || null,
          address: d.address || null,
          category: d.category,
          bloodGroup: d.bloodGroup || null,
          sectionId: d.sectionId || null,
          batchId: d.batchId || null,
          status: 'ACTIVE',
        },
      });

      // 2. Create parent profile
      const parent = await tx.parentGuardian.create({
        data: {
          organizationId: user.organizationId,
          firstName: d.parentName,
          lastName: '',
          relation: d.parentRelation,
          phone: d.parentPhone,
        },
      });

      // 3. Link student and parent
      await tx.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          isPrimaryContact: true,
          isEmergencyContact: true,
        },
      });

      return student;
    });

    // Immutable Audit Log
    await logAudit({
      organizationId: user.organizationId,
      institutionId: user.institutionId,
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      resource: 'STUDENT',
      action: 'CREATE',
      recordId: result.id,
      details: { admissionNumber: result.admissionNumber, name: `${result.firstName} ${result.lastName}` },
    });

    return NextResponse.json({ success: true, student: result }, { status: 201 });
  } catch (error) {
    console.error('[STUDENT_CREATE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to create student record' }, { status: 500 });
  }
}
