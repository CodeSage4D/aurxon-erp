'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  ShieldCheck,
  Award,
  Calendar,
  Clock,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function SchoolLicensePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [licenseData, setLicenseData] = useState<any>(null);
  const [showApplyKeyModal, setShowApplyKeyModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [activationKey, setActivationKey] = useState('');
  const [submittingKey, setSubmittingKey] = useState(false);
  const [submittingRenewal, setSubmittingRenewal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [meRes, licRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/school/license'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (licRes.ok) {
          const licJson = await licRes.json();
          setLicenseData(licJson.license);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleApplyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKey || submittingKey) return;

    setSubmittingKey(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await fetch('/api/v1/school/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPLY_KEY', activationKey }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg(json.message);
        setShowApplyKeyModal(false);
        setActivationKey('');
        // Reload license
        const refreshed = await fetch('/api/v1/school/license');
        if (refreshed.ok) {
          const rJson = await refreshed.json();
          setLicenseData(rJson.license);
        }
      } else {
        setErrorMsg(json.error || 'Invalid activation key');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to apply key');
    } finally {
      setSubmittingKey(false);
    }
  };

  const handleRequestRenewal = async () => {
    setSubmittingRenewal(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/school/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REQUEST_RENEWAL' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg(json.message);
        setShowRenewalModal(false);
      } else {
        setErrorMsg(json.error || 'Failed to submit renewal request');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error occurred');
    } finally {
      setSubmittingRenewal(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e0f2fe', borderTopColor: '#2270AF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const lic = licenseData || {
    tier: 'PROFESSIONAL',
    key: 'AURXON-LIC-DEMO-2026',
    validUntil: '2027-03-31',
    daysRemaining: 198,
    status: 'ACTIVE',
    usage: {
      students: { current: 120, max: 1500, percentage: 8 },
      staff: { current: 14, max: 120, percentage: 12 },
      campuses: { current: 1, max: 3, percentage: 33 },
    },
    features: [
      'Enterprise RBAC & Scoped Responsibilities',
      'Automated Employee ID & Digital QR Verification',
      'Biometric Machine Integration & Real-time Attendance',
      'Four-Eyes Administrative Approval Workflows',
    ],
  };

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          <Link href="/dashboard" style={{ color: '#2270AF', textDecoration: 'none', fontWeight: 600 }}>
            Workspace
          </Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Institutional Licensing & Renewal</span>
        </div>

        {/* Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Institutional License & Quotas
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0' }}>
              AURXON Cloud OS subscription tier, seat quotas, validity status and renewal management
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowApplyKeyModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#FFFFFF',
                color: '#192D55',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <KeyRound size={15} />
              <span>Apply Activation Key</span>
            </button>

            <button
              onClick={() => setShowRenewalModal(true)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2270AF 0%, #9E3BB3 100%)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(34, 112, 175, 0.25)',
              }}
            >
              <RefreshCw size={15} />
              <span>Request License Renewal</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* License Hero Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #192D55 0%, #2270AF 60%, #9E3BB3 100%)',
            borderRadius: '16px',
            padding: '28px',
            color: '#FFFFFF',
            marginBottom: '28px',
            boxShadow: '0 20px 40px -10px rgba(25, 45, 85, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, marginBottom: '12px' }}>
              <Sparkles size={13} color="#F7E223" />
              <span>ACTIVE COMMERCIAL SUBSCRIPTION</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              AURXON {lic.tier} Edition
            </h2>
            <div style={{ fontSize: '13px', color: '#EAF5FC', opacity: 0.9 }}>
              Licensed to <strong>{user.organizationName}</strong>
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#F7E223', marginTop: '8px' }}>
              License Key: {lic.key}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '16px 22px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#EAF5FC', textTransform: 'uppercase', fontWeight: 600 }}>
              Validity Remaining
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
              {lic.daysRemaining} <span style={{ fontSize: '14px', fontWeight: 500 }}>Days</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#F7E223', marginTop: '2px' }}>
              Expires: {new Date(lic.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Live Quotas Grid */}
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
          Live Institutional Resource Quotas
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Students Quota */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EAF5FC', color: '#2270AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Student Enrolment</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Active Pupil Capacity</div>
                </div>
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#2270AF' }}>
                {lic.usage.students.percentage}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${lic.usage.students.percentage}%`, height: '100%', backgroundColor: '#2270AF' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
              <span>{lic.usage.students.current} Enrolled</span>
              <span>{lic.usage.students.max} Quota Cap</span>
            </div>
          </div>

          {/* Staff Quota */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f5f3ff', color: '#9E3BB3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Faculty & Staff Seats</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>HR Employee Profiles</div>
                </div>
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#9E3BB3' }}>
                {lic.usage.staff.percentage}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${lic.usage.staff.percentage}%`, height: '100%', backgroundColor: '#9E3BB3' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
              <span>{lic.usage.staff.current} Members</span>
              <span>{lic.usage.staff.max} Quota Cap</span>
            </div>
          </div>

          {/* Campuses Quota */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Physical Campuses</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Multi-Branch Facilities</div>
                </div>
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#16a34a' }}>
                {lic.usage.campuses.percentage}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${lic.usage.campuses.percentage}%`, height: '100%', backgroundColor: '#16a34a' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
              <span>{lic.usage.campuses.current} Campus</span>
              <span>{lic.usage.campuses.max} Max Allowed</span>
            </div>
          </div>
        </div>

        {/* Included Features Checklist */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
            Enterprise Entitlements & Platform Modules
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {(lic.features || []).map((feat: string, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL: APPLY KEY */}
        {showApplyKeyModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setShowApplyKeyModal(false)}
          >
            <form
              onSubmit={handleApplyKey}
              style={{
                width: '100%',
                maxWidth: '460px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Apply Activation Key
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px' }}>
                Enter the license key dispatched by your AURXON Enterprise Account Executive.
              </p>

              <input
                type="text"
                required
                placeholder="e.g. AURXON-LIC-DPS-2026-X89K"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  fontFamily: 'monospace',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyKeyModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingKey}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#2270AF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                >
                  {submittingKey ? 'Verifying Key...' : 'Activate & Extend'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: REQUEST RENEWAL */}
        {showRenewalModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setShowRenewalModal(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '28px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Confirm Renewal Request
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
                This will submit an automated renewal request to AURXON HQ for <strong>{user.organizationName}</strong>. An updated proforma invoice and new activation key will be issued to <strong>{user.email}</strong>.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingRenewal}
                  onClick={handleRequestRenewal}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#9E3BB3', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                >
                  {submittingRenewal ? 'Submitting...' : 'Submit Official Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
