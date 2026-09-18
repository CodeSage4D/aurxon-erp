'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  Award,
  Calendar,
  RotateCw,
} from 'lucide-react';

interface DigitalStaffIdCardProps {
  staff: {
    id: string;
    employeeId: string;
    name: string;
    firstName?: string;
    lastName?: string;
    designation: string;
    department: string;
    employmentType?: string;
    joiningDate?: string;
    bloodGroup?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string | null;
    qrCodeDataUrl?: string | null;
    responsibilities?: Array<{ title: string; responsibilityType: string }>;
  };
  organizationName?: string;
  institutionName?: string;
  logoUrl?: string | null;
}

export default function DigitalStaffIdCard({
  staff,
  organizationName = 'Delhi Public School Society',
  institutionName = 'Senior Secondary Branch',
  logoUrl,
}: DigitalStaffIdCardProps) {
  const [side, setSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [copied, setCopied] = useState(false);

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/staff/${staff.employeeId}`
    : `/verify/staff/${staff.employeeId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setSide('FRONT')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: side === 'FRONT' ? '#2270AF' : '#f1f5f9',
              color: side === 'FRONT' ? '#FFFFFF' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Front Side</span>
          </button>
          <button
            onClick={() => setSide('BACK')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: side === 'BACK' ? '#2270AF' : '#f1f5f9',
              color: side === 'BACK' ? '#FFFFFF' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Back Side</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopyLink}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
            <span>{copied ? 'Verification Link Copied' : 'Copy Verify URL'}</span>
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#192D55',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Printer size={13} />
            <span>Print Badge</span>
          </button>
        </div>
      </div>

      {/* The Physical Card Canvas (Standard 85.6mm x 53.98mm ratio / CR80 standard) */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          margin: '0 auto',
          borderRadius: '16px',
          boxShadow: '0 20px 35px -10px rgba(25, 45, 85, 0.25), 0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid #e2e8f0',
          position: 'relative',
        }}
      >
        {side === 'FRONT' ? (
          /* ================= FRONT SIDE ================= */
          <div>
            {/* Header with School Crest and Palette */}
            <div
              style={{
                background: 'linear-gradient(135deg, #192D55 0%, #2270AF 60%, #9E3BB3 100%)',
                padding: '16px',
                color: '#FFFFFF',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="School Crest"
                  style={{ width: '40px', height: '40px', objectFit: 'contain', margin: '0 auto 6px', display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
              ) : (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    color: '#192D55',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px',
                    fontWeight: 900,
                    fontSize: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  🏫
                </div>
              )}
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {organizationName}
              </h3>
              <p style={{ fontSize: '10px', color: '#EAF5FC', margin: '2px 0 0', fontWeight: 500, letterSpacing: '0.04em' }}>
                {institutionName} • CBSE AFFILIATED
              </p>
            </div>

            {/* Badge Body */}
            <div style={{ padding: '18px 20px', textAlign: 'center' }}>
              {/* Photo & Hologram Ring */}
              <div style={{ position: 'relative', width: '92px', height: '92px', margin: '0 auto 12px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #2270AF',
                    boxShadow: '0 4px 10px rgba(34, 112, 175, 0.25)',
                    backgroundColor: '#EAF5FC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {staff.avatarUrl ? (
                    <img src={staff.avatarUrl} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#2270AF' }}>
                      {staff.name?.charAt(0) || 'F'}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    backgroundColor: '#16a34a',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FFFFFF',
                  }}
                  title="Digitally Verified Faculty"
                >
                  <ShieldCheck size={14} />
                </div>
              </div>

              {/* Name & Designation */}
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {staff.name}
              </h2>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#2270AF', marginTop: '3px' }}>
                {staff.designation}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                Dept of {staff.department}
              </div>

              {/* Auto-Generated Employee ID Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#EAF5FC',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  marginTop: '10px',
                  border: '1px solid #bae6fd',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>ID:</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0c4a6e', letterSpacing: '0.05em' }}>
                  {staff.employeeId}
                </span>
              </div>

              {/* Scannable High-ECC QR Code Box */}
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                {staff.qrCodeDataUrl ? (
                  <img
                    src={staff.qrCodeDataUrl}
                    alt="Verification QR"
                    style={{ width: '70px', height: '70px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '70px',
                      height: '70px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <QrCode size={30} color="#64748b" />
                  </div>
                )}
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>
                    SCAN TO VERIFY
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                    Instant tamper-proof credential check via AURXON Institutional Network
                  </div>
                  <div style={{ fontSize: '9px', color: '#9E3BB3', fontWeight: 700, marginTop: '4px' }}>
                    aurxon.app/verify
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Band */}
            <div
              style={{
                backgroundColor: '#192D55',
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#EAF5FC',
                fontSize: '9.5px',
                fontWeight: 600,
              }}
            >
              <span>VALID UNTIL: 31 MAR 2027</span>
              <span style={{ color: '#F7E223' }}>OFFICIAL STAFF CREDENTIAL</span>
            </div>
          </div>
        ) : (
          /* ================= BACK SIDE ================= */
          <div>
            <div
              style={{
                backgroundColor: '#192D55',
                padding: '12px 16px',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                textAlign: 'center',
                letterSpacing: '0.05em',
              }}
            >
              INSTITUTIONAL TERMS & DETAILS
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Assigned Responsibilities
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {staff.responsibilities && staff.responsibilities.length > 0
                    ? staff.responsibilities.map((r) => r.title).join(', ')
                    : 'Senior Academic Faculty'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Blood Group
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginTop: '2px' }}>
                    {staff.bloodGroup || 'O+'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Employment Type
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {staff.employmentType || 'Permanent Full-Time'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Emergency Helpline
                </div>
                <div style={{ fontSize: '11.5px', color: '#0f172a', marginTop: '2px' }}>
                  Campus Security: +91 (011) 4987-0000 / Ext. 102
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '9.5px',
                  color: '#475569',
                  lineHeight: 1.4,
                  marginBottom: '16px',
                }}
              >
                This card remains the property of {organizationName}. If found, please return to the Principal&apos;s Administrative Office or drop in any post box.
              </div>

              {/* Digital Signature and Seal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontFamily: 'cursive', color: '#192D55', fontWeight: 700 }}>
                    Sunita Verma
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', borderTop: '1px solid #94a3b8', paddingTop: '2px' }}>
                    Academic Director
                  </div>
                </div>

                <div
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    border: '1.5px dashed #9E3BB3',
                    color: '#9E3BB3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '7.5px',
                    fontWeight: 800,
                    textAlign: 'center',
                    transform: 'rotate(-12deg)',
                  }}
                >
                  SEAL<br />AFFIXED
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontFamily: 'cursive', color: '#192D55', fontWeight: 700 }}>
                    R. Chandra
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', borderTop: '1px solid #94a3b8', paddingTop: '2px' }}>
                    Cardholder Sign
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f1f5f9',
                padding: '8px 16px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '9px',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              Powered by AURXON Cloud Operating System
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
