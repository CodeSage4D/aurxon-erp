'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
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
} from 'lucide-react';

export default function StaffPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'leaves' | 'payroll'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<any>(null);

  // New Staff Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('PGT Mathematics');
  const [dept, setDept] = useState('Mathematics');
  const [qualifications, setQualifications] = useState('M.Sc., B.Ed.');

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

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;

    const newEmp = {
      id: `staff-${Date.now()}`,
      empId: `EMP-2024-${String((data?.staff?.length || 0) + 1).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      email,
      phone: phone || '+91 98100 00000',
      role: 'TEACHER',
      designation,
      department: dept,
      qualifications,
      joiningDate: '2026-09-01',
      status: 'ACTIVE',
      todayAttendance: 'PRESENT',
      punchInTime: '07:50 AM',
      punchOutTime: '02:30 PM',
      basicSalary: 68000,
      netSalary: 77500,
    };

    setData((prev: any) => ({
      ...prev,
      staff: [newEmp, ...(prev?.staff || [])],
      stats: {
        ...prev?.stats,
        totalStaff: (prev?.stats?.totalStaff || 0) + 1,
        presentToday: (prev?.stats?.presentToday || 0) + 1,
      },
    }));

    setShowAddStaffModal(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
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
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#0284c7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading Faculty & Staff HR Directory...</p>
        </div>
      </div>
    );
  }

  const filteredStaff = (data?.staff || []).filter((s: any) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || s.department.toLowerCase().includes(selectedDept.toLowerCase());

    return matchesSearch && matchesDept;
  });

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        {/* Header Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bae6fd' }}>
                <Users size={20} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Faculty & Staff HR Directory
              </h1>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 46px' }}>
              Teaching and administrative employees, biometric attendance, leave approvals & salary slips
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddStaffModal(true)}
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
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty & Staff</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{data?.stats?.totalStaff || 8} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Members</span></div>
            <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>100% Verified Profiles</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present Today</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>{data?.stats?.presentToday || 7} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Punched In</span></div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>Biometric Sync Active</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>On Approved Leave</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0c4a6e', marginTop: '6px' }}>{data?.stats?.onLeaveToday || 1} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Faculty</span></div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Substitutes Assigned</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Leave Ledger</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: (data?.stats?.pendingLeaveRequests || 0) > 0 ? '#b91c1c' : '#16a34a', marginTop: '6px' }}>
              {data?.stats?.pendingLeaveRequests || 2} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Requests</span>
            </div>
            <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>Requires Principal sign-off</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('directory')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'directory' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'directory' ? '#0284c7' : '#64748b',
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
              borderBottom: activeTab === 'attendance' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'attendance' ? '#0284c7' : '#64748b',
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
              borderBottom: activeTab === 'leaves' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'leaves' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Briefcase size={16} />
            <span>Leave Requests ({data?.leaveRequests?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'payroll' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'payroll' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Payroll & Salary Slips</span>
          </button>
        </div>

        {/* TAB 1: DIRECTORY */}
        {activeTab === 'directory' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search faculty by name, department, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['ALL', 'Physics', 'Mathematics', 'English', 'Computer', 'Science'].map((deptItem) => (
                  <button
                    key={deptItem}
                    onClick={() => setSelectedDept(deptItem)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: selectedDept === deptItem ? '#0284c7' : '#e2e8f0',
                      backgroundColor: selectedDept === deptItem ? '#f0f9ff' : '#ffffff',
                      color: selectedDept === deptItem ? '#0284c7' : '#475569',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {deptItem}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                      <th style={{ padding: '12px 16px' }}>Employee ID</th>
                      <th style={{ padding: '12px 16px' }}>Staff Name</th>
                      <th style={{ padding: '12px 16px' }}>Designation & Department</th>
                      <th style={{ padding: '12px 16px' }}>Qualifications</th>
                      <th style={{ padding: '12px 16px' }}>Contact Info</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((st: any) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                          {st.empId}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Joined: {st.joiningDate}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#0c4a6e' }}>{st.designation}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{st.department}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {st.qualifications}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '12px', color: '#334155' }}>{st.email}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{st.phone}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: st.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9',
                              color: st.status === 'ACTIVE' ? '#047857' : '#64748b',
                            }}
                          >
                            {st.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedStaffForSlip(st)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#0284c7',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Salary Slip
                          </button>
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
                  {(data?.staff || []).map((st: any) => (
                    <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{st.name}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{st.designation}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{st.punchInTime}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{st.punchOutTime}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor:
                              st.todayAttendance === 'PRESENT'
                                ? '#ecfdf5'
                                : st.todayAttendance === 'ON_LEAVE'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              st.todayAttendance === 'PRESENT'
                                ? '#047857'
                                : st.todayAttendance === 'ON_LEAVE'
                                ? '#b91c1c'
                                : '#b45309',
                          }}
                        >
                          {st.todayAttendance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LEAVES */}
        {activeTab === 'leaves' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(data?.leaveRequests || []).length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#64748b' }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 600 }}>All faculty leave applications have been reviewed.</p>
              </div>
            ) : (
              (data?.leaveRequests || []).map((leave: any) => (
                <div
                  key={leave.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{leave.staffName}</h4>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f0f9ff', color: '#0369a1' }}>
                        {leave.leaveType.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '8px' }}>
                      {leave.designation} • Dates: <strong>{leave.from}</strong> to <strong>{leave.to}</strong> ({leave.days} Days)
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155' }}>
                      Reason: <em>&ldquo;{leave.reason}&rdquo;</em>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleApproveLeave(leave.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve Leave</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PAYROLL */}
        {activeTab === 'payroll' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Monthly Salary Ledger</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>EPF & TDS compliant disbursement register for academic staff</p>
              </div>
              <button
                onClick={() => alert('Exporting full institutional payroll CSV...')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} />
                <span>Export Bank Transfer CSV</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                    <th style={{ padding: '12px 16px' }}>Staff Name</th>
                    <th style={{ padding: '12px 16px' }}>Designation</th>
                    <th style={{ padding: '12px 16px' }}>Basic Pay</th>
                    <th style={{ padding: '12px 16px' }}>Allowances (HRA/DA)</th>
                    <th style={{ padding: '12px 16px' }}>Deductions (PF/TDS)</th>
                    <th style={{ padding: '12px 16px' }}>Net Disbursement</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.staff || []).map((st: any) => (
                    <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{st.name}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{st.designation}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>₹{st.basicSalary.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#16a34a' }}>+ ₹14,500</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#b91c1c' }}>- ₹5,000</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#0c4a6e' }}>
                        ₹{st.netSalary.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedStaffForSlip(st)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#0284c7',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: ADD STAFF */}
        {showAddStaffModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Add Faculty or Staff Member</h3>
                <button onClick={() => setShowAddStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateStaff}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Kavita"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Joshi"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Official Email</label>
                    <input
                      type="email"
                      required
                      placeholder="kavita@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98112 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Department</label>
                    <input
                      type="text"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Highest Qualifications</label>
                  <input
                    type="text"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="e.g. M.Sc. Physics, B.Ed., NET Qualified"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAddStaffModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                    Save Staff Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SALARY SLIP PREVIEW */}
        {selectedStaffForSlip && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '540px', width: '100%', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0c4a6e', margin: '0 0 2px' }}>Salary Statement / Pay Slip</h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>For Month of September 2026</div>
                </div>
                <button onClick={() => setSelectedStaffForSlip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong>Employee:</strong> {selectedStaffForSlip.name}</div>
                  <div><strong>ID:</strong> {selectedStaffForSlip.empId}</div>
                  <div><strong>Designation:</strong> {selectedStaffForSlip.designation}</div>
                  <div><strong>Department:</strong> {selectedStaffForSlip.department}</div>
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#f1f5f9', padding: '8px 12px', fontWeight: 700, color: '#334155' }}>
                  <div>Earnings</div>
                  <div style={{ textAlign: 'right' }}>Deductions</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>Basic Pay: ₹{selectedStaffForSlip.basicSalary.toLocaleString('en-IN')}</div>
                  <div style={{ textAlign: 'right' }}>Provident Fund (EPF): ₹3,500</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>Dearness Allowance (DA): ₹8,500</div>
                  <div style={{ textAlign: 'right' }}>Tax Deducted at Source (TDS): ₹1,500</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>House Rent Allowance (HRA): ₹6,000</div>
                  <div style={{ textAlign: 'right' }}>-</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 12px', backgroundColor: '#f8fafc', fontWeight: 800, color: '#0c4a6e' }}>
                  <div>Total Gross: ₹{(selectedStaffForSlip.basicSalary + 14500).toLocaleString('en-IN')}</div>
                  <div style={{ textAlign: 'right', color: '#16a34a' }}>Net Disbursed: ₹{selectedStaffForSlip.netSalary.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => alert('Printing payslip...')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #0284c7',
                    backgroundColor: '#ffffff',
                    color: '#0284c7',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Print Payslip
                </button>
                <button
                  onClick={() => setSelectedStaffForSlip(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
