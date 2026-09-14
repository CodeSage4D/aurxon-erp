'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  MapPin,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';

interface SearchResultOrg {
  name: string;
  slug: string;
  code: string;
  city: string;
  board: string;
  organizationType: string;
  primaryColor?: string;
  campusesCount: number;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgParam = searchParams.get('org');

  // Mode: 'credentials' or 'search-org'
  const [loginMode, setLoginMode] = useState<'credentials' | 'search-org'>('credentials');
  const [activeTab, setActiveTab] = useState<'staff' | 'student'>('staff');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Demo Credentials Modal State
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [copiedDemoEmail, setCopiedDemoEmail] = useState('');

  const fillDemoCredentials = (email: string, pass: string = 'Password@123', tab: 'staff' | 'student' = 'staff') => {
    setIdentifier(email);
    setPassword(pass);
    setActiveTab(tab);
    setDemoModalOpen(false);
    setLoginMode('credentials');
  };

  const copyDemoCreds = (email: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedDemoEmail(email);
      setTimeout(() => setCopiedDemoEmail(''), 2000);
    }
  };

  // Organization Search State
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [searchingOrgs, setSearchingOrgs] = useState(false);
  const [orgResults, setOrgResults] = useState<SearchResultOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<SearchResultOrg | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // If ?org= is provided in URL, pre-fetch organization details
  useEffect(() => {
    if (orgParam) {
      fetch(`/api/v1/portal/${encodeURIComponent(orgParam)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.portal) {
            setSelectedOrg({
              name: data.portal.name,
              slug: data.portal.slug,
              code: data.portal.code,
              city: data.portal.institutions?.[0]?.city || 'India',
              board: data.portal.institutions?.[0]?.board || 'CBSE',
              organizationType: data.portal.institutions?.[0]?.type || 'School',
              primaryColor: data.portal.primaryColor || '#2270AF',
              campusesCount: data.portal.institutions?.[0]?.branches?.length || 1,
            });
          }
        })
        .catch(() => {});
    }
  }, [orgParam]);

  // Live Auto-Predict Search for Organizations
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!orgSearchQuery.trim()) {
      // Load default active institutions
      fetch('/api/v1/portal/search?q=')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setOrgResults(data.results || []);
        })
        .catch(() => {});
      return;
    }

    setSearchingOrgs(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/portal/search?q=${encodeURIComponent(orgSearchQuery.trim())}`);
        const data = await res.json();
        if (data.success) {
          setOrgResults(data.results || []);
        }
      } catch {
        // Network fallback
      } finally {
        setSearchingOrgs(false);
      }
    }, 150);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [orgSearchQuery]);

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
        backgroundColor: '#FFFFFF',
        backgroundImage:
          'linear-gradient(135deg, #EAF5FC 0%, #FFFFFF 48%, #F2E8F7 100%)',
        color: '#192D55',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* -------------------------------------------------------------
          TOP HEADER BAR (Glacier Dark Navy & AURXON Blue)
          ------------------------------------------------------------- */}
      <header
        style={{
          borderBottom: '1px solid rgba(34, 112, 175, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          padding: '12px 24px',
          boxShadow: '0 2px 10px rgba(25, 45, 85, 0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Brand Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(34, 112, 175, 0.3)',
              }}
            >
              A
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#192D55', letterSpacing: '-0.02em' }}>
                AURXON
              </span>
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: '#EAF5FC',
                  color: '#2270AF',
                  border: '1px solid rgba(34, 112, 175, 0.25)',
                }}
              >
                Education OS
              </span>
            </div>
          </Link>

          {/* Right Header Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setDemoModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#9E3BB3',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(158, 59, 179, 0.35)',
                backgroundColor: '#FAF5FF',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Sparkles size={14} />
              <span>Demo Logins</span>
            </button>

            <button
              type="button"
              onClick={() => setLoginMode(loginMode === 'credentials' ? 'search-org' : 'credentials')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#2270AF',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 112, 175, 0.3)',
                backgroundColor: loginMode === 'search-org' ? '#EAF5FC' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Search size={14} />
              <span>{loginMode === 'search-org' ? 'Standard Login' : 'Find Your Institute'}</span>
            </button>

            <Link
              href="/onboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#192D55',
                textDecoration: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#FFFFFF',
              }}
            >
              Register Campus
            </Link>

            <Link
              href="/"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748b',
                textDecoration: 'none',
                padding: '7px 10px',
              }}
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN LOGIN CONTENT AREA (Pure White Foundation + Glacier Blue Accents)
          ------------------------------------------------------------- */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ width: '100%', maxWidth: loginMode === 'search-org' ? '620px' : '480px', margin: '0 auto' }}>
          {/* Main Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid rgba(34, 112, 175, 0.18)',
              padding: '36px 32px',
              boxShadow: '0 16px 40px -10px rgba(25, 45, 85, 0.08), 0 2px 6px rgba(25, 45, 85, 0.03)',
              boxSizing: 'border-box',
            }}
          >
            {/* =========================================================
                MODE 1: ORGANIZATION-BASED SEARCH & DISCOVERY
                ========================================================= */}
            {loginMode === 'search-org' ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
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
                    <Building2 size={22} />
                  </div>
                  <h1 style={{ fontSize: '21px', fontWeight: 800, color: '#192D55', margin: '0 0 6px' }}>
                    Find Your Organization Portal
                  </h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Search for your school, college, or coaching institute to access its dedicated branded ERP.
                  </p>
                </div>

                {/* Search Input Box */}
                <div style={{ position: 'relative', marginBottom: '18px' }}>
                  <Search
                    size={16}
                    color="#64748b"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by institute name, acronym (e.g. DPS, ALLEN), city..."
                    value={orgSearchQuery}
                    onChange={(e) => setOrgSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '10px',
                      border: '1px solid rgba(34, 112, 175, 0.3)',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13.5px',
                      color: '#192D55',
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: '0 2px 6px rgba(25, 45, 85, 0.04)',
                    }}
                  />
                  {orgSearchQuery && (
                    <button
                      onClick={() => setOrgSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Search Results List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
                  {orgResults.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                      <Building2 size={32} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#192D55' }}>
                        No institutions found matching &quot;{orgSearchQuery}&quot;
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Try searching by city (e.g. Indore, Bhopal) or board name.
                      </div>
                    </div>
                  ) : (
                    orgResults.map((org) => (
                      <div
                        key={org.slug}
                        style={{
                          backgroundColor: '#EAF5FC',
                          borderRadius: '12px',
                          border: '1px solid rgba(34, 112, 175, 0.2)',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 120ms ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              backgroundColor: org.primaryColor || '#2270AF',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '16px',
                              flexShrink: 0,
                            }}
                          >
                            {org.name.charAt(0)}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#192D55' }}>{org.name}</span>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontFamily: 'monospace',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: '#FFFFFF',
                                  color: '#2270AF',
                                  border: '1px solid rgba(34, 112, 175, 0.25)',
                                }}
                              >
                                {org.code}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', fontSize: '11.5px', color: '#64748b' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={11} color="#2270AF" /> {org.city}
                              </span>
                              <span>•</span>
                              <span>{org.board || 'CBSE'}</span>
                              <span>•</span>
                              <span>{org.campusesCount || 1} Campuses</span>
                            </div>
                          </div>
                        </div>

                        {/* Action: Open Portal Link */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link
                            href={`/s/${org.slug}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '7px 12px',
                              borderRadius: '6px',
                              background: 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)',
                              color: '#FFFFFF',
                              fontSize: '12px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(34, 112, 175, 0.25)',
                            }}
                          >
                            <span>Open Portal</span>
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setLoginMode('credentials')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2270AF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    ← Back to Standard Username & Password Login
                  </button>
                </div>
              </div>
            ) : (
              /* =========================================================
                 MODE 2: DIRECT CREDENTIALS LOGIN
                 ========================================================= */
              <div>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
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
                  <h1 style={{ fontSize: '21px', fontWeight: 800, color: '#192D55', margin: '0 0 4px' }}>
                    Sign In to AURXON
                  </h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    {selectedOrg
                      ? `Logging into ${selectedOrg.name} (${selectedOrg.city})`
                      : 'Secure multi-tenant academic and institutional access'}
                  </p>
                </div>

                {/* Optional Selected Organization Banner */}
                {selectedOrg && (
                  <div
                    style={{
                      backgroundColor: '#EAF5FC',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(34, 112, 175, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <School size={16} color="#2270AF" />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#192D55' }}>
                          {selectedOrg.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Portal: /s/{selectedOrg.slug}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedOrg(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: 600,
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Tab Switcher: Staff & Faculty vs Student / Parent */}
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: '#EAF5FC',
                    border: '1px solid rgba(34, 112, 175, 0.2)',
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
                      background:
                        activeTab === 'staff'
                          ? 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)'
                          : 'transparent',
                      color: activeTab === 'staff' ? '#FFFFFF' : '#192D55',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: activeTab === 'staff' ? '0 2px 8px rgba(34, 112, 175, 0.3)' : 'none',
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
                      background:
                        activeTab === 'student'
                          ? 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)'
                          : 'transparent',
                      color: activeTab === 'student' ? '#FFFFFF' : '#192D55',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: activeTab === 'student' ? '0 2px 8px rgba(34, 112, 175, 0.3)' : 'none',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <GraduationCap size={14} />
                    <span>Student / Parent</span>
                  </button>
                </div>

                {/* Quick Role Autofill Bar */}
                <div
                  style={{
                    marginBottom: '18px',
                    padding: '10px 12px',
                    backgroundColor: '#EAF5FC',
                    borderRadius: '10px',
                    border: '1px solid rgba(34, 112, 175, 0.2)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#2270AF',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '6px',
                    }}
                  >
                    Quick Role Autofill:
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
                        border: '1px solid rgba(34, 112, 175, 0.3)',
                        backgroundColor: '#FFFFFF',
                        color: '#192D55',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
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
                        border: '1px solid rgba(34, 112, 175, 0.3)',
                        backgroundColor: '#FFFFFF',
                        color: '#192D55',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
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
                        border: '1px solid rgba(34, 112, 175, 0.3)',
                        backgroundColor: '#FFFFFF',
                        color: '#192D55',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
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
                        border: '1px solid rgba(34, 112, 175, 0.3)',
                        backgroundColor: '#FFFFFF',
                        color: '#192D55',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
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
                        border: '1px solid #192D55',
                        backgroundColor: '#192D55',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      HQ Admin
                    </button>
                  </div>
                </div>

                {error && (
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
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#192D55', marginBottom: '6px' }}>
                      {activeTab === 'staff' ? 'Official Email / Username' : 'Enrollment No. / Parent Email'}
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
                        placeholder={activeTab === 'staff' ? 'e.g. principal.rkp@dps-society.edu' : 'e.g. student.aarav@dps-society.edu'}
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

                  <div style={{ marginBottom: '16px' }}>
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
                        placeholder="Enter password"
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

                  {/* Submit Button: Strongest Gradient (AURXON Blue -> Royal Purple) */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)',
                      color: '#FFFFFF',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: loading ? 0.7 : 1,
                      boxShadow: '0 4px 14px 0 rgba(34, 112, 175, 0.35)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {loading ? (
                      <span>Authenticating securely...</span>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Organization Search Launcher Link */}
                <div style={{ marginTop: '18px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setLoginMode('search-org')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2270AF',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Building2 size={13} />
                    <span>Looking for your school or coaching portal? Search here →</span>
                  </button>
                </div>

                {/* Encrypted Session Notice */}
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#64748b',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDemoModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      backgroundColor: '#FAF5FF',
                      border: '1px solid rgba(158, 59, 179, 0.25)',
                      color: '#9E3BB3',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={13} />
                    <span>View All Seeded Schools & Student Test Accounts</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span>256-Bit Encrypted Multi-Tenant Session</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------
          DEMO CREDENTIALS INTERACTIVE MODAL
          ------------------------------------------------------------- */}
      {demoModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '780px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              overflow: 'hidden',
              border: '1px solid #bae6fd',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                backgroundColor: '#192D55',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="#F7E223" />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                    AURXON Demo Credentials & Test Accounts
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0 }}>
                    Global test password for all accounts: <strong style={{ color: '#ffffff' }}>Password@123</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDemoModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Category 1: Super Admin */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#9E3BB3', backgroundColor: '#FAF5FF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e9d5ff' }}>
                      HQ SAAS CONTROL PLANE
                    </span>
                    <strong style={{ fontSize: '13px', color: '#192D55' }}>Super Admin</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('superadmin@aurxon.io', 'Password@123', 'staff')}
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#ffffff',
                      backgroundColor: '#2270AF',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Autofill & Login
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  Email: <code style={{ color: '#0369a1', fontFamily: 'monospace' }}>superadmin@aurxon.io</code> • Full control of tenants, telemetry, licensing, feature flags & DB audit.
                </div>
              </div>

              {/* Category 2: Delhi Public School Society */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #BAE6FD', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <School size={18} color="#2270AF" />
                  <strong style={{ fontSize: '14px', color: '#192D55' }}>Delhi Public School Society (K-12 School Chain)</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Portal: /s/dps-society</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {[
                    { role: 'Principal', name: 'Dr. Meenakshi Sundaram', email: 'principal.rkp@dps-society.edu', tab: 'staff' },
                    { role: 'Org Admin', name: 'Rajesh Malhotra', email: 'admin@dps-society.edu', tab: 'staff' },
                    { role: 'Accountant', name: 'Ramesh Bansal', email: 'accountant@dps-society.edu', tab: 'staff' },
                    { role: 'Math Faculty', name: 'Amit Kulkarni', email: 'teacher.math@dps-society.edu', tab: 'staff' },
                    { role: 'Student (Aarav)', name: 'Roll 1 (Class 10-A)', email: 'student.aarav@dps-society.edu', tab: 'student' },
                    { role: 'Parent (Aarav)', name: 'Rajesh Sharma', email: 'parent.aarav@gmail.com', tab: 'student' },
                  ].map((acc, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: acc.tab === 'student' ? '#059669' : '#2270AF' }}>
                            {acc.role}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{acc.name}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#1e293b', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '2px' }}>
                          {acc.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => fillDemoCredentials(acc.email, 'Password@123', acc.tab as any)}
                          style={{
                            flex: 1,
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid #bae6fd',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Autofill
                        </button>
                        <button
                          type="button"
                          onClick={() => copyDemoCreds(acc.email)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedDemoEmail === acc.email ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 3: Apex Coaching Classes */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Building2 size={18} color="#9E3BB3" />
                  <strong style={{ fontSize: '14px', color: '#192D55' }}>Apex Coaching Classes (NEET / JEE Coaching)</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Portal: /s/apex-classes</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {[
                    { role: 'Director', name: 'Rajesh Agrawal', email: 'director@apex.edu', tab: 'staff' },
                    { role: 'Physics Faculty', name: 'Dr. H.C. Bhatia', email: 'faculty.physics@apex.edu', tab: 'staff' },
                    { role: 'Student (JEE)', name: 'Priya (Roll 101)', email: 'student.priya@apex.edu', tab: 'student' },
                  ].map((acc, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9E3BB3' }}>
                            {acc.role}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{acc.name}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#1e293b', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '2px' }}>
                          {acc.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => fillDemoCredentials(acc.email, 'Password@123', acc.tab as any)}
                          style={{
                            flex: 1,
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid #e9d5ff',
                            backgroundColor: '#faf5ff',
                            color: '#7e22ce',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Autofill
                        </button>
                        <button
                          type="button"
                          onClick={() => copyDemoCreds(acc.email)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedDemoEmail === acc.email ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 4: Sharma Tutorials */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Building2 size={18} color="#2270AF" />
                  <strong style={{ fontSize: '14px', color: '#192D55' }}>Sharma Tutorials (Board & Olympiad Coaching)</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Portal: /s/sharma-tutorials</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {[
                    { role: 'Director', name: 'Manoj Sharma', email: 'director@sharma.edu', tab: 'staff' },
                    { role: 'Math Faculty', name: 'R.D. Saxena', email: 'faculty.math@sharma.edu', tab: 'staff' },
                    { role: 'Student (Tanmay)', name: 'Roll 201 (Class 10)', email: 'student.rohan@sharma.edu', tab: 'student' },
                  ].map((acc, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2270AF' }}>
                            {acc.role}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{acc.name}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#1e293b', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '2px' }}>
                          {acc.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => fillDemoCredentials(acc.email, 'Password@123', acc.tab as any)}
                          style={{
                            flex: 1,
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid #bae6fd',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Autofill
                        </button>
                        <button
                          type="button"
                          onClick={() => copyDemoCreds(acc.email)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedDemoEmail === acc.email ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 24px',
                backgroundColor: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Refer to <code>DEMO_CREDENTIALS.md</code> for complete student admission rolls and phone numbers.
              </span>
              <button
                type="button"
                onClick={() => setDemoModalOpen(false)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#192D55',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          FOOTER (Glacier Dark Navy Branding)
          ------------------------------------------------------------- */}
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
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>
            Powered by <strong style={{ color: '#192D55' }}>AURXON Education OS</strong>
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/onboard" style={{ color: '#2270AF', textDecoration: 'none', fontWeight: 600 }}>
              Register Institution
            </Link>
            <span>•</span>
            <Link href="/aurxon" style={{ color: '#192D55', textDecoration: 'none', fontWeight: 600 }}>
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
