'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import {
  Bell,
  PlusCircle,
  Calendar,
  AlertCircle,
  Users,
} from 'lucide-react';

export default function CommunicationPage() {
  const [user, setUser] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // New notice drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    priority: 'NORMAL',
  });

  const loadNotices = async () => {
    try {
      const res = await fetch('/api/v1/communication');
      if (res.ok) {
        const json = await res.json();
        setAnnouncements(json.announcements || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, comRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/communication'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        }

        if (comRes.ok) {
          const comJson = await comRes.json();
          setAnnouncements(comJson.announcements || []);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setDrawerOpen(false);
        setFormData({
          title: '',
          content: '',
          targetAudience: 'ALL',
          priority: 'NORMAL',
        });
        await loadNotices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotices = announcements.filter((a) => {
    if (audienceFilter === 'ALL') return true;
    return a.targetAudience === audienceFilter;
  });

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Noticeboard & Communication Hub...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Institutional Noticeboard & Bulletins</h1>
            <p className="page-subtitle">
              Broadcast critical circulars, academic notifications, and parent-teacher updates with scoped audiences
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
            <PlusCircle size={16} /> Broadcast Circular / Notice
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          {[
            { label: 'All Notices', value: 'ALL' },
            { label: 'For Parents', value: 'PARENTS' },
            { label: 'For Students', value: 'STUDENTS' },
            { label: 'For Teachers', value: 'TEACHERS' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setAudienceFilter(item.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-default)',
                backgroundColor: audienceFilter === item.value ? 'var(--primary)' : 'var(--surface-card)',
                color: audienceFilter === item.value ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Notices Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant={notice.priority === 'URGENT' ? 'danger' : 'info'}>
                    {notice.priority}
                  </Badge>
                  <Badge variant="neutral">
                    Audience: {notice.targetAudience}
                  </Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Calendar size={13} />
                  <span>{new Date(notice.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 10px' }}>
                {notice.title}
              </h2>

              <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6', margin: 0 }}>
                {notice.content}
              </p>
            </div>
          ))}
        </div>

        {/* Broadcast Drawer */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Broadcast Announcement"
          subtitle="Publish institutional circular to students, faculty, or parents"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateAnnouncement}
                disabled={submitting}
              >
                {submitting ? 'Publishing...' : 'Publish Notice'}
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateAnnouncement}>
            <div className="form-group">
              <label className="form-label">Notice Title *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Winter Break Schedule and Term Assessments"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Target Audience *</label>
                <select
                  className="form-select"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                >
                  <option value="ALL">All Campus Community</option>
                  <option value="PARENTS">Parents Only</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="TEACHERS">Teaching Staff Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level *</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="URGENT">Urgent Circular</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notice Circular Content *</label>
              <textarea
                required
                className="form-textarea"
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter complete circular text with dates, instructions, and contacts"
              />
            </div>
          </form>
        </Drawer>
      </div>
    </AppShell>
  );
}
