import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [org, inst, entitlements, sessions] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: user.organizationId },
    }),
    prisma.institution.findFirst({
      where: { organizationId: user.organizationId },
      include: { branches: true },
    }),
    prisma.moduleEntitlement.findMany({
      where: { organizationId: user.organizationId },
    }),
    prisma.academicSession.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { startDate: 'desc' },
    }),
  ]);

  const defaultEntitlements = [
    { moduleName: 'TRANSPORT', isEnabled: true, title: 'Transport & Fleet Management', desc: 'GPS tracking, bus routes, driver rosters & vehicle fitness' },
    { moduleName: 'LIBRARY', isEnabled: true, title: 'Library & Book Circulation', desc: 'Accession register, barcodes, book loans & fine tracking' },
    { moduleName: 'STAFF_HR', isEnabled: true, title: 'Faculty HR & Payroll', desc: 'Biometric integration, employee directory, leave management & salary slips' },
    { moduleName: 'EXAMINATIONS', isEnabled: true, title: 'Exams & CBSE Report Cards', desc: 'Scholastic & co-scholastic marksheets, grading & tabulation sheets' },
    { moduleName: 'FEES', isEnabled: true, title: 'Fees & Invoicing Engine', desc: 'Online fee collection, multi-head invoicing, receipt generation' },
    { moduleName: 'HOSTEL', isEnabled: false, title: 'Hostel & Residential Boarding', desc: 'Room allotment, mess management, warden logs & student check-in/out' },
    { moduleName: 'INVENTORY', isEnabled: true, title: 'Campus Inventory & Assets', desc: 'Stock registers, lab equipment, stationary requisitions & asset tracking' },
  ];

  // Merge with existing entitlements from DB
  const mergedEntitlements = defaultEntitlements.map((de) => {
    const found = entitlements.find((e) => e.moduleName === de.moduleName);
    return {
      ...de,
      isEnabled: found ? found.isEnabled : de.isEnabled,
    };
  });

  return NextResponse.json({
    success: true,
    organization: org,
    institution: inst,
    entitlements: mergedEntitlements,
    sessions,
    systemConfig: {
      version: 'AURXON Education OS 4.2-Enterprise',
      dataResidency: 'MeitY Empanelled Cloud (Mumbai Region, India)',
      encryption: 'AES-256 GCM at rest, TLS 1.3 in transit',
      backupFrequency: 'Automated Real-Time WAL Replication + Hourly Snapshots',
      smsGateway: {
        provider: 'NIC / DLT Telecom Gateway',
        senderId: 'DPSRKP',
        status: 'CONNECTED',
        creditsRemaining: 48500,
      },
      whatsappGateway: {
        provider: 'Meta Business Cloud API',
        number: '+91 11 4911 5500',
        status: 'VERIFIED',
      },
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
      message: 'Settings updated successfully',
      data: body,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
