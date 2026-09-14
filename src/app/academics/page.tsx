'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import {
  GraduationCap,
  BookOpen,
  Users,
  PlusCircle,
  Building,
} from 'lucide-react';

export default function AcademicsPage() {
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'classes' | 'courses' | 'subjects'>('classes');
  const [loading, setLoading] = useState(true);

  // Modals/Drawers
  const [classDrawerOpen, setClassDrawerOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('Section A');
  const [roomNumber, setRoomNumber] = useState('');

  const loadData = async () => {
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

      if (clsRes.ok) {
        const clsJson = await clsRes.json();
        setClasses(clsJson.classLevels || []);
        setCourses(clsJson.courses || []);
      }

      if (subRes.ok) {
        const subJson = await subRes.json();
        setSubjects(subJson.subjects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/academics/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: className, sectionName, roomNumber }),
      });

      if (res.ok) {
        setClassDrawerOpen(false);
        setClassName('');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Academic Structure...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Academics & Program Management</h1>
            <p className="page-subtitle">
              Manage school grades, sections, subjects, and coaching batches with faculty assignments
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary" onClick={() => setClassDrawerOpen(true)}>
              <PlusCircle size={16} /> Add Class / Section
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-6)', gap: 'var(--space-4)' }}>
          <button
            onClick={() => setActiveTab('classes')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'classes' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'classes' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'classes' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            School Classes & Sections ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'courses' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'courses' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'courses' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Coaching Programs & Batches ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'subjects' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'subjects' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'subjects' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Curriculum Subjects ({subjects.length})
          </button>
        </div>

        {/* Tab 1: Classes & Sections */}
        {activeTab === 'classes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {classes.map((cls) => (
              <div key={cls.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--primary-light)', borderRadius: '8px', color: 'var(--primary)' }}>
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{cls.name}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Code: {cls.code}</span>
                    </div>
                  </div>
                  <Badge variant="info">{cls.sections?.length || 0} Sections</Badge>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Active Sections:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {cls.sections?.map((sec: any) => (
                      <div
                        key={sec.id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--surface-subtle)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {sec.name} {sec.roomNumber && `(${sec.roomNumber})`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Coaching Programs & Batches */}
        {activeTab === 'courses' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
            {courses.map((course) => (
              <div key={course.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{course.name}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Code: {course.code}</div>
                  </div>
                  <Badge variant="info">{course.targetExam || 'Competitive'}</Badge>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px', lineHeight: '1.4' }}>
                  {course.description || 'Intensive coaching module'}
                </p>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Enrolled Batches:
                  </div>
                  {course.batches?.map((b: any) => (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'var(--surface-subtle)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{b.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>Capacity: {b.maxCapacity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Curriculum Subjects */}
        {activeTab === 'subjects' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Subject Code</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 600 }}>{sub.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{sub.code}</td>
                    <td>
                      <Badge variant={sub.type === 'PRACTICAL' ? 'warning' : 'neutral'}>{sub.type}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Class Drawer */}
        <Drawer
          isOpen={classDrawerOpen}
          onClose={() => setClassDrawerOpen(false)}
          title="Add Class & Section"
          subtitle="Create institutional grade level and assign initial room"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setClassDrawerOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateClass}>
                Create Class
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateClass}>
            <div className="form-group">
              <label className="form-label">Class Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Class 11 Science"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Section Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g. Section A or Section PCM"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Designated Room Number</label>
              <input
                type="text"
                className="form-input"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Room 302"
              />
            </div>
          </form>
        </Drawer>
      </div>
    </AppShell>
  );
}
