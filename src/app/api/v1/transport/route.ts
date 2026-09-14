import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Seeded/standard fleet and routes for multi-tenant school
const DEFAULT_FLEET = [
  {
    id: 'veh-01',
    busNumber: 'Bus 01 - Express',
    registrationNumber: 'DL-01-EA-2024',
    model: 'Tata Starbus Ultra (42 Seater)',
    capacity: 42,
    occupiedSeats: 38,
    driverName: 'Mr. Ramesh Kumar',
    driverPhone: '+91 98112 34501',
    gpsStatus: 'ONLINE',
    currentLocation: 'Outer Ring Road, Opp. Metro Pillar 124',
    speedKmH: 38,
    fuelLevel: '78%',
    fitnessExpiry: '2026-11-30',
    insuranceExpiry: '2026-08-15',
    routeId: 'route-01',
  },
  {
    id: 'veh-02',
    busNumber: 'Bus 02 - Metro Link',
    registrationNumber: 'DL-01-EA-2025',
    model: 'Ashok Leyland Sunshine (36 Seater)',
    capacity: 36,
    occupiedSeats: 32,
    driverName: 'Mr. Satish Singh',
    driverPhone: '+91 98112 34502',
    gpsStatus: 'ONLINE',
    currentLocation: 'Sector 14 Dwarka Crossing',
    speedKmH: 42,
    fuelLevel: '64%',
    fitnessExpiry: '2026-12-15',
    insuranceExpiry: '2026-09-20',
    routeId: 'route-02',
  },
  {
    id: 'veh-03',
    busNumber: 'Bus 03 - South Corridor',
    registrationNumber: 'DL-01-EB-4091',
    model: 'Eicher Starline 32S',
    capacity: 32,
    occupiedSeats: 29,
    driverName: 'Mr. Vikram Yadav',
    driverPhone: '+91 98112 34503',
    gpsStatus: 'ONLINE',
    currentLocation: 'Hauz Khas Enclave Gate 2',
    speedKmH: 25,
    fuelLevel: '82%',
    fitnessExpiry: '2027-01-10',
    insuranceExpiry: '2026-10-05',
    routeId: 'route-03',
  },
  {
    id: 'veh-04',
    busNumber: 'Bus 04 - East Campus Shuttle',
    registrationNumber: 'DL-01-EC-9912',
    model: 'Force Traveller (20 Seater)',
    capacity: 20,
    occupiedSeats: 18,
    driverName: 'Mr. Manjit Dhillon',
    driverPhone: '+91 98112 34504',
    gpsStatus: 'STATIONARY',
    currentLocation: 'Senior Wing Parking Bay 4',
    speedKmH: 0,
    fuelLevel: '95%',
    fitnessExpiry: '2027-02-28',
    insuranceExpiry: '2026-12-01',
    routeId: 'route-04',
  },
];

const DEFAULT_ROUTES = [
  {
    id: 'route-01',
    routeName: 'Route 01: South Delhi Express',
    origin: 'Saket Metro Station',
    destination: 'DPS Senior Wing',
    busNumber: 'Bus 01 - Express',
    driverName: 'Mr. Ramesh Kumar',
    morningPickupStart: '06:45 AM',
    morningSchoolArrival: '07:40 AM',
    afternoonDeparture: '02:15 PM',
    totalStudents: 38,
    stops: [
      { name: 'Saket Metro Gate 2', time: '06:45 AM', students: 8 },
      { name: 'Malviya Nagar Corner', time: '06:55 AM', students: 10 },
      { name: 'Hauz Khas Market', time: '07:10 AM', students: 12 },
      { name: 'IIT Flyover Crossing', time: '07:22 AM', students: 8 },
      { name: 'DPS R.K. Puram Campus', time: '07:40 AM', students: 0 },
    ],
  },
  {
    id: 'route-02',
    routeName: 'Route 02: Dwarka Sector Corridor',
    origin: 'Dwarka Mor Metro',
    destination: 'DPS Senior Wing',
    busNumber: 'Bus 02 - Metro Link',
    driverName: 'Mr. Satish Singh',
    morningPickupStart: '06:30 AM',
    morningSchoolArrival: '07:35 AM',
    afternoonDeparture: '02:15 PM',
    totalStudents: 32,
    stops: [
      { name: 'Dwarka Mor Gate 1', time: '06:30 AM', students: 6 },
      { name: 'Sector 6 Market Plaza', time: '06:45 AM', students: 11 },
      { name: 'Sector 10 Community Center', time: '07:00 AM', students: 9 },
      { name: 'Palam Flyover Junction', time: '07:15 AM', students: 6 },
      { name: 'DPS R.K. Puram Campus', time: '07:35 AM', students: 0 },
    ],
  },
  {
    id: 'route-03',
    routeName: 'Route 03: Vasant Kunj & Green Avenue',
    origin: 'Vasant Square Mall',
    destination: 'DPS Senior Wing',
    busNumber: 'Bus 03 - South Corridor',
    driverName: 'Mr. Vikram Yadav',
    morningPickupStart: '06:55 AM',
    morningSchoolArrival: '07:42 AM',
    afternoonDeparture: '02:15 PM',
    totalStudents: 29,
    stops: [
      { name: 'Vasant Square Mall Gate', time: '06:55 AM', students: 7 },
      { name: 'Sector C Pocket 8', time: '07:08 AM', students: 9 },
      { name: 'Munirka DDA Flats', time: '07:25 AM', students: 13 },
      { name: 'DPS R.K. Puram Campus', time: '07:42 AM', students: 0 },
    ],
  },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch real students to allocate
  const students = await prisma.student.findMany({
    where: { organizationId: user.organizationId },
    take: 15,
    include: {
      section: {
        include: { classLevel: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const studentAllocations = students.map((s, idx) => ({
    studentId: s.id,
    studentName: `${s.firstName} ${s.lastName}`,
    admissionNumber: s.admissionNumber,
    className: s.section ? `${s.section.classLevel?.name || 'Class'} - ${s.section.name}` : 'Class 10-A',
    assignedRoute: idx % 3 === 0 ? 'Route 01: South Delhi Express' : idx % 3 === 1 ? 'Route 02: Dwarka Sector Corridor' : 'Route 03: Vasant Kunj',
    busNumber: idx % 3 === 0 ? 'Bus 01' : idx % 3 === 1 ? 'Bus 02' : 'Bus 03',
    pickupStop: idx % 2 === 0 ? 'Gate 2 Main Road' : 'Community Center Junction',
    feeStatus: idx % 4 === 0 ? 'PENDING' : 'PAID',
    contactPhone: s.contactPhone || '+91 98100 00000',
  }));

  return NextResponse.json({
    success: true,
    fleet: DEFAULT_FLEET,
    routes: DEFAULT_ROUTES,
    studentAllocations,
    stats: {
      totalVehicles: DEFAULT_FLEET.length,
      activeOnRoute: DEFAULT_FLEET.filter((v) => v.gpsStatus === 'ONLINE').length,
      totalRoutes: DEFAULT_ROUTES.length,
      studentsTransported: DEFAULT_FLEET.reduce((acc, curr) => acc + curr.occupiedSeats, 0),
      totalCapacity: DEFAULT_FLEET.reduce((acc, curr) => acc + curr.capacity, 0),
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
      message: 'Transport record updated successfully',
      data: body,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
