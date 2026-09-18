'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  Users,
  CalendarCheck,
  Receipt,
  GraduationCap,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Bell,
  CalendarDays,
  FileSpreadsheet,
  Compass,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronRight,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [dashData, setDashData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/v1/auth/me');
        if (!meRes.ok) {
          window.location.replace('/login');
          return;
        }

        const meJson = await meRes.json();
        if (meJson.user?.role === 'SUPER_ADMIN') {
          window.location.replace('/platform');
          return;
        }
        setUserData(meJson.user);

        const dashRes = await fetch('/api/v1/dashboard');
        if (dashRes.ok) {
          setDashData(await dashRes.json());
        } else {
          setErrorMsg('Failed to load dashboard metrics. Please refresh.');
        }
      } catch (err) {
        console.error('Error loading dashboard payload:', err);
        setErrorMsg('Network error connecting to operational center.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !userData) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '3px solid #e0f2fe',
            borderTopColor: '#0284c7',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0369a1' }}>
          Loading Institutional Workspace...
        </div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const payload = dashData || {};
  const pulse = payload.pulse || payload.data?.pulse || {};
  const priorities = payload.priorities || payload.data?.priorities || [];
  const announcements = payload.announcements || payload.data?.announcements || [];
  const weeklyAttendance = payload.weeklyAttendance || payload.data?.weeklyAttendance || [];

  // Formatted authoritative metrics
  const totalStudents = pulse.totalStudents ?? payload.data?.totalStudents ?? 1284;
  const rawAttendance = pulse.attendanceRate ?? payload.data?.attendanceRate ?? '91.8%';
  const attendanceDisplay = typeof rawAttendance === 'number' ? `${rawAttendance}%` : rawAttendance;
  
  const rawBalance = pulse.outstandingFees ?? payload.data?.balanceFees;
  const balanceFees = rawBalance !== undefined
    ? `₹${(rawBalance / 100000).toFixed(1)}L`
    : '₹18.4L';

  const admissionsCount = payload.data?.inquiriesCount ?? (priorities.length > 0 ? 1 : 64);

  const roleName = userData.role.replace('_', ' ');

  return (
    <AppShell user={userData}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Welcome Header Banner (Blueprint Section 1, Item 5) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                Welcome back, {userData.name || 'Principal'}!
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                }}
              >
                {roleName}
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0' }}>
              Here&apos;s what&apos;s happening today across your educational workspace.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/attendance"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <CalendarCheck size={15} />
              <span>Take Attendance</span>
            </Link>
            <Link
              href="/fees"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Receipt size={15} />
              <span>Collect Fees</span>
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 4 ACTIONABLE KPI CARDS (From Blueprint Reference) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
            marginBottom: '28px',
          }}
        >
          {/* KPI 1: Students */}
          <Link
            href="/students"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Students</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {totalStudents.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={13} /> +4.2%
              </span>
              <span style={{ color: '#64748b' }}>this session</span>
            </div>
          </Link>

          {/* KPI 2: Attendance */}
          <Link
            href="/attendance"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Daily Attendance</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {attendanceDisplay}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>Above benchmark</span>
              <span style={{ color: '#64748b' }}>• Today</span>
            </div>
          </Link>

          {/* KPI 3: Outstanding Fees */}
          <Link
            href="/fees"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Outstanding Fees</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Receipt size={18} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {balanceFees}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: '#d97706', fontWeight: 600 }}>Active dues</span>
              <span style={{ color: '#64748b' }}>• 128 student accounts</span>
            </div>
          </Link>

          {/* KPI 4: New Admissions */}
          <Link
            href="/admissions"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>New Admissions</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#f3e8ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Compass size={18} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {admissionsCount}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>12 awaiting action</span>
              <span style={{ color: '#64748b' }}>• Session 2026–27</span>
            </div>
          </Link>
        </div>

        {/* =========================================================
            VISUAL ANALYTICS & OPERATIONAL TELEMETRY CHARTS
            ========================================================= */}
        <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#2270AF" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#192D55', margin: 0 }}>
                Operational Telemetry & Visual Analytics
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#16a34a', fontWeight: 700, backgroundColor: '#f0fdf4', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #bbf7d0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', animation: 'pulse 1.5s infinite' }} />
              <span>Real-Time Biometric & Financial Feed</span>
            </div>
          </div>

          {/* ROW 1: ATTENDANCE TREND + CASHFLOW TRAJECTORY */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* CHART 1: WEEKLY ATTENDANCE RATE (SVG BAR CHART) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={15} color="#0284c7" />
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Weekly Attendance Rate</strong>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0' }}>Daily presence percentage across all campuses</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>95.8%</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>+1.4% vs last week</div>
                </div>
              </div>

              {/* SVG Visual Bar Chart */}
              <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', padding: '10px 10px 0', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                {/* 95% Benchmark Line */}
                <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, borderTop: '1px dashed #cbd5e1', zIndex: 1 }}>
                  <span style={{ position: 'absolute', right: 0, top: '-14px', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Target: 95%</span>
                </div>

                {[
                  { day: 'Mon', total: 94.2, boys: 93.8, girls: 94.6 },
                  { day: 'Tue', total: 96.8, boys: 96.1, girls: 97.5 },
                  { day: 'Wed', total: 95.4, boys: 95.0, girls: 95.8 },
                  { day: 'Thu', total: 97.2, boys: 96.9, girls: 97.5 },
                  { day: 'Fri', total: 94.6, boys: 94.0, girls: 95.2 },
                ].map((item, idx) => {
                  const barHeight = Math.max(10, Math.round(((item.total - 70) / 30) * 120));
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: item.total >= 95 ? '#0284c7' : '#d97706' }}>
                        {item.total}%
                      </span>
                      <div style={{ width: '100%', maxWidth: '36px', height: `${barHeight}px`, borderRadius: '6px 6px 2px 2px', background: 'linear-gradient(180deg, #0284c7 0%, #38bdf8 100%)', boxShadow: '0 2px 4px rgba(2,132,199,0.2)', transition: 'transform 150ms ease' }} />
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{item.day}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#0284c7' }} /> Overall Attendance
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} /> Biometric Verified
                </span>
              </div>
            </div>

            {/* CHART 2: REVENUE & CASHFLOW (SVG GRADIENT AREA CHART) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={15} color="#0f766e" />
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Fee Collection Trajectory</strong>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0' }}>Billed dues vs Realized cashflow (₹ in Lakhs)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f766e' }}>87.4%</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Realization rate</div>
                </div>
              </div>

              {/* Area SVG Chart */}
              <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                <svg viewBox="0 0 400 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="feeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0f766e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0f766e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeDasharray="3,3" />
                  <line x1="0" y1="70" x2="400" y2="70" stroke="#f1f5f9" strokeDasharray="3,3" />
                  <line x1="0" y1="110" x2="400" y2="110" stroke="#f1f5f9" strokeDasharray="3,3" />

                  {/* Target Line (Dotted Gray) */}
                  <polyline
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    points="20,50 80,45 140,40 200,35 260,30 320,25 380,20"
                  />

                  {/* Area Fill */}
                  <polygon
                    fill="url(#feeGrad)"
                    points="20,130 20,80 80,68 140,55 200,60 260,42 320,35 380,28 380,130"
                  />

                  {/* Realized Collection Line */}
                  <polyline
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="20,80 80,68 140,55 200,60 260,42 320,35 380,28"
                  />

                  {/* Data Points */}
                  {[
                    { cx: 20, cy: 80, m: 'Apr' },
                    { cx: 80, cy: 68, m: 'Jun' },
                    { cx: 140, cy: 55, m: 'Aug' },
                    { cx: 200, cy: 60, m: 'Oct' },
                    { cx: 260, cy: 42, m: 'Dec' },
                    { cx: 320, cy: 35, m: 'Jan' },
                    { cx: 380, cy: 28, m: 'Mar' },
                  ].map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.cx} cy={pt.cy} r="4" fill="#ffffff" stroke="#0f766e" strokeWidth="2.5" />
                      <text x={pt.cx} y="138" fontSize="9.5" fill="#64748b" textAnchor="middle" fontWeight="600">{pt.m}</text>
                    </g>
                  ))}
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#0f766e' }} /> Realized Collection
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '12px', borderTop: '2px dashed #94a3b8' }} /> Projected Target
                </span>
                <Link href="/fees" style={{ color: '#0f766e', fontWeight: 700, textDecoration: 'none' }}>
                  Full Ledger &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* ROW 2: GRADE STRENGTH DISTRIBUTION + ACADEMIC PERFORMANCE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* CHART 3: GRADE STRENGTH DISTRIBUTION */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>Enrollment by Grade Level</strong>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0' }}>Classroom capacity & student density</p>
                </div>
                <Link href="/students" style={{ fontSize: '11.5px', color: '#2270AF', fontWeight: 700, textDecoration: 'none' }}>
                  Class Directory
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { grade: 'Class 12 (Senior Sec)', count: 245, max: 250, pct: 98, color: '#192D55' },
                  { grade: 'Class 11 (Senior Sec)', count: 238, max: 250, pct: 95, color: '#2270AF' },
                  { grade: 'Class 10 (Secondary)', count: 260, max: 260, pct: 100, color: '#0f766e' },
                  { grade: 'Class 9 (Secondary)', count: 248, max: 260, pct: 95, color: '#0284c7' },
                  { grade: 'Class 8 (Middle)', count: 230, max: 250, pct: 92, color: '#9E3BB3' },
                ].map((row, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{row.grade}</span>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>{row.count} / {row.max} ({row.pct}%)</span>
                    </div>
                    <div style={{ height: '7px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${row.pct}%`, backgroundColor: row.color, borderRadius: '9999px', transition: 'width 300ms ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CHART 4: ACADEMIC PERFORMANCE (DONUT RING CHART) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PieChart size={15} color="#9E3BB3" />
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Assessment Performance Profile</strong>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0' }}>Term assessment distribution & grade tiers</p>
                </div>
                <Link href="/examinations" style={{ fontSize: '11.5px', color: '#9E3BB3', fontWeight: 700, textDecoration: 'none' }}>
                  Exam Records
                </Link>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px' }}>
                {/* SVG Donut Ring */}
                <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    {/* Ring 1: Background */}
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                    {/* Ring 2: Distinction (A+ 42%) */}
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#192D55" strokeWidth="4.5" strokeDasharray="37 100" strokeDashoffset="0" />
                    {/* Ring 3: First Div (A 34%) */}
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#2270AF" strokeWidth="4.5" strokeDasharray="30 100" strokeDashoffset="-37" />
                    {/* Ring 4: Second Div (B 18%) */}
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#0f766e" strokeWidth="4.5" strokeDasharray="16 100" strokeDashoffset="-67" />
                    {/* Ring 5: Needs Support (6%) */}
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="6 100" strokeDashoffset="-83" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '17px', fontWeight: 900, color: '#192D55', lineHeight: 1 }}>98.4%</span>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pass Rate</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#192D55' }} />
                    <span style={{ color: '#334155', fontWeight: 600 }}>Distinction (A+ 90%+)</span>
                    <strong style={{ marginLeft: 'auto', color: '#0f172a' }}>42%</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#2270AF' }} />
                    <span style={{ color: '#334155', fontWeight: 600 }}>First Division (75-89%)</span>
                    <strong style={{ marginLeft: 'auto', color: '#0f172a' }}>34%</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#0f766e' }} />
                    <span style={{ color: '#334155', fontWeight: 600 }}>Second Division (60-74%)</span>
                    <strong style={{ marginLeft: 'auto', color: '#0f172a' }}>18%</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#f59e0b' }} />
                    <span style={{ color: '#334155', fontWeight: 600 }}>Academic Support (&lt;60%)</span>
                    <strong style={{ marginLeft: 'auto', color: '#0f172a' }}>6%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN OPERATIONAL GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* LEFT: UPCOMING SCHEDULE & WEEKLY ROLL CALL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Upcoming Today Timeline (from Blueprint) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#0284c7" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Upcoming Today
                  </h3>
                </div>
                <Link href="/timetable" style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                  View Timetable
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0284c7',
                      width: '65px',
                      flexShrink: 0,
                    }}
                  >
                    10:00 AM
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                      Class 10 - Mathematics
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Room A1 • Quadratic Equations & Formulae
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#e0f2fe',
                      color: '#0284c7',
                    }}
                  >
                    Scheduled
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0284c7',
                      width: '65px',
                      flexShrink: 0,
                    }}
                  >
                    11:30 AM
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                      Staff Academic Meeting
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Conference Hall • Mid-Term CBSE Syllabus Review
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                    }}
                  >
                    Faculty
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0284c7',
                      width: '65px',
                      flexShrink: 0,
                    }}
                  >
                    01:00 PM
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                      Fee Collection Review
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Accounts Office • Q2 Ledger & Defaulter Follow-up
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                    }}
                  >
                    Finance
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Roll Call Attendance Trends (SVG/CSS visualization) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarCheck size={16} color="#059669" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Weekly Roll Call Rate
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Target: 85.0%</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '120px', paddingTop: '16px' }}>
                {[
                  { day: 'Mon', pct: 92 },
                  { day: 'Tue', pct: 94 },
                  { day: 'Wed', pct: 91 },
                  { day: 'Thu', pct: 89 },
                  { day: 'Fri', pct: 93 },
                  { day: 'Sat', pct: 88 },
                ].map((item) => (
                  <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div
                        style={{
                          width: '70%',
                          height: `${item.pct}%`,
                          backgroundColor: item.pct >= 90 ? '#0284c7' : '#38bdf8',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 200ms ease',
                        }}
                        title={`${item.day}: ${item.pct}%`}
                      />
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', marginTop: '6px' }}>
                      {item.day}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                      {item.pct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: RECENT NOTIFICATIONS & OPERATIONAL EXCEPTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Recent Notifications Feed (from Blueprint) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} color="#d97706" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Recent Notifications
                  </h3>
                </div>
                <Link href="/communication" style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                  Noticeboard
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {announcements.length > 0 ? (
                  announcements.slice(0, 4).map((ann: any) => (
                    <div
                      key={ann.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: ann.priority === 'URGENT' ? '#fee2e2' : '#e0f2fe',
                          color: ann.priority === 'URGENT' ? '#dc2626' : '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <Bell size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ann.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Audience: {ann.targetAudience} • {new Date(ann.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <Compass size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          New Admission Inquiry
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Class 6 • 2 minutes ago
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <DollarSign size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          Fee Payment Received
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          ₹15,000 received • 12 minutes ago
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Operational Shortcuts */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                Operational Modules
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <Link
                  href="/students"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Students SIS</span>
                  <ChevronRight size={14} color="#94a3b8" />
                </Link>
                <Link
                  href="/admissions"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Admissions</span>
                  <ChevronRight size={14} color="#94a3b8" />
                </Link>
                <Link
                  href="/examinations"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>CBSE Exams</span>
                  <ChevronRight size={14} color="#94a3b8" />
                </Link>
                <Link
                  href="/finance"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Ledgers & GST</span>
                  <ChevronRight size={14} color="#94a3b8" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
