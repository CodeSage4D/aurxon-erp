'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Badge from '@/components/ui/Badge';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [roster, setRoster] = useState<any[]>([]);
  const [isMarked, setIsMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const loadAttendance = async (secId: string, date: string) => {
    if (!secId) return;
    try {
      const res = await fetch(`/api/v1/attendance?sectionId=${secId}&date=${date}`);
      if (res.ok) {
        const json = await res.json();
        setRoster(json.attendanceList || []);
        setIsMarked(json.isMarked);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, clsRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/academics/classes'),
        ]);

        let meJson: any = null;
        if (meRes.ok) {
          meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        let initialSection = '';
        if (clsRes.ok) {
          const clsJson = await clsRes.json();
          const fetchedSections = clsJson.sections || [];
          setSections(fetchedSections);

          if (fetchedSections.length > 0) {
            const assignedSecId = meJson?.user?.assignedSectionIds?.[0];
            const matchingAssigned = assignedSecId
              ? fetchedSections.find((s: any) => s.id === assignedSecId)
              : null;
            initialSection = matchingAssigned ? matchingAssigned.id : fetchedSections[0].id;
            setSelectedSectionId(initialSection);
          }
        }

        if (initialSection) {
          await loadAttendance(initialSection, selectedDate);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [selectedDate]);

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((item) => ({ ...item, status: 'PRESENT' })));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveSuccess('');

    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          date: selectedDate,
          records: roster.map((item) => ({
            studentId: item.studentId,
            status: item.status,
            remarks: item.remarks,
          })),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSaveSuccess(json.message);
        setIsMarked(true);
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;
  const attendanceRate = roster.length > 0 ? ((presentCount / roster.length) * 100).toFixed(0) : '0';

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Daily Attendance Register...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Daily Attendance Register</h1>
            <p className="page-subtitle">
              Mark student presence, record absences with remarks, and maintain permanent audit history
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto' }}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  loadAttendance(selectedSectionId, e.target.value);
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  loadAttendance(e.target.value, selectedDate);
                }}
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.classLevel?.name} - {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-secondary" onClick={handleMarkAllPresent}>
              <Check size={16} /> Mark All Present
            </button>

            <button
              className="btn btn-primary"
              onClick={handleSaveAttendance}
              disabled={saving || roster.length === 0}
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Submit Attendance'}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-text)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Real-Time Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <div style={{ padding: '14px', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Class Strength</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{roster.length} Students</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Present Today</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>{presentCount}</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Absent Today</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{absentCount}</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Late Arrival</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706' }}>{lateCount}</div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Attendance Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: Number(attendanceRate) >= 75 ? '#059669' : '#dc2626' }}>
              {attendanceRate}%
            </div>
          </div>
        </div>

        {/* Student Attendance Roster Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Roll</th>
                <th>Admission No</th>
                <th>Student Name</th>
                <th style={{ width: '380px' }}>Attendance Status</th>
                <th>Remarks / Reason</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No students found in this section.
                  </td>
                </tr>
              ) : (
                roster.map((student) => (
                  <tr key={student.studentId}>
                    <td style={{ fontWeight: 600 }}>{student.rollNumber || '-'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {student.admissionNumber}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {student.firstName} {student.lastName}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: student.status === 'PRESENT' ? '1px solid #059669' : '1px solid var(--border-subtle)',
                            backgroundColor: student.status === 'PRESENT' ? '#ecfdf5' : 'var(--surface-subtle)',
                            color: student.status === 'PRESENT' ? '#065f46' : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={13} /> Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: student.status === 'ABSENT' ? '1px solid #dc2626' : '1px solid var(--border-subtle)',
                            backgroundColor: student.status === 'ABSENT' ? '#fef2f2' : 'var(--surface-subtle)',
                            color: student.status === 'ABSENT' ? '#991b1b' : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <XCircle size={13} /> Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'LATE')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: student.status === 'LATE' ? '1px solid #d97706' : '1px solid var(--border-subtle)',
                            backgroundColor: student.status === 'LATE' ? '#fffbeb' : 'var(--surface-subtle)',
                            color: student.status === 'LATE' ? '#92400e' : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={13} /> Late
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'LEAVE')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: student.status === 'LEAVE' ? '1px solid #2563eb' : '1px solid var(--border-subtle)',
                            backgroundColor: student.status === 'LEAVE' ? '#eff6ff' : 'var(--surface-subtle)',
                            color: student.status === 'LEAVE' ? '#1e40af' : 'var(--text-muted)',
                          }}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        placeholder="Reason / Remark"
                        value={student.remarks || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRoster((prev) =>
                            prev.map((it) =>
                              it.studentId === student.studentId ? { ...it, remarks: val } : it
                            )
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
