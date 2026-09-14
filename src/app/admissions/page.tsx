'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import {
  PlusCircle,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

const STAGES = [
  'INQUIRY',
  'APPLICATION_SUBMITTED',
  'DOCUMENT_VERIFIED',
  'INTERVIEW_SCHEDULED',
  'APPROVED',
  'ADMITTED',
];

export default function AdmissionsPage() {
  const [user, setUser] = useState<any>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // New inquiry drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    parentName: '',
    phone: '',
    email: '',
    targetClass: 'Class 9',
    source: 'WALK_IN',
    notes: '',
  });

  const loadInquiries = async () => {
    try {
      const res = await fetch('/api/v1/admissions');
      if (res.ok) {
        const json = await res.json();
        setInquiries(json.inquiries || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, inqRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/admissions'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        }

        if (inqRes.ok) {
          const inqJson = await inqRes.json();
          setInquiries(inqJson.inquiries || []);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setDrawerOpen(false);
        setFormData({
          applicantName: '',
          parentName: '',
          phone: '',
          email: '',
          targetClass: 'Class 9',
          source: 'WALK_IN',
          notes: '',
        });
        await loadInquiries();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/v1/admissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await loadInquiries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (selectedStage === 'ALL') return true;
    return inq.status === selectedStage;
  });

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Admissions Pipeline...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admissions & Enrollment Pipeline</h1>
            <p className="page-subtitle">
              Manage prospective inquiries, entrance assessments, document verification, and admission conversion
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
            <PlusCircle size={16} /> New Admission Inquiry
          </button>
        </div>

        {/* Stage Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '12px',
            marginBottom: 'var(--space-6)',
          }}
        >
          <button
            onClick={() => setSelectedStage('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid var(--border-default)',
              backgroundColor: selectedStage === 'ALL' ? 'var(--primary)' : 'var(--surface-card)',
              color: selectedStage === 'ALL' ? '#ffffff' : 'var(--text-main)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            All Inquiries ({inquiries.length})
          </button>
          {STAGES.map((st) => {
            const count = inquiries.filter((i) => i.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setSelectedStage(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid var(--border-default)',
                  backgroundColor: selectedStage === st ? 'var(--primary)' : 'var(--surface-card)',
                  color: selectedStage === st ? '#ffffff' : 'var(--text-main)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {st.replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>

        {/* Inquiries Cards Grid */}
        {filteredInquiries.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No applicants found in this pipeline stage.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {filteredInquiries.map((inq) => (
              <div key={inq.id} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {inq.inquiryNumber}
                  </span>
                  <Badge variant={inq.status === 'ADMITTED' ? 'success' : inq.status === 'APPROVED' ? 'info' : 'warning'}>
                    {inq.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main)' }}>
                  {inq.applicantName}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Target: <strong>{inq.targetClass || inq.targetCourse}</strong> • Source: {inq.source}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                    <span>Guardian: {inq.parentName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Phone size={13} /> {inq.phone}
                  </div>
                  {inq.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Mail size={13} /> {inq.email}
                    </div>
                  )}
                </div>

                {inq.notes && (
                  <div style={{ padding: '8px 10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    &ldquo;{inq.notes}&rdquo;
                  </div>
                )}

                {/* Pipeline Stage Transition Control */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Stage Transition:</span>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                    value={inq.status}
                    onChange={(e) => handleUpdateStatus(inq.id, e.target.value)}
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* -------------------------------------------------------------
            NEW INQUIRY DRAWER
           ------------------------------------------------------------- */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Record Admission Inquiry"
          subtitle="Add prospective student details for entrance workflow"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateInquiry} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Inquiry'}
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateInquiry}>
            <div className="form-group">
              <label className="form-label">Applicant Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.applicantName}
                onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                placeholder="e.g. Meera Saxena"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parent / Guardian Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="e.g. Naveen Saxena"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98111 00000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="parent@example.com"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Target Class / Course</label>
                <select
                  className="form-select"
                  value={formData.targetClass}
                  onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11 Science">Class 11 Science</option>
                  <option value="Class 11 Commerce">Class 11 Commerce</option>
                  <option value="JEE 2-Year Intensive">JEE 2-Year Intensive</option>
                  <option value="NEET Super 30">NEET Super 30</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Inquiry Source</label>
                <select
                  className="form-select"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="WALK_IN">Walk-in Campus Visit</option>
                  <option value="WEBSITE">Website Form</option>
                  <option value="REFERRAL">Parent / Alumni Referral</option>
                  <option value="SOCIAL_MEDIA">Social Media Campaign</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Counselor Notes / Remarks</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Specific subject interests, entrance test preference, or previous school history"
              />
            </div>
          </form>
        </Drawer>
      </div>
    </AppShell>
  );
}
