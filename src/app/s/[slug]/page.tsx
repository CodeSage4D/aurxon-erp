'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  Copy,
  Search,
} from 'lucide-react';

interface PortalData {
  id: string;
  name: string;
  slug: string;
  code: string;
  logoUrl?: string;
  primaryColor?: string;
  institutions: Array<{
    id: string;
    name: string;
    type: string;
    board: string;
    city: string;
    branches: Array<{ id: string; name: string; code: string; city: string }>;
    currentSession: string;
  }>;
}

export default function SchoolDedicatedPortalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';

  const [loading, setLoading] = useState(true);
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Authentication State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function fetchPortal() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/portal/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.success && data.portal) {
          setPortal(data.portal);
          if (data.portal.institutions?.[0]?.branches?.[0]?.id) {
            setSelectedBranch(data.portal.institutions[0].branches[0].id);
          }
        } else {
          setError(data.error || 'Institution workspace not found');
        }
      } catch (err: any) {
        setError('Network error resolving school workspace');
      } finally {
        setLoading(false);
      }
    }
    fetchPortal();
  }, [slug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setLoginError('Please enter your official email / username and password.');
      return;
    }

    setSubmitting(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setLoginError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setLoginError('Network error connecting to authentication server.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShortLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}/s/${slug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        backgroundImage: 'linear-gradient(135deg, #EAF5FC 0%, #FFFFFF 48%, #F2E8F7 100%)',
        color: '#192D55',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Institutional Bar (Glacier Dark Navy Branding & Pure White Header) */}
      <header
        style={{
          borderBottom: '1px solid rgba(34, 112, 175, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Customer Organization Identity (Dominant) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: portal?.primaryColor || '#2270AF',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(34, 112, 175, 0.25)',
              }}
            >
              {portal?.name ? portal.name.charAt(0).toUpperCase() : <School size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16.5px', fontWeight: 800, color: '#192D55', letterSpacing: '-0.02em' }}>
                  {portal?.name || 'School ERP Portal'}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#EAF5FC',
                    color: '#2270AF',
                    border: '1px solid rgba(34, 112, 175, 0.25)',
                  }}
                >
                  {portal?.institutions?.[0]?.board || 'CBSE'} AFFILIATED
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {portal?.institutions?.[0]?.city || 'India'} • Academic Session:{' '}
                <strong style={{ color: '#192D55' }}>{portal?.institutions?.[0]?.currentSession || '2025-2026'}</strong>
              </div>
            </div>
          </div>

          {/* Quick Actions & Attribution */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={copyShortLink}
              title="Copy direct portal link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(34, 112, 175, 0.25)',
                backgroundColor: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                color: '#192D55',
                cursor: 'pointer',
              }}
            >
              {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Link Copied' : `/s/${slug}`}</span>
            </button>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12.5px',
                color: '#2270AF',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Search size={13} />
              <span>Change Institute</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Portal View */}
      <main style={{ flex: 1, padding: '48px 24px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ padding: '80px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '3px solid #EAF5FC',
                  borderTopColor: '#2270AF',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#192D55' }}>
                Connecting to Institutional Workspace [{slug}]...
              </div>
            </div>
          ) : error || !portal ? (
            /* Safe Not-Found State */
            <div
              style={{
                maxWidth: '540px',
                margin: '40px auto',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '36px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(25, 45, 85, 0.06)',
                border: '1px solid rgba(34, 112, 175, 0.18)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#192D55', marginBottom: '8px' }}>
                Organization Workspace Not Found
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
                No active educational organization is registered under the identifier <strong>&quot;{slug}&quot;</strong>.
                Search for your school on the main portal or verify your direct link.
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                <span>Find Your Organization</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            /* Two-Column Layout (Pure White & Glacier Blue Accents) */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '40px',
                alignItems: 'start',
              }}
            >
              {/* LEFT COLUMN: School Identity & Standards */}
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#EAF5FC',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#2270AF',
                      marginBottom: '12px',
                      border: '1px solid rgba(34, 112, 175, 0.25)',
                    }}
                  >
                    <Building2 size={14} />
                    <span>Official Institutional Portal</span>
                  </div>
                  <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#192D55', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                    {portal.name}
                  </h1>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                    Authoritative Academic & Administrative Control Workspace for faculty, management, students, and parents.
                  </p>
                </div>

                {/* Regulatory Highlights Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(34, 112, 175, 0.2)',
                      boxShadow: '0 2px 8px rgba(25, 45, 85, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#192D55' }}>
                      <CheckCircle2 size={15} color="#2270AF" />
                      <span>CBSE 9-Point Scale</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}>
                      Automated A1–E2 scholastic grade calculation, co-scholastic marks, and report cards.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(34, 112, 175, 0.2)',
                      boxShadow: '0 2px 8px rgba(25, 45, 85, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#192D55' }}>
                      <CheckCircle2 size={15} color="#2270AF" />
                      <span>U-DISE+ Data Sync</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}>
                      Synchronized student master records and faculty registry with national standards.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(34, 112, 175, 0.2)',
                      boxShadow: '0 2px 8px rgba(25, 45, 85, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#192D55' }}>
                      <CheckCircle2 size={15} color="#2270AF" />
                      <span>RTE 25% Quota</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}>
                      Reservation tracking, free student ledger maintenance, and government audit reconciliation.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(34, 112, 175, 0.2)',
                      boxShadow: '0 2px 8px rgba(25, 45, 85, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#192D55' }}>
                      <CheckCircle2 size={15} color="#2270AF" />
                      <span>Quarterly Fee Ledgers</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}>
                      Indian financial year installment tracking, payment receipts, and real-time dues reports.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Institutional Login Card (Pure White Foundation + The Strongest Gradient) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '36px 32px',
                  border: '1px solid rgba(34, 112, 175, 0.2)',
                  boxShadow: '0 16px 40px -10px rgba(25, 45, 85, 0.08)',
                }}
              >
                <div style={{ marginBottom: '22px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#EAF5FC',
                      color: '#2270AF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      border: '1px solid rgba(34, 112, 175, 0.25)',
                    }}
                  >
                    <Lock size={22} />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#192D55', margin: '0 0 4px' }}>
                    Welcome to {portal.name}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Sign in to your authorized academic profile
                  </p>
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Authentication Form */}
                <form onSubmit={handleLogin}>
                  {/* Campus Selector if multiple */}
                  {portal.institutions?.[0]?.branches && portal.institutions[0].branches.length > 1 && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#192D55', marginBottom: '6px' }}>
                        Campus / Branch
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '13.5px',
                          color: '#192D55',
                          outline: 'none',
                        }}
                      >
                        {portal.institutions[0].branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code}) — {b.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Identifier Input */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#192D55', marginBottom: '6px' }}>
                      Official Email, Employee ID or Enrollment No.
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={16}
                        color="#64748b"
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. principal@dps-society.edu"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '13.5px',
                          color: '#192D55',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#192D55' }}>
                        Password
                      </label>
                      <span style={{ fontSize: '12px', color: '#2270AF', cursor: 'pointer' }}>
                        Forgot password?
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        size={16}
                        color="#64748b"
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        style={{
                          width: '100%',
                          padding: '10px 40px 10px 38px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '13.5px',
                          color: '#192D55',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button: Strongest Gradient */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)',
                      color: '#FFFFFF',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: submitting ? 0.7 : 1,
                      boxShadow: '0 4px 14px rgba(34, 112, 175, 0.35)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {submitting ? (
                      <span>Authenticating securely...</span>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Security Notice */}
                <div
                  style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#64748b',
                  }}
                >
                  <ShieldCheck size={14} color="#10b981" />
                  <span>256-Bit Encrypted Multi-Tenant Session</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Institutional Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(34, 112, 175, 0.15)',
          backgroundColor: '#FFFFFF',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '12.5px',
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>
            Powered by <strong style={{ color: '#192D55' }}>AURXON Education OS</strong>
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/login" style={{ color: '#2270AF', textDecoration: 'none' }}>
              Search Another School
            </Link>
            <span>•</span>
            <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>
              Platform Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
