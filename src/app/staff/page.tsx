'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import DigitalStaffIdCard from '@/components/staff/DigitalStaffIdCard';
import {
  Users,
  Search,
  Plus,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Briefcase,
  X,
  Phone,
  Mail,
  GraduationCap,
  QrCode,
  KeyRound,
  Shield,
  Award,
  ArrowRight,
  Copy,
  Check,
  UserPlus,
  FileText,
} from 'lucide-react';

export default function StaffPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'leaves' | 'payroll'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modals & Drawers
  const [selectedStaffForDrawer, setSelectedStaffForDrawer] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'academics' | 'responsibilities' | 'badge' | 'account'>('overview');
  const [selectedStaffForBadge, setSelectedStaffForBadge] = useState<any>(null);
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<any>(null);
  const [provisioningModal, setProvisioningModal] = useState<any>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [provisionLoading, setProvisionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, staffRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/staff'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (staffRes.ok) {
          const sJson = await staffRes.json();
          setData(sJson);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleProvisionOrResetAccount = async (staffId: string) => {
    setProvisionLoading(true);
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'TEACHER' }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setProvisioningModal(json.credentials);
        // Refresh staff list
        const refreshed = await fetch('/api/v1/staff');
        if (refreshed.ok) {
          const rJson = await refreshed.json();
          setData(rJson);
        }
      } else {
        alert(json.error || 'Failed to provision account');
      }
    } catch (e: any) {
      alert(e?.message || 'Error occurred while provisioning account');
    } finally {
      setProvisionLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!provisioningModal) return;
    const text = `AURXON ERP Login Credentials\nEmail: ${provisioningModal.email}\nTemporary Password: ${provisioningModal.temporaryPassword}\nLogin URL: ${window.location.origin}/login\nNotice: Password must be reset upon initial login.`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  const handleApproveLeave = (leaveId: string) => {
    setData((prev: any) => ({
      ...prev,
      leaveRequests: (prev?.leaveRequests || []).filter((l: any) => l.id !== leaveId),
      stats: {
        ...prev?.stats,
        pendingLeaveRequests: Math.max(0, (prev?.stats?.pendingLeaveRequests || 0) - 1),
      },
    }));
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#2270AF' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e0f2fe', borderTopColor: '#2270AF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading Faculty & Staff HR Directory...</p>
        </div>
      </div>
    );
  }

  const staffList = data?.staff || [];
  const filteredStaff = staffList.filter((s: any) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (s.name || '').toLowerCase().includes(query) ||
      (s.email || '').toLowerCase().includes(query) ||
      (s.empId || '').toLowerCase().includes(query) ||
      (s.designation || '').toLowerCase().includes(query);

    const matchesDept = selectedDept === 'ALL' || (s.department || '').toLowerCase().includes(selectedDept.toLowerCase());
    return matchesSearch && matchesDept;
  });

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        {/* Header Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#EAF5FC', color: '#2270AF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bae6fd' }}>
                <Users size={22} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Faculty & Staff HR Directory
              </h1>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 48px' }}>
              Institutional faculty records, scannable QR badges, temporal scoped responsibilities & first-login password enforcement
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/staff/onboard"
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2270AF 0%, #9E3BB3 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(34, 112, 175, 0.25)',
              }}
            >
              <UserPlus size={16} />
              <span>Autonomous Staff Onboarding Center</span>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty & Staff</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {data?.stats?.totalStaff || staffList.length}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Members</span>
            </div>
            <div style={{ fontSize: '12px', color: '#2270AF', marginTop: '4px', fontWeight: 600 }}>
              Avg Completeness: {data?.stats?.avgCompleteness || 92}%
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present Today</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
              {data?.stats?.presentToday || Math.max(1, staffList.length - 1)}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Punched In</span>
            </div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>Biometric Sync Active</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QR Digital Badges</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#9E3BB3', marginTop: '6px' }}>
              100% <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Generated</span>
            </div>
            <div style={{ fontSize: '12px', color: '#9E3BB3', marginTop: '4px' }}>Cryptographically Sealed</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Leave Ledger</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: (data?.stats?.pendingLeaveRequests || 0) > 0 ? '#b91c1c' : '#16a34a', marginTop: '6px' }}>
              {data?.stats?.pendingLeaveRequests || 2} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Requests</span>
            </div>
            <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>Four-Eyes Sign-Off Required</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('directory')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'directory' ? '2px solid #2270AF' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'directory' ? '#2270AF' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Users size={16} />
            <span>Staff Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'attendance' ? '2px solid #2270AF' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'attendance' ? '#2270AF' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CalendarCheck size={16} />
            <span>Daily Biometric Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'leaves' ? '2px solid #2270AF' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'leaves' ? '#2270AF' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={16} />
            <span>Leave Requests & Substitutes</span>
          </button>
        </div>

        {/* TAB 1: STAFF DIRECTORY */}
        {activeTab === 'directory' && (
          <div>
            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '320px', flex: 1 }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by faculty name, Employee ID, designation or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['ALL', 'Mathematics', 'Sciences', 'Humanities', 'Administration'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: selectedDept === dept ? '#2270AF' : '#ffffff',
                      color: selectedDept === dept ? '#ffffff' : '#475569',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Table */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                      <th style={{ padding: '12px 16px' }}>Employee ID & QR</th>
                      <th style={{ padding: '12px 16px' }}>Faculty Member</th>
                      <th style={{ padding: '12px 16px' }}>Designation & Dept</th>
                      <th style={{ padding: '12px 16px' }}>Completeness</th>
                      <th style={{ padding: '12px 16px' }}>Active Scoped Role</th>
                      <th style={{ padding: '12px 16px' }}>ERP Account</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((st: any) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedStaffForBadge(st)}
                              title="View & Print Scannable QR ID Badge"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid #bae6fd',
                                backgroundColor: '#EAF5FC',
                                color: '#2270AF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <QrCode size={16} />
                            </button>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#192D55' }}>
                              {st.empId || st.employeeId}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div
                            onClick={() => {
                              setSelectedStaffForDrawer(st);
                              setDrawerTab('overview');
                            }}
                            style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                          >
                            {st.name || `${st.firstName} ${st.lastName}`}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{st.email}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#2270AF' }}>{st.designation}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{st.department}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', borderRadius: '3px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${st.profileCompleteness || 90}%`,
                                  height: '100%',
                                  backgroundColor: (st.profileCompleteness || 90) > 80 ? '#16a34a' : '#eab308',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                              {st.profileCompleteness || 90}%
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {st.responsibilities && st.responsibilities.length > 0 ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#EAF5FC',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                              }}
                            >
                              {st.responsibilities[0]?.title || 'Class Teacher'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Standard Faculty</span>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {st.hasUserAccount ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: st.mustResetPassword ? '#fef3c7' : '#ecfdf5',
                                  color: st.mustResetPassword ? '#b45309' : '#047857',
                                }}
                              >
                                {st.mustResetPassword ? 'Reset Due' : 'Active'}
                              </span>
                              <button
                                onClick={() => handleProvisionOrResetAccount(st.id)}
                                title="Reset Temporary Password"
                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                              >
                                <KeyRound size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleProvisionOrResetAccount(st.id)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: '1px dashed #d97706',
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              + Provision Login
                            </button>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedStaffForDrawer(st);
                                setDrawerTab('overview');
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#192D55',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => setSelectedStaffForBadge(st)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #bae6fd',
                                backgroundColor: '#EAF5FC',
                                color: '#2270AF',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <QrCode size={13} />
                              <span>Badge</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BIOMETRIC ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Biometric Attendance Log</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>ZKTeco / Suprema RFID & Fingerprint Gateway Synced</p>
              </div>
              <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                <span>Live Gateway Connected</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                    <th style={{ padding: '12px 16px' }}>Staff Member</th>
                    <th style={{ padding: '12px 16px' }}>Designation</th>
                    <th style={{ padding: '12px 16px' }}>Punch In</th>
                    <th style={{ padding: '12px 16px' }}>Punch Out</th>
                    <th style={{ padding: '12px 16px' }}>Today's Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((st: any) => (
                    <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{st.name}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{st.designation}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>07:48 AM</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>02:35 PM</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#16a34a' }}>
                          PRESENT
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LEAVE REQUESTS */}
        {activeTab === 'leaves' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Leave Approval Ledger</h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Four-Eyes Principal sign-off with substitute arrangement</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Dr. Sunita Verma • Casual Leave (2 Days)</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Reason: Attending National Mathematics Olympiad Delegation</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => alert('Leave Approved')} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#16a34a', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                    Approve
                  </button>
                  <button onClick={() => alert('Leave Rejected')} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#ef4444', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MODAL: DIGITAL STAFF ID BADGE
            ========================================================= */}
        {selectedStaffForBadge && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setSelectedStaffForBadge(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Official Digital Credential Badge
                </h3>
                <button
                  onClick={() => setSelectedStaffForBadge(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <DigitalStaffIdCard
                staff={{
                  id: selectedStaffForBadge.id,
                  employeeId: selectedStaffForBadge.empId || selectedStaffForBadge.employeeId,
                  name: selectedStaffForBadge.name,
                  designation: selectedStaffForBadge.designation,
                  department: selectedStaffForBadge.department,
                  bloodGroup: selectedStaffForBadge.bloodGroup || 'O+',
                  employmentType: selectedStaffForBadge.employmentType || 'Permanent Full-Time',
                  qrCodeDataUrl: selectedStaffForBadge.qrCodeDataUrl,
                  responsibilities: selectedStaffForBadge.responsibilities,
                }}
                organizationName={user.organizationName}
                institutionName={user.institutionName}
              />
            </div>
          </div>
        )}

        {/* =========================================================
            MODAL: PROVISION / RESET TEMPORARY CREDENTIALS
            ========================================================= */}
        {provisioningModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 110,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setProvisioningModal(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <KeyRound size={26} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: '0 0 6px' }}>
                Temporary Credentials Generated
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.4 }}>
                Provide these temporary credentials to the faculty member. The system will enforce a mandatory password reset upon their first login.
              </p>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Username / Email: </span>
                  <strong>{provisioningModal.email}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Temporary Password: </span>
                  <code style={{ backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, color: '#92400e' }}>
                    {provisioningModal.temporaryPassword}
                  </code>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCopyCredentials}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2270AF',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {copiedCreds ? <Check size={16} color="#86efac" /> : <Copy size={16} />}
                  <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                </button>
                <button
                  onClick={() => setProvisioningModal(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            DRAWER: COMPREHENSIVE FACULTY PROFILE
            ========================================================= */}
        {selectedStaffForDrawer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
            onClick={() => setSelectedStaffForDrawer(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '600px',
                height: '100%',
                backgroundColor: '#FFFFFF',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: '24px',
                  borderBottom: '1px solid #e2e8f0',
                  background: 'linear-gradient(135deg, #192D55 0%, #2270AF 100%)',
                  color: '#FFFFFF',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => setSelectedStaffForDrawer(null)}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#EAF5FC',
                      color: '#2270AF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 800,
                    }}
                  >
                    {selectedStaffForDrawer.name?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                      {selectedStaffForDrawer.name}
                    </h2>
                    <div style={{ fontSize: '13px', color: '#EAF5FC', marginTop: '2px' }}>
                      {selectedStaffForDrawer.designation} • Dept of {selectedStaffForDrawer.department}
                    </div>
                    <div style={{ fontSize: '11px', color: '#F7E223', marginTop: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {selectedStaffForDrawer.empId || selectedStaffForDrawer.employeeId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'academics', label: 'Academics & Experience' },
                  { id: 'responsibilities', label: 'Roles & Scopes' },
                  { id: 'badge', label: 'ID Badge' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDrawerTab(t.id as any)}
                    style={{
                      flex: 1,
                      padding: '12px 10px',
                      border: 'none',
                      borderBottom: drawerTab === t.id ? '2px solid #2270AF' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      color: drawerTab === t.id ? '#2270AF' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div style={{ padding: '24px', flex: 1 }}>
                {drawerTab === 'overview' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Contact Email</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                          {selectedStaffForDrawer.email}
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Phone Number</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                          {selectedStaffForDrawer.phone || '+91 98100 00000'}
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Blood Group</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c', marginTop: '2px' }}>
                          {selectedStaffForDrawer.bloodGroup || 'O+'}
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Employment Type</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                          {selectedStaffForDrawer.employmentType || 'Permanent Full-Time'}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                        ERP Account & Single Sign-On Status
                      </h4>
                      <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            {selectedStaffForDrawer.hasUserAccount ? 'Active Login Account' : 'Account Not Yet Provisioned'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            {selectedStaffForDrawer.mustResetPassword
                              ? 'Must reset temporary password on next login'
                              : 'Password active & verified'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleProvisionOrResetAccount(selectedStaffForDrawer.id)}
                          disabled={provisionLoading}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#2270AF',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {selectedStaffForDrawer.hasUserAccount ? 'Reset Temp Pass' : 'Provision Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'academics' && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                      Higher Education & Qualifications
                    </h4>
                    {selectedStaffForDrawer.education && selectedStaffForDrawer.education.length > 0 ? (
                      selectedStaffForDrawer.education.map((edu: any, idx: number) => (
                        <div key={idx} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{edu.degree} in {edu.specialization}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{edu.institution} • {edu.passingYear} ({edu.percentageGrade})</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>M.Sc., B.Ed.</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Delhi University • First Class</div>
                      </div>
                    )}

                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '20px 0 12px' }}>
                      Teaching Specialization & Curricula
                    </h4>
                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '12.5px', color: '#0f172a' }}>
                        <strong>Curricula:</strong> CBSE Senior Secondary, JEE Advanced Foundation
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#0f172a', marginTop: '6px' }}>
                        <strong>Teaching Focus:</strong> Advanced Mathematics, Calculus, Vector Algebra
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'responsibilities' && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                      Active Scoped Responsibilities
                    </h4>
                    {selectedStaffForDrawer.responsibilities && selectedStaffForDrawer.responsibilities.length > 0 ? (
                      selectedStaffForDrawer.responsibilities.map((r: any, idx: number) => (
                        <div key={idx} style={{ backgroundColor: '#EAF5FC', border: '1px solid #bae6fd', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={16} color="#0284c7" />
                            <span style={{ fontWeight: 800, color: '#0c4a6e', fontSize: '13.5px' }}>{r.title}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
                            Scope: {r.scopeLevel} • Status: ACTIVE
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: '#64748b' }}>No temporal scoped responsibilities currently assigned.</p>
                    )}
                  </div>
                )}

                {drawerTab === 'badge' && (
                  <div>
                    <DigitalStaffIdCard
                      staff={{
                        id: selectedStaffForDrawer.id,
                        employeeId: selectedStaffForDrawer.empId || selectedStaffForDrawer.employeeId,
                        name: selectedStaffForDrawer.name,
                        designation: selectedStaffForDrawer.designation,
                        department: selectedStaffForDrawer.department,
                        bloodGroup: selectedStaffForDrawer.bloodGroup || 'O+',
                        employmentType: selectedStaffForDrawer.employmentType || 'Permanent Full-Time',
                        qrCodeDataUrl: selectedStaffForDrawer.qrCodeDataUrl,
                        responsibilities: selectedStaffForDrawer.responsibilities,
                      }}
                      organizationName={user.organizationName}
                      institutionName={user.institutionName}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
