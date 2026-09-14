'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Building2,
  School,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  GraduationCap,
  CalendarCheck,
  Receipt,
  FileSpreadsheet,
  Award,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Globe,
  Compass,
  AlertCircle,
  X,
} from 'lucide-react';

interface OrganizationResult {
  name: string;
  slug: string;
  code: string;
  city: string;
  organizationType: string;
  board: string;
  logoUrl: string | null;
}

export default function RootLandingPage() {
  const router = useRouter();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<OrganizationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationResult | null>(null);

  // Direct Link Jump State
  const [directSlug, setDirectSlug] = useState('');
  const [directError, setDirectError] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced Search Function connected directly to database
  const fetchSearchResults = useCallback(async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/portal/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResults(data.results || []);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Search request failed:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Pre-load enrolled organizations on mount for instant prediction
  useEffect(() => {
    fetchSearchResults('');
  }, [fetchSearchResults]);

  // Fast debounced search as user types (100ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchResults(searchQuery);
    }, 100);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSearchResults]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrg = (org: OrganizationResult) => {
    setSelectedOrg(org);
    setShowDropdown(false);
  };

  // Immediate Find Submission (Button Click or Enter key)
  const handleFindSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();

    // If user has navigated results or results already loaded:
    if (results.length > 0) {
      const target = selectedIndex >= 0 && selectedIndex < results.length ? results[selectedIndex] : results[0];
      handleSelectOrg(target);
      return;
    }

    if (!clean) {
      setShowDropdown(true);
      return;
    }

    // Direct immediate database search query
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/portal/search?q=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.success && data.results && data.results.length > 0) {
        setResults(data.results);
        handleSelectOrg(data.results[0]);
      } else {
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Find query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation for search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowDropdown(true);
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleFindSubmit();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleDirectJump = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directSlug.trim().toLowerCase().replace(/^\/s\//, '');
    if (!clean) {
      setDirectError('Please enter your school slug or identifier (e.g. dps)');
      return;
    }
    setDirectError('');
    router.push(`/s/${clean}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Institutional Header */}
      <header
        style={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Brand & Mission Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                letterSpacing: '-0.02em',
              }}
            >
              A
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c4a6e', letterSpacing: '-0.03em' }}>
                  AURXON
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                  }}
                >
                  Education OS
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                For Schools • Coaching Institutes • Education Groups
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/aurxon"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748b',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
              }}
            >
              Platform Operations
            </Link>
            <Link
              href="/login"
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#0284c7',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
                backgroundColor: '#f0f9ff',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* HERO SECTION */}
        <section
          style={{
            padding: '60px 24px 40px',
            maxWidth: '1240px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          {/* Regulatory & Standards Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#0369a1',
              marginBottom: '20px',
            }}
          >
            <ShieldCheck size={16} color="#0284c7" />
            <span>Built for India • CBSE, U-DISE+, APAAR & RTE Compliant</span>
          </div>

          {/* Master Headline */}
          <h1
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              maxWidth: '840px',
              margin: '0 auto 16px',
            }}
          >
            The Complete Education ERP for a Better Tomorrow
          </h1>

          <p
            style={{
              fontSize: '16px',
              color: '#475569',
              maxWidth: '680px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
            }}
          >
            A unified, multi-branch operating system designed for modern Indian schools, coaching networks, and
            educational trusts. Simple daily operations, enterprise compliance, and real-time operational intelligence.
          </p>

          {/* FIND YOUR ORGANIZATION (Central Search Box) */}
          <div
            ref={searchContainerRef}
            style={{
              maxWidth: '640px',
              margin: '0 auto 24px',
              position: 'relative',
              textAlign: 'left',
            }}
          >
            <form
              onSubmit={handleFindSubmit}
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #0284c7',
                borderRadius: '16px',
                padding: '6px 8px 6px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.12), 0 8px 10px -6px rgba(2, 132, 199, 0.08)',
              }}
            >
              <Search size={20} color="#0284c7" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search school, coaching institute or organization..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#0f172a',
                  backgroundColor: 'transparent',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchSearchResults('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '4px',
                    display: 'flex',
                  }}
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                <span>Find</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* LIVE AUTOCOMPLETE DROPDOWN */}
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  zIndex: 50,
                  maxHeight: '380px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Registered Educational Organizations</span>
                  {loading && <span style={{ color: '#0284c7' }}>Searching...</span>}
                </div>

                {results.length === 0 && !loading ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    <School size={28} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                      No organization matching &quot;{searchQuery}&quot;
                    </div>
                    <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      Try typing the city name, abbreviation (e.g. &quot;dps&quot;), or use direct school link below.
                    </div>
                  </div>
                ) : (
                  <div>
                    {results.map((org, index) => {
                      const isSelected = index === selectedIndex;
                      return (
                        <div
                          key={org.slug}
                          onClick={() => handleSelectOrg(org)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          style={{
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                            borderBottom: '1px solid #f8fafc',
                            transition: 'background-color 150ms ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                backgroundColor: isSelected ? '#e0f2fe' : '#f1f5f9',
                                color: '#0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '15px',
                                flexShrink: 0,
                              }}
                            >
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                                {org.name}
                              </div>
                              <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', gap: '8px' }}>
                                <span>{org.city}</span>
                                <span>•</span>
                                <span style={{ color: '#0369a1', fontWeight: 500 }}>{org.organizationType}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {org.board}
                            </span>
                            <ChevronRight size={16} color="#94a3b8" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ORGANIZATION PREVIEW MODAL / DIALOG */}
          {selectedOrg && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '20px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  maxWidth: '480px',
                  width: '100%',
                  padding: '32px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedOrg(null)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                >
                  <X size={20} />
                </button>

                {/* Emblem */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '24px',
                    margin: '0 auto 16px',
                    border: '2px solid #bae6fd',
                  }}
                >
                  {selectedOrg.name.charAt(0).toUpperCase()}
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  {selectedOrg.name}
                </h3>
                <div style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
                  {selectedOrg.city} • {selectedOrg.board} • {selectedOrg.organizationType}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    padding: '14px 0',
                    borderTop: '1px solid #f1f5f9',
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: '24px',
                  }}
                >
                  <div>
                    <Award size={18} color="#0284c7" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Academic Excellence</div>
                  </div>
                  <div>
                    <Users size={18} color="#0284c7" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Holistic Development</div>
                  </div>
                  <div>
                    <ShieldCheck size={18} color="#0284c7" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Trusted Legacy</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/s/${selectedOrg.slug}`)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <span>Continue to Workspace Login</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* DIRECT LINK FAST-PATH (Clean, Properly Proportioned Card) */}
          <div
            style={{
              maxWidth: '640px',
              margin: '0 auto 36px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Globe size={18} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                  Have a Direct School Link?
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Skip search and jump directly to your school workspace
                </div>
              </div>
            </div>

            <form onSubmit={handleDirectJump} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    padding: '8px 10px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    borderRight: '1px solid #cbd5e1',
                  }}
                >
                  aurxon.app/s/
                </span>
                <input
                  type="text"
                  value={directSlug}
                  onChange={(e) => setDirectSlug(e.target.value)}
                  placeholder="dps"
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    width: '120px',
                    color: '#0f172a',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 150ms ease',
                }}
              >
                <span>Open</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
          {directError && <div style={{ color: '#dc2626', fontSize: '12.5px', marginTop: '-24px', marginBottom: '24px' }}>{directError}</div>}
        </section>

        {/* TRUST & SCALE METRICS (Blueprint Section 1) */}
        <section
          style={{
            borderTop: '1px solid #f1f5f9',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '1240px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7' }}>500+</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Registered Organizations</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0c4a6e' }}>2M+</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Active Students</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669' }}>99.9%</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Enterprise Uptime</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#7c3aed' }}>100%</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>India Compliant (CBSE/U-DISE+)</div>
            </div>
          </div>
        </section>

        {/* CORE OPERATING MODULES (Built for India) */}
        <section style={{ padding: '60px 24px', maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              One Operating System for Every Educational Need
            </h2>
            <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '6px' }}>
              Designed to handle everything from single-campus coaching to multi-institution educational trusts.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Module 1 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Student Information System (SIS)
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Comprehensive student lifecycle from inquiry to graduation. Unified guardian profiles, sibling tracking,
                and national APAAR/U-DISE+ identifier integration.
              </p>
            </div>

            {/* Module 2 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <CalendarCheck size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Attendance & Roll Call
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Daily period-wise and roll-call attendance with automated parent SMS alerts. Idempotent record-keeping
                supporting manual entry and biometric/RFID devices.
              </p>
            </div>

            {/* Module 3 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Receipt size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Fees & Financial Collections
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Quarterly installments, fee concessions, RTE 25% quota accounting, computer-generated GST receipts,
                and real-time outstanding dues reconciliation.
              </p>
            </div>

            {/* Module 4 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#f3e8ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <FileSpreadsheet size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Examinations & CBSE Grading
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Deterministic A1 to E2 letter grades, 9-point scale CBSE marks cards, scholastic & co-scholastic
                evaluations, and printable term report cards.
              </p>
            </div>

            {/* Module 5 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Compass size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Admissions & Enrollment
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                End-to-end inquiry intake, document verification, entrance exam scoring, seat reservation, and 1-click
                conversion into registered student records.
              </p>
            </div>

            {/* Module 6 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Building2 size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Multi-Branch & Group Architecture
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Hierarchical governance across Organization → Institution → Branch → Academic Session with
                cryptographic tenant isolation and consolidated executive reporting.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          padding: '24px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#64748b',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <strong>AURXON</strong> — The Centralized Operating System for Indian Education
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/aurxon" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
              AURXON Platform Operations
            </Link>
            <span>•</span>
            <span>Security & Data Privacy</span>
            <span>•</span>
            <span>256-Bit Encrypted</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
