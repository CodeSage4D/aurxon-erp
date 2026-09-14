'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Drawer from '@/components/ui/Drawer';
import {
  Calendar,
  Clock,
  User as UserIcon,
  PlusCircle,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

const PERIODS = [1, 2, 3, 4, 5, 6];

export default function TimetablePage() {
  const [user, setUser] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState('');
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 1,
    periodNumber: 1,
    startTime: '08:00',
    endTime: '08:45',
    subjectId: '',
    teacherId: '',
    roomNumber: 'Room 204',
  });

  const loadSlots = async (sectionId: string) => {
    if (!sectionId) return;
    try {
      const res = await fetch(`/api/v1/academics/timetable?sectionId=${sectionId}`);
      if (res.ok) {
        const json = await res.json();
        setSlots(json.slots || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, clsRes, subRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/academics/classes'),
          fetch('/api/v1/academics/subjects'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        }

        let initialSection = '';
        if (clsRes.ok) {
          const clsJson = await clsRes.json();
          setSections(clsJson.sections || []);
          setBatches(clsJson.batches || []);
          if (clsJson.sections?.length > 0) {
            initialSection = clsJson.sections[0].id;
            setSelectedSectionId(initialSection);
          }
        }

        if (subRes.ok) {
          const subJson = await subRes.json();
          setSubjects(subJson.subjects || []);
          setTeachers(subJson.teachers || []);
          if (subJson.subjects?.length > 0) {
            setSlotForm((prev) => ({
              ...prev,
              subjectId: subJson.subjects[0].id,
              teacherId: subJson.teachers?.[0]?.id || '',
            }));
          }
        }

        if (initialSection) {
          await loadSlots(initialSection);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    loadSlots(sectionId);
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setConflictError('');

    try {
      const res = await fetch('/api/v1/academics/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...slotForm,
          sectionId: selectedSectionId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setConflictError(json.error || 'Failed to schedule period');
        setSubmitting(false);
        return;
      }

      setDrawerOpen(false);
      await loadSlots(selectedSectionId);
    } catch {
      setConflictError('Network error while saving timetable');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Timetable Engine...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Timetable & Schedule Matrix</h1>
            <p className="page-subtitle">
              Class period allocation with automated teacher and room conflict detection
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Class / Section:</span>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={selectedSectionId}
                onChange={(e) => handleSectionChange(e.target.value)}
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.classLevel?.name} - {sec.name}
                  </option>
                ))}
              </select>
            </div>

            {(user.role === 'PRINCIPAL' || user.role === 'ORG_ADMIN') && (
              <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
                <PlusCircle size={16} /> Schedule Period
              </button>
            )}
          </div>
        </div>

        {/* Timetable Weekly Matrix Grid */}
        <div className="table-responsive">
          <table className="data-table" style={{ minWidth: '880px' }}>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Day</th>
                {PERIODS.map((p) => (
                  <th key={p} style={{ textAlign: 'center' }}>
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.slice(0, 5).map((day) => (
                <tr key={day.id}>
                  <td style={{ fontWeight: 700, backgroundColor: 'var(--surface-subtle)' }}>
                    {day.label}
                  </td>
                  {PERIODS.map((period) => {
                    const slot = slots.find(
                      (s) => s.dayOfWeek === day.id && s.periodNumber === period
                    );
                    return (
                      <td key={period} style={{ padding: '8px', verticalAlign: 'top' }}>
                        {slot ? (
                          <div
                            style={{
                              padding: '10px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--primary-light)',
                              border: '1px solid #99f6e4',
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary-dark)', marginBottom: '4px' }}>
                              {slot.subject.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-main)', marginBottom: '2px' }}>
                              <UserIcon size={12} color="var(--primary)" />
                              <span>{slot.teacher.firstName} {slot.teacher.lastName}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                              <span>{slot.roomNumber || 'Classroom'}</span>
                              <span>{slot.startTime}-{slot.endTime}</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              height: '76px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px dashed var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-subtle)',
                              fontSize: '11px',
                            }}
                          >
                            Free Period
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* -------------------------------------------------------------
            SCHEDULE LECTURE PERIOD DRAWER WITH CONFLICT DETECTION
           ------------------------------------------------------------- */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Schedule Class Period"
          subtitle="Assign subject, faculty, and room with real-time conflict checking"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateSlot}
                disabled={submitting}
              >
                {submitting ? 'Verifying & Saving...' : 'Confirm Period Allocation'}
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateSlot}>
            {conflictError && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger-text)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{conflictError}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Day of Week *</label>
                <select
                  className="form-select"
                  value={slotForm.dayOfWeek}
                  onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Period Number *</label>
                <select
                  className="form-select"
                  value={slotForm.periodNumber}
                  onChange={(e) => setSlotForm({ ...slotForm, periodNumber: Number(e.target.value) })}
                >
                  {PERIODS.map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="time"
                  required
                  className="form-input"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  type="time"
                  required
                  className="form-input"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select
                className="form-select"
                value={slotForm.subjectId}
                onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Faculty / Teacher *</label>
              <select
                className="form-select"
                value={slotForm.teacherId}
                onChange={(e) => setSlotForm({ ...slotForm, teacherId: e.target.value })}
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room / Lab Assignment</label>
              <input
                type="text"
                className="form-input"
                value={slotForm.roomNumber}
                onChange={(e) => setSlotForm({ ...slotForm, roomNumber: e.target.value })}
                placeholder="e.g. Room 204 or Physics Lab"
              />
            </div>
          </form>
        </Drawer>
      </div>
    </AppShell>
  );
}
