'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  School,
  Building2,
  Eye,
  EyeOff,
  Search,
  Users,
  GraduationCap,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'staff' | 'student'>('staff');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your official email / username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      // Server-determined role routing
      if (data.user?.role === 'SUPER_ADMIN') {
        router.push('/aurxon');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Network error connecting to authentication server.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 100% 55% at 50% 0%, #dbeafe 0%, #edf6fd 35%, #f8fbfe 70%, #ffffff 100%)',
        color: '#0f172a',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid rgba(186, 230, 253, 0.7)',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          padding: '12px 20px',
          boxShadow: '0 4px 20px -4px rgba(2, 132, 199, 0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '17px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              A
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c4a6e', letterSpacing: '-0.02em' }}>
              AURXON
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/onboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0369a1',
                textDecoration: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(186, 230, 253, 0.9)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              Register Institute
            </Link>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
                textDecoration: 'none',
                padding: '7px 12px',
                borderRadius: '8px',
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Login Main Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ width: '100%', maxWidth: '460px', margin: '0 auto' }}>
          {/* Main Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.92) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(186, 230, 253, 0.85)',
              padding: '36px 32px',
              boxShadow: '0 20px 45px -10px rgba(2, 132, 199, 0.16), 0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 0 #ffffff',
              boxSizing: 'border-box',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  border: '1px solid #7dd3fc',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.12)',
                }}
              >
                <Lock size={22} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Sign In to AURXON
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Sign in to your secure academic workspace
              </p>
            </div>

            {/* Portal Tab Switcher (Staff vs Student/Parent) */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(224, 242, 254, 0.65)',
                border: '1px solid rgba(186, 230, 253, 0.85)',
                borderRadius: '10px',
                padding: '4px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeTab === 'staff' ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)' : 'transparent',
                  color: activeTab === 'staff' ? '#ffffff' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'staff' ? '0 3px 10px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                <Users size={14} />
                <span>Staff & Management</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeTab === 'student' ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)' : 'transparent',
                  color: activeTab === 'student' ? '#ffffff' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'student' ? '0 3px 10px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                <GraduationCap size={14} />
                <span>Student / Parent</span>
              </button>
            </div>

            {/* Quick Demo Credentials Autofill Bar */}
            <div style={{ marginBottom: '18px', padding: '10px 12px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '10px', border: '1px solid rgba(186, 230, 253, 0.8)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Quick Test Role Autofill:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setIdentifier('principal.rkp@dps-society.edu');
                    setPassword('Password@123');
                    setError('');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #7dd3fc',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                    color: '#0369a1',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
                  }}
                >
                  Principal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setIdentifier('teacher.math@dps-society.edu');
                    setPassword('Password@123');
                    setError('');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #7dd3fc',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                    color: '#0369a1',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
                  }}
                >
                  Faculty
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setIdentifier('accountant@dps-society.edu');
                    setPassword('Password@123');
                    setError('');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #7dd3fc',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                    color: '#0369a1',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
                  }}
                >
                  Accountant
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('student');
                    setIdentifier('student.aarav@dps-society.edu');
                    setPassword('Password@123');
                    setError('');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #86efac',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                    color: '#166534',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(22, 101, 52, 0.08)',
                  }}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setIdentifier('superadmin@aurxon.io');
                    setPassword('Password@123');
                    setError('');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    color: '#334155',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  HQ Admin
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: '18px',
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
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  {activeTab === 'staff' ? 'Official Email or Employee ID' : 'Student Enrollment No. or Parent Email'}
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
                    placeholder={activeTab === 'staff' ? 'e.g. principal@dps-society.edu' : 'e.g. student@school.edu'}
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

              <div style={{ marginBottom: '16px' }}>
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
                    placeholder="Enter password"
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

              {/* Remember Me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe" style={{ fontSize: '12.5px', color: '#64748b', cursor: 'pointer' }}>
                  Remember me on this browser
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 50%, #1e40af 100%)',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.38), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 150ms ease',
                }}
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

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
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '12.5px',
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Powered by <strong>AURXON Education OS</strong></span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/onboard" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
              Register Institution
            </Link>
            <span>•</span>
            <Link href="/aurxon" style={{ color: '#64748b', textDecoration: 'none' }}>
              Platform Operations
            </Link>
            <span>•</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
