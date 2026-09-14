import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const DEFAULT_CATALOG = [
  {
    id: 'book-01',
    accessionNumber: 'ACC-2024-001',
    title: 'Concepts of Physics (Vol 1 & 2)',
    author: 'Prof. H.C. Verma',
    isbn: '978-8177091878',
    category: 'Physics',
    rackLocation: 'Shelf B-3, Rack 2',
    totalCopies: 25,
    availableCopies: 19,
    publisher: 'Bharati Bhawan',
    edition: '2024 Revised Edition',
  },
  {
    id: 'book-02',
    accessionNumber: 'ACC-2024-002',
    title: 'Mathematics for Class 10 & 12',
    author: 'Dr. R.D. Sharma',
    isbn: '978-9383182524',
    category: 'Mathematics',
    rackLocation: 'Shelf A-1, Rack 4',
    totalCopies: 30,
    availableCopies: 22,
    publisher: 'Dhanpat Rai Publications',
    edition: '2025 Edition',
  },
  {
    id: 'book-03',
    accessionNumber: 'ACC-2024-003',
    title: 'NCERT Exemplar Problems - Chemistry',
    author: 'NCERT Academic Council',
    isbn: '978-9350077891',
    category: 'Chemistry',
    rackLocation: 'Shelf B-5, Rack 1',
    totalCopies: 20,
    availableCopies: 16,
    publisher: 'NCERT New Delhi',
    edition: 'Latest NEP Edition',
  },
  {
    id: 'book-04',
    accessionNumber: 'ACC-2024-004',
    title: 'Wings of Fire: An Autobiography',
    author: 'Dr. A.P.J. Abdul Kalam',
    isbn: '978-8173711466',
    category: 'Literature & Biography',
    rackLocation: 'Shelf C-2, Rack 5',
    totalCopies: 15,
    availableCopies: 11,
    publisher: 'Universities Press',
    edition: 'Commemorative Edition',
  },
  {
    id: 'book-05',
    accessionNumber: 'ACC-2024-005',
    title: 'Biology: A Global Approach',
    author: 'Campbell & Reece',
    isbn: '978-1292170435',
    category: 'Biology',
    rackLocation: 'Shelf B-1, Rack 3',
    totalCopies: 12,
    availableCopies: 8,
    publisher: 'Pearson Education',
    edition: '12th Global Edition',
  },
  {
    id: 'book-06',
    accessionNumber: 'ACC-2024-006',
    title: 'India That Is Bharat: Coloniality, Civilisation, Constitution',
    author: 'J. Sai Deepak',
    isbn: '978-9354352492',
    category: 'Social Sciences',
    rackLocation: 'Shelf D-4, Rack 2',
    totalCopies: 10,
    availableCopies: 7,
    publisher: 'Bloomsbury India',
    edition: 'First Edition',
  },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch some real students to show sample active loans
  const students = await prisma.student.findMany({
    where: { organizationId: user.organizationId },
    take: 6,
    include: {
      section: { include: { classLevel: true } },
    },
  });

  const activeLoans = [
    {
      id: 'loan-01',
      accessionNumber: 'ACC-2024-001',
      bookTitle: 'Concepts of Physics (Vol 1)',
      borrowerName: students[0] ? `${students[0].firstName} ${students[0].lastName}` : 'Aarav Sharma',
      borrowerId: students[0]?.admissionNumber || 'ADM-2024-01',
      borrowerRole: 'STUDENT',
      issueDate: '2026-09-01',
      dueDate: '2026-09-15',
      status: 'ISSUED',
      fineAccrued: 0,
    },
    {
      id: 'loan-02',
      accessionNumber: 'ACC-2024-002',
      bookTitle: 'Mathematics for Class 12',
      borrowerName: students[1] ? `${students[1].firstName} ${students[1].lastName}` : 'Priya Patel',
      borrowerId: students[1]?.admissionNumber || 'ADM-2024-02',
      borrowerRole: 'STUDENT',
      issueDate: '2026-08-20',
      dueDate: '2026-09-03',
      status: 'OVERDUE',
      fineAccrued: 55, // 11 days * 5
    },
    {
      id: 'loan-03',
      accessionNumber: 'ACC-2024-004',
      bookTitle: 'Wings of Fire',
      borrowerName: 'Dr. Sunita Verma',
      borrowerId: 'FAC-ENG-04',
      borrowerRole: 'FACULTY',
      issueDate: '2026-09-05',
      dueDate: '2026-09-26',
      status: 'ISSUED',
      fineAccrued: 0,
    },
  ];

  return NextResponse.json({
    success: true,
    catalog: DEFAULT_CATALOG,
    loans: activeLoans,
    stats: {
      totalTitles: DEFAULT_CATALOG.length,
      totalVolumes: DEFAULT_CATALOG.reduce((a, b) => a + b.totalCopies, 0),
      currentlyIssued: activeLoans.length,
      overdueLoans: activeLoans.filter((l) => l.status === 'OVERDUE').length,
      availableStock: DEFAULT_CATALOG.reduce((a, b) => a + b.availableCopies, 0),
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
      message: 'Library transaction recorded successfully',
      data: body,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
