'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Badge from '@/components/ui/Badge';
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Search,
  Plus,
  Compass,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Fuel,
  Users,
  Calendar,
  X,
} from 'lucide-react';

export default function TransportPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'fleet' | 'routes' | 'students' | 'gps'>('fleet');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);

  // New Vehicle form state
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newRegNumber, setNewRegNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('36');
  const [newDriver, setNewDriver] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // New Route form state
  const [newRouteName, setNewRouteName] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newMorningTime, setNewMorningTime] = useState('06:45 AM');

  useEffect(() => {
    async function load() {
      try {
        const [meRes, transportRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/transport'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (transportRes.ok) {
          const tJson = await transportRes.json();
          setData(tJson);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusNumber || !newRegNumber) return;

    const newVeh = {
      id: `veh-${Date.now()}`,
      busNumber: newBusNumber,
      registrationNumber: newRegNumber,
      model: `School Bus (${newCapacity} Seater)`,
      capacity: parseInt(newCapacity, 10),
      occupiedSeats: 0,
      driverName: newDriver || 'Assigned Driver',
      driverPhone: newPhone || '+91 98000 00000',
      gpsStatus: 'ONLINE',
      currentLocation: 'Campus Depot',
      speedKmH: 0,
      fuelLevel: '100%',
      fitnessExpiry: '2027-05-30',
      insuranceExpiry: '2027-05-30',
      routeId: 'route-new',
    };

    setData((prev: any) => ({
      ...prev,
      fleet: [newVeh, ...(prev?.fleet || [])],
      stats: {
        ...prev?.stats,
        totalVehicles: (prev?.stats?.totalVehicles || 0) + 1,
      },
    }));

    setShowAddVehicleModal(false);
    setNewBusNumber('');
    setNewRegNumber('');
    setNewDriver('');
    setNewPhone('');
  };

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName) return;

    const newRt = {
      id: `route-${Date.now()}`,
      routeName: newRouteName,
      origin: newOrigin || 'Central Point',
      destination: newDestination || 'Senior Wing Campus',
      busNumber: 'Bus Allocated',
      driverName: 'Designated Driver',
      morningPickupStart: newMorningTime,
      morningSchoolArrival: '07:45 AM',
      afternoonDeparture: '02:15 PM',
      totalStudents: 0,
      stops: [
        { name: newOrigin || 'Origin Stop', time: newMorningTime, students: 0 },
        { name: newDestination || 'Campus Gate', time: '07:45 AM', students: 0 },
      ],
    };

    setData((prev: any) => ({
      ...prev,
      routes: [newRt, ...(prev?.routes || [])],
      stats: {
        ...prev?.stats,
        totalRoutes: (prev?.stats?.totalRoutes || 0) + 1,
      },
    }));

    setShowAddRouteModal(false);
    setNewRouteName('');
    setNewOrigin('');
    setNewDestination('');
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#0284c7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading Transport & Fleet Operations...</p>
        </div>
      </div>
    );
  }

  const filteredStudents = (data?.studentAllocations || []).filter((s: any) =>
    s.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.assignedRoute.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        {/* Header Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bae6fd' }}>
                <Bus size={20} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Transport & Fleet Operations
              </h1>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 46px' }}>
              Real-time vehicle GPS tracking, multi-point routes, driver rosters & student commute allocations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddRouteModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={15} />
              <span>Create Route</span>
            </button>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={15} />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fleet Strength</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{data?.stats?.totalVehicles || 4} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Buses</span></div>
            <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>100% Fitness Compliant</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live On Route</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>{data?.stats?.activeOnRoute || 3} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Active GPS</span></div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
              Live Telematics Active
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Active Routes</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{data?.stats?.totalRoutes || 3} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Corridors</span></div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>18 Morning & Drop Stops</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Students Commuting</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{data?.stats?.studentsTransported || 117} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Students</span></div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Capacity: {data?.stats?.totalCapacity || 130} Seats (90% Occ.)</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('fleet')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'fleet' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'fleet' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Bus size={16} />
            <span>Vehicles & Fleet Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'routes' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'routes' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Compass size={16} />
            <span>Routes & Stop Timings</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'students' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'students' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Users size={16} />
            <span>Student Route Allocation</span>
          </button>
          <button
            onClick={() => setActiveTab('gps')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'gps' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'gps' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Navigation size={16} />
            <span>Live GPS Radar</span>
          </button>
        </div>

        {/* TAB 1: FLEET & VEHICLES */}
        {activeTab === 'fleet' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {(data?.fleet || []).map((veh: any) => (
              <div
                key={veh.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{veh.busNumber}</h3>
                    <div style={{ fontSize: '12.5px', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>{veh.registrationNumber}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      backgroundColor: veh.gpsStatus === 'ONLINE' ? '#ecfdf5' : '#f1f5f9',
                      color: veh.gpsStatus === 'ONLINE' ? '#047857' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: veh.gpsStatus === 'ONLINE' ? '#10b981' : '#94a3b8' }} />
                    {veh.gpsStatus}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', marginBottom: '14px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Driver</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{veh.driverName}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Contact</span>
                    <span style={{ fontWeight: 600, color: '#0284c7' }}>{veh.driverPhone}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Capacity</span>
                    <span style={{ fontWeight: 600 }}>{veh.occupiedSeats} / {veh.capacity} Seats</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Speed</span>
                    <span style={{ fontWeight: 600, color: veh.speedKmH > 0 ? '#16a34a' : '#64748b' }}>{veh.speedKmH} km/h</span>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#0284c7" />
                  <span><strong>Location:</strong> {veh.currentLocation}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px', fontSize: '11.5px', color: '#64748b' }}>
                  <span>Fitness: <strong>{veh.fitnessExpiry}</strong></span>
                  <span>Fuel: <strong>{veh.fuelLevel}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: ROUTES & STOP SCHEDULES */}
        {activeTab === 'routes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(data?.routes || []).map((route: any) => (
              <div
                key={route.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0c4a6e', margin: '0 0 4px' }}>{route.routeName}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      Assigned: <strong>{route.busNumber}</strong> • Driver: {route.driverName} • Total Commuters: {route.totalStudents}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                    <span style={{ backgroundColor: '#f0f9ff', padding: '6px 12px', borderRadius: '6px', color: '#0369a1', fontWeight: 600 }}>
                      Morning Pickup: {route.morningPickupStart}
                    </span>
                    <span style={{ backgroundColor: '#f0fdf4', padding: '6px 12px', borderRadius: '6px', color: '#166534', fontWeight: 600 }}>
                      School Drop: {route.morningSchoolArrival}
                    </span>
                  </div>
                </div>

                {/* Stops Timeline */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Stop Sequence & Commuters
                  </div>
                  <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {route.stops.map((stop: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        style={{
                          minWidth: '180px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          backgroundColor: '#f8fafc',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sIdx + 1}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{stop.time}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>{stop.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{stop.students} Students Boarding</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: STUDENT ALLOCATIONS */}
        {activeTab === 'students' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search student or route..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                Showing {filteredStudents.length} Allocations
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                    <th style={{ padding: '12px 16px' }}>Student Name</th>
                    <th style={{ padding: '12px 16px' }}>Admission No</th>
                    <th style={{ padding: '12px 16px' }}>Class / Section</th>
                    <th style={{ padding: '12px 16px' }}>Assigned Corridor & Bus</th>
                    <th style={{ padding: '12px 16px' }}>Designated Stop</th>
                    <th style={{ padding: '12px 16px' }}>Bus Fee Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st: any) => (
                    <tr key={st.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{st.studentName}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{st.admissionNumber}</td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>{st.className}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 600, color: '#0c4a6e' }}>{st.assignedRoute}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>({st.busNumber})</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{st.pickupStop}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: st.feeStatus === 'PAID' ? '#ecfdf5' : '#fef2f2',
                            color: st.feeStatus === 'PAID' ? '#047857' : '#b91c1c',
                          }}
                        >
                          {st.feeStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE GPS RADAR */}
        {activeTab === 'gps' && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Live Fleet Geolocation Console</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                  Real-time AIS 140 compliant GPS telemetry synced via school server
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', animation: 'pulse 1.5s infinite' }} />
                <span>3 Telemetry Satellites Connected</span>
              </div>
            </div>

            {/* Radar Simulation Grid */}
            <div
              style={{
                height: '380px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* Simulated Central Campus Marker */}
              <div style={{ position: 'absolute', top: '48%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', boxShadow: '0 0 0 8px rgba(2, 132, 199, 0.15)' }}>
                  <Bus size={22} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0c4a6e', backgroundColor: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                  DPS Senior Wing
                </div>
              </div>

              {/* Bus 01 Moving Node */}
              <div style={{ position: 'absolute', top: '28%', left: '32%', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', boxShadow: '0 0 0 6px rgba(16, 185, 129, 0.15)' }}>
                  <Navigation size={16} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  Bus 01 (38 km/h)
                </div>
              </div>

              {/* Bus 02 Moving Node */}
              <div style={{ position: 'absolute', top: '65%', left: '68%', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', boxShadow: '0 0 0 6px rgba(16, 185, 129, 0.15)' }}>
                  <Navigation size={16} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  Bus 02 (42 km/h)
                </div>
              </div>

              {/* Bus 03 Moving Node */}
              <div style={{ position: 'absolute', top: '75%', left: '25%', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', boxShadow: '0 0 0 6px rgba(16, 185, 129, 0.15)' }}>
                  <Navigation size={16} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  Bus 03 (25 km/h)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD VEHICLE */}
        {showAddVehicleModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Register New Fleet Vehicle</h3>
                <button onClick={() => setShowAddVehicleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateVehicle}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Bus Identifier / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bus 05 - West Campus"
                    value={newBusNumber}
                    onChange={(e) => setNewBusNumber(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Registration Plate</label>
                    <input
                      type="text"
                      required
                      placeholder="DL-01-EF-1234"
                      value={newRegNumber}
                      onChange={(e) => setNewRegNumber(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Seating Capacity</label>
                    <input
                      type="number"
                      required
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Driver Name</label>
                    <input
                      type="text"
                      placeholder="Mr. Harish Meena"
                      value={newDriver}
                      onChange={(e) => setNewDriver(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Driver Contact</label>
                    <input
                      type="text"
                      placeholder="+91 98112 00000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAddVehicleModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                    Save Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE ROUTE */}
        {showAddRouteModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Create New Transport Corridor</h3>
                <button onClick={() => setShowAddRouteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRoute}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Route Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Route 04: Janakpuri & Uttam Nagar"
                    value={newRouteName}
                    onChange={(e) => setNewRouteName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Origin Point</label>
                    <input
                      type="text"
                      placeholder="Janakpuri District Centre"
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Destination</label>
                    <input
                      type="text"
                      placeholder="Senior Wing Campus"
                      value={newDestination}
                      onChange={(e) => setNewDestination(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Morning Pickup Time</label>
                  <input
                    type="text"
                    placeholder="06:45 AM"
                    value={newMorningTime}
                    onChange={(e) => setNewMorningTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAddRouteModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                    Create Route
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
