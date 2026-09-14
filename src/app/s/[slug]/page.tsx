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
  Calendar,
  Check,
  Copy,
  ChevronRight,
  BookOpen,
  Award,
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
        backgroundColor: '#f8fbfe',
        backgroundImage: 'radial-gradient(ellipse 100% 50% at 50% -10%, #dbeafe 0%, #edf6fd 30%, #f8fbfe 65%, #ffffff 100%)',
        color: '#0f172a',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Institutional Bar */}
      <header
        style={{
          borderBottom: '1px solid rgba(186, 230, 253, 0.75)',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
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
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
              }}
            >
              {portal?.name ? portal.name.charAt(0).toUpperCase() : <School size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {portal?.name || 'School ERP Portal'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                  }}
                >
                  {portal?.institutions?.[0]?.board || 'CBSE'} AFFILIATED
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {portal?.institutions?.[0]?.city || 'India'} • Session:{' '}
                <strong>{portal?.institutions?.[0]?.currentSession || '2026-2027'}</strong>
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
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Link Copied' : `/s/${slug}`}</span>
            </button>
            <Link
              href="/"
              style={{
                fontSize: '13px',
                color: '#0284c7',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Change School
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
                  border: '3px solid #e0f2fe',
                  borderTopColor: '#0284c7',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0369a1' }}>
                Resolving Institutional Workspace [{slug}]...
              </div>
            </div>
          ) : error || !portal ? (
            /* Safe Not-Found State */
            <div
              style={{
                maxWidth: '560px',
                margin: '40px auto',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '36px',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0',
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
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Organization Workspace Not Found
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
                No active educational organization is registered under the identifier <strong>&quot;{slug}&quot;</strong>.
                Please search for your school on the main portal or verify your direct link.
              </p>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                <span>Find Your Organization</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            /* Clean Institutional Two-Column Layout */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '40px',
                alignItems: 'start',
              }}
            >
              {/* LEFT COLUMN: School Identity & Indian Academic Standards */}
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#f1f5f9',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '12px',
                    }}
                  >
                    <Building2 size={14} color="#0284c7" />
                    <span>Official Institutional Portal</span>
                  </div>
                  <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                    {portal.name}
                  </h1>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                    Centralized Academic & Administrative Workspace for faculty, administrative officers, management,
                    and students.
                  </p>
                </div>

                {/* Regulatory Highlights Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid rgba(186, 230, 253, 0.8)',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      <CheckCircle2 size={15} color="#0284c7" />
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
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid rgba(186, 230, 253, 0.8)',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      <CheckCircle2 size={15} color="#0284c7" />
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
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid rgba(186, 230, 253, 0.8)',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      <CheckCircle2 size={15} color="#0284c7" />
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
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid rgba(186, 230, 253, 0.8)',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      <CheckCircle2 size={15} color="#0284c7" />
                      <span>Quarterly Fee Ledgers</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}>
                      Indian financial year installment tracking, payment receipts, and real-time dues reports.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Institutional Login Card (Metallic Glacier, Accessible, High Contrast) */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '36px 32px',
                  border: '1px solid rgba(186, 230, 253, 0.85)',
                  boxShadow: '0 20px 45px -12px rgba(2, 132, 199, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
                }}
              >
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#f0f9ff',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    <Lock size={22} />
                  </div>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                    Welcome Back
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Sign in to your secure academic workspace
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
                  {/* Campus / Branch Selector if multiple */}
                  {portal.institutions?.[0]?.branches && portal.institutions[0].branches.length > 1 && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
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
                          backgroundColor: '#ffffff',
                          fontSize: '13.5px',
                          color: '#0f172a',
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
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Official Email, Employee ID or Username
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={16}
                        color="#94a3b8"
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
                          backgroundColor: '#ffffff',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Password Input with Show/Hide Toggle */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                        Password
                      </label>
                      <span style={{ fontSize: '12px', color: '#0284c7', cursor: 'pointer' }}>
                        Forgot password?
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        size={16}
                        color="#94a3b8"
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
                          backgroundColor: '#ffffff',
                          fontSize: '13.5px',
                          color: '#0f172a',
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
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 50%, #1e40af 100%)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: submitting ? 0.7 : 1,
                      boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.4)',
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
                  <ShieldCheck size={14} color="#0284c7" />
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
          borderTop: '1px solid rgba(186, 230, 253, 0.6)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '12.5px',
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Powered by <strong>AURXON Education OS</strong></span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Help Center</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
