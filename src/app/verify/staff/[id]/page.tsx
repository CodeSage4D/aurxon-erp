'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Award,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Lock,
} from 'lucide-react';

export default function StaffPublicVerificationPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyBadge() {
      try {
        const res = await fetch(`/api/v1/verify/staff/${encodeURIComponent(params.id)}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || 'Credential record not found or revoked');
        } else {
          setData(json.credential);
        }
      } catch (err: any) {
        setError('Failed to reach AURXON institutional verification network');
      } finally {
        setLoading(false);
      }
    }
    verifyBadge();
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '45px', height: '45px', border: '3px solid #e0f2fe', borderTopColor: '#2270AF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#192D55' }}>
            Verifying Institutional Credential via AURXON Trust Network...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
            textAlign: 'center',
            border: '1px solid #fee2e2',
          }}
        >
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', margin: '0 0 8px' }}>
            Credential Verification Failed
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 24px' }}>
            {error || 'This QR Code does not match an active faculty record on AURXON ERP.'}
          </p>
          <Link
            href="/"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#192D55',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Visit Institutional Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '40px 20px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Verification Success Header Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 45px -12px rgba(25, 45, 85, 0.2)',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
          }}
        >
          {/* Top Banner with Official Gradient */}
          <div
            style={{
              background: 'linear-gradient(135deg, #192D55 0%, #2270AF 60%, #9E3BB3 100%)',
              padding: '24px 28px',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {data.institution.schoolLogo ? (
                <img
                  src={data.institution.schoolLogo}
                  alt={data.institution.schoolName}
                  style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFFFFF', color: '#192D55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800 }}>
                  🏫
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                  {data.institution.schoolName}
                </h1>
                <p style={{ fontSize: '12px', color: '#EAF5FC', margin: '2px 0 0' }}>
                  {data.institution.campusName} • {data.institution.affiliationBoard} Board
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(22, 163, 74, 0.2)',
                border: '1px solid #22c55e',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={15} color="#86efac" />
              <span>OFFICIALLY VERIFIED</span>
            </div>
          </div>

          {/* Staff Details Section */}
          <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  border: '3px solid #2270AF',
                  backgroundColor: '#EAF5FC',
                  color: '#2270AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(34, 112, 175, 0.2)',
                  flexShrink: 0,
                }}
              >
                {data.staff.fullName?.charAt(0) || 'F'}
              </div>

              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {data.staff.fullName}
                </h2>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#2270AF', marginTop: '4px' }}>
                  {data.staff.designation}
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  Department of {data.staff.department}
                </div>
              </div>
            </div>

            {/* Grid Attributes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Employee Identification ID
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {data.staff.employeeId}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Employment Status
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                  ACTIVE & ENGAGED
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Tenure / Joining Date
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {data.staff.joiningDate}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Employment Type
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {data.staff.employmentType?.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Active Academic Roles */}
            {data.activeRoles && data.activeRoles.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', margin: '0 0 10px', textTransform: 'uppercase' }}>
                  Active Academic Roles & Scoped Responsibilities
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.activeRoles.map((role: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#EAF5FC',
                        border: '1px solid #bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <Award size={16} color="#0284c7" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0c4a6e' }}>
                        {role.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tamper-Proof Cryptographic Signature */}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  DIGITAL SECURITY SEAL
                </div>
                <div style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#9E3BB3', fontWeight: 700, marginTop: '2px' }}>
                  {data.digitalSignature}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Verified Timestamp
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                  {new Date(data.verifiedTimestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '11.5px' }}>
          Verified by AURXON Sovereign Multi-Tenant Educational Operating System
        </div>
      </div>
    </div>
  );
}
