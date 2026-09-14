'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LiveClockWidget from '@/components/ui/LiveClockWidget';
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
  Bus,
  BookOpen,
  Briefcase,
  FileText,
  Settings,
  Bell,
  Check,
  Copy,
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

  // Organization Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<OrganizationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationResult | null>(null);

  // Direct Link Fast Jump State
  const [directSlug, setDirectSlug] = useState('');
  const [directError, setDirectError] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Capability Architecture Active Tab
  const [activeTab, setActiveTab] = useState<'academics' | 'fees' | 'attendance' | 'multicampus'>('academics');

  // Role Architecture Active Tab
  const [activeRole, setActiveRole] = useState<'principal' | 'teacher' | 'accountant' | 'parent'>('principal');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search directly querying database
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
        console.error('Portal search request error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize with top registered institutions
  useEffect(() => {
    fetchSearchResults('');
  }, [fetchSearchResults]);

  // Debounced input trigger (120ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchResults(searchQuery);
    }, 120);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSearchResults]);

  // Outside click to close search dropdown
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

  const handleFindSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (results.length > 0) {
      const target = selectedIndex >= 0 && selectedIndex < results.length ? results[selectedIndex] : results[0];
      handleSelectOrg(target);
      return;
    }
    if (!searchQuery.trim()) {
      setShowDropdown(true);
    }
  };

  const handleDirectJump = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directSlug.toLowerCase().trim().replace(/^\/s\//, '').replace(/^s\//, '');
    if (!clean) {
      setDirectError('Please enter an organization slug (e.g. "dps-society")');
      return;
    }
    setDirectError('');
    router.push(`/s/${clean}`);
  };

  const copyDirectLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        backgroundImage: 'linear-gradient(135deg, #EAF5FC 0%, #FFFFFF 48%, #F2E8F7 100%)',
        color: '#192D55',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Operational Status Ribbon with Authoritative Live Clock */}
      <div
        style={{
          backgroundColor: '#192D55',
          color: '#f8fafc',
          padding: '6px 20px',
          fontSize: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
            }}
          />
          <span style={{ fontWeight: 600, color: '#38bdf8' }}>AURXON Enterprise Cloud</span>
          <span style={{ color: '#64748b' }}>•</span>
          <span style={{ color: '#94a3b8' }}>Multi-Tenant Education Operating System</span>
        </div>

        {/* Global Authoritative Clock (Day, Date, Time) */}
        <LiveClockWidget theme="dark" />
      </div>

      {/* Primary Navigation Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(34, 112, 175, 0.15)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Brand Identity */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                boxShadow: '0 3px 10px rgba(34, 112, 175, 0.35)',
              }}
            >
              A
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#192D55', letterSpacing: '-0.02em' }}>
                  AURXON
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#EAF5FC',
                    color: '#2270AF',
                    border: '1px solid rgba(34, 112, 175, 0.25)',
                  }}
                >
                  Education OS
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Centralized School & Coaching ERP</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="desktop-nav">
            <a href="#find-school" style={{ fontSize: '13.5px', fontWeight: 600, color: '#192D55', textDecoration: 'none' }}>
              Find Organization
            </a>
            <a href="#architecture" style={{ fontSize: '13.5px', fontWeight: 600, color: '#192D55', textDecoration: 'none' }}>
              Capabilities
            </a>
            <a href="#roles" style={{ fontSize: '13.5px', fontWeight: 600, color: '#192D55', textDecoration: 'none' }}>
              Role Workflows
            </a>
            <a href="#direct-jump" style={{ fontSize: '13.5px', fontWeight: 600, color: '#192D55', textDecoration: 'none' }}>
              Direct Link
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/login"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#2270AF',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 112, 175, 0.25)',
                backgroundColor: '#FFFFFF',
                textDecoration: 'none',
                transition: 'all 120ms ease',
              }}
            >
              Sign In
            </Link>

            <Link
              href="/onboard"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2270AF 0%, #4B5FAF 45%, #9E3BB3 100%)',
                boxShadow: '0 4px 12px rgba(34, 112, 175, 0.35)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Onboard Institute</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* HERO SECTION: Primary Customer Discovery & Organization Entry */}
        <section
          id="find-school"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '48px 20px 40px',
            textAlign: 'center',
          }}
        >
          {/* Trust & Architecture Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(224, 242, 254, 0.8)',
              border: '1px solid rgba(186, 230, 253, 0.9)',
              color: '#0369a1',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '20px',
            }}
          >
            <ShieldCheck size={15} color="#0284c7" />
            <span>Dedicated Multi-Tenant Architecture • CBSE & State Board Standardized</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 4.5vw, 46px)',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              maxWidth: '820px',
              margin: '0 auto 16px',
            }}
          >
            The Operating System for Modern Indian Schools & Coaching Institutes
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: '#475569',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0 auto 36px',
            }}
          >
            Connect directly to your educational institution&apos;s authenticated workspace. Search your school below or use your dedicated direct portal link.
          </p>

          {/* CENTRAL SEARCH BOX: Live Auto-Predict Direct to Database */}
          <div
            ref={searchContainerRef}
            style={{
              maxWidth: '680px',
              margin: '0 auto 24px',
              position: 'relative',
              textAlign: 'left',
            }}
          >
            <form
              onSubmit={handleFindSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '16px',
                border: '2px solid #38bdf8',
                boxShadow: '0 12px 36px -8px rgba(2, 132, 199, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
                padding: '6px 8px 6px 16px',
                gap: '12px',
              }}
            >
              <Search size={20} color="#0284c7" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Start typing your school, coaching institute or organization..."
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  setSelectedIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                  } else if (e.key === 'Escape') {
                    setShowDropdown(false);
                  }
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: 'transparent',
                }}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndex(-1);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
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
                  padding: '10px 22px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 50%, #1e40af 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                {loading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <span>Find</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Live Autocomplete Dropdown List */}
            {showDropdown && results.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid rgba(186, 230, 253, 0.95)',
                  boxShadow: '0 20px 40px -10px rgba(2, 132, 199, 0.25)',
                  overflow: 'hidden',
                  zIndex: 50,
                  maxHeight: '340px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f8fbfe',
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#0369a1',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Registered Educational Organizations</span>
                  <span>Direct Secure Route</span>
                </div>

                {results.map((org, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={org.slug}
                      onClick={() => handleSelectOrg(org)}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: index < results.length - 1 ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                        transition: 'background-color 100ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '14px',
                          }}
                        >
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{org.name}</span>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '2px 5px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                fontFamily: 'monospace',
                              }}
                            >
                              {org.code}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {org.city} • {org.board} • {org.organizationType}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>
                          /s/{org.slug}
                        </span>
                        <ChevronRight size={14} color="#94a3b8" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Enrolled Campus Shortcuts */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              fontSize: '12.5px',
              color: '#64748b',
            }}
          >
            <span style={{ fontWeight: 600, color: '#0369a1' }}>Quick Access:</span>
            {[
              { name: 'Delhi Public School', slug: 'dps-society' },
              { name: 'Allen Career Institute', slug: 'allen-career' },
              { name: 'Indore Public School', slug: 'ips' },
              { name: 'St. Xavier High School', slug: 'st-xavier' },
            ].map((inst) => (
              <Link
                key={inst.slug}
                href={`/s/${inst.slug}`}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(186, 230, 253, 0.85)',
                  color: '#0284c7',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '12px',
                  boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
                }}
              >
                {inst.name}
              </Link>
            ))}
          </div>

          {/* Selected Organization Confirmation Card */}
          {selectedOrg && (
            <div
              style={{
                maxWidth: '680px',
                margin: '28px auto 0',
                padding: '20px 24px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid #0284c7',
                boxShadow: '0 12px 30px -6px rgba(2, 132, 199, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '18px',
                  }}
                >
                  {selectedOrg.name.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{selectedOrg.name}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#e0f2fe',
                        color: '#0284c7',
                      }}
                    >
                      {selectedOrg.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    {selectedOrg.city} • {selectedOrg.board} • Dedicated Tenant Scope Ready
                  </div>
                </div>
              </div>

              <Link
                href={`/s/${selectedOrg.slug}`}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                }}
              >
                <span>Open School Portal</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>

        {/* DIRECT SHORT-LINK FAST PATH */}
        <section
          id="direct-jump"
          style={{
            maxWidth: '900px',
            margin: '0 auto 60px',
            padding: '0 20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(186, 230, 253, 0.9)',
              padding: '24px 28px',
              boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="#0284c7" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Direct Organization Fast Path
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Already know your school&apos;s custom handle? Jump straight into your login screen without searching.
              </p>
            </div>

            <form onSubmit={handleDirectJump} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8fbfe',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                }}
              >
                <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#64748b' }}>
                  aurxon.io/s/
                </span>
                <input
                  type="text"
                  placeholder="your-school-slug"
                  value={directSlug}
                  onChange={(e) => {
                    setDirectSlug(e.target.value);
                    setDirectError('');
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: '#0284c7',
                    fontWeight: 600,
                    width: '140px',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                }}
              >
                Go to Portal
              </button>
            </form>

            {directError && (
              <div style={{ width: '100%', fontSize: '12px', color: '#dc2626' }}>
                {directError}
              </div>
            )}
          </div>
        </section>

        {/* CORE ARCHITECTURAL CAPABILITIES (Informative & Truthful) */}
        <section
          id="architecture"
          style={{
            maxWidth: '1240px',
            margin: '0 auto 80px',
            padding: '0 20px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#0284c7',
                letterSpacing: '0.05em',
              }}
            >
              Enterprise Capabilities
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginTop: '4px' }}>
              Built for Indian Academic Rigor & Multi-Campus Governance
            </h2>
            <p style={{ fontSize: '14.5px', color: '#64748b', maxWidth: '620px', margin: '6px auto 0' }}>
              Standardized with national educational frameworks, financial ledgers, and multi-tenant isolation.
            </p>
          </div>

          {/* Capability Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '28px',
            }}
          >
            {[
              { id: 'academics', label: 'CBSE 9-Point & NEP Grading' },
              { id: 'fees', label: 'Quarterly Fee Ledgers & RTE' },
              { id: 'attendance', label: 'Attendance & Parent Alerts' },
              { id: 'multicampus', label: 'Multi-Campus Federation' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeTab === tab.id ? '1px solid #0284c7' : '1px solid rgba(186, 230, 253, 0.8)',
                  backgroundColor: activeTab === tab.id ? '#0284c7' : '#ffffff',
                  color: activeTab === tab.id ? '#ffffff' : '#475569',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid rgba(186, 230, 253, 0.9)',
              padding: '36px',
              boxShadow: '0 12px 32px -8px rgba(2, 132, 199, 0.08)',
            }}
          >
            {activeTab === 'academics' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                    Academic Excellence
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                    Authoritative CBSE Scholastic & Co-Scholastic Engine
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Calculates A1–E2 grade scale, Grade Points (10.0 scale), cumulative CGPA, and NEP 2020 Holistic Progress Cards with zero manual errors.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Deterministic grade computation directly mapped to verified marks thresholds.</li>
                    <li>U-DISE+ student national ID synchronization & bulk export templates.</li>
                    <li>Automated Transfer Certificate (TC) counter-signature registers.</li>
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fbfe',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', marginBottom: '12px', textTransform: 'uppercase' }}>
                    CBSE 9-Point Scale Mapping
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <strong>91 – 100%</strong>: A1 (10.0)
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <strong>81 – 90%</strong>: A2 (9.0)
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <strong>71 – 80%</strong>: B1 (8.0)
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <strong>61 – 70%</strong>: B2 (7.0)
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <strong>51 – 60%</strong>: C1 (6.0)
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <strong>41 – 50%</strong>: C2 (5.0)
                    </div>
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '11.5px', color: '#64748b' }}>
                    Verified against CBSE Examination Byelaws & Curriculum circulars.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                    Financial Governance
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                    Indian Financial Year Fee Accounting & RTE Quota
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Supports Q1 (Apr–Jun), Q2 (Jul–Sep), Q3 (Oct–Dec), and Q4 (Jan–Mar) installment structures, sibling discounts, and RTE 25% zero-balance ledgers.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Instant thermal & PDF receipt generation with QR-coded verification.</li>
                    <li>RTE 25% reservation compliance with separate audit trail for state reimbursement.</li>
                    <li>Real-time defaulters tracking with automated reminder dispatches.</li>
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fbfe',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Fee Installment Breakdown Model
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span>Q1 (Apr – Jun): Admission & Tuition</span>
                      <strong style={{ color: '#0f172a' }}>Standard Due: 15 Apr</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span>Q2 (Jul – Sep): Tuition & Lab Fees</span>
                      <strong style={{ color: '#0f172a' }}>Standard Due: 15 Jul</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span>Q3 (Oct – Dec): Exam & Activities</span>
                      <strong style={{ color: '#0f172a' }}>Standard Due: 15 Oct</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span>Q4 (Jan – Mar): Annual Session Dues</span>
                      <strong style={{ color: '#0f172a' }}>Standard Due: 15 Jan</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                    Daily Operations
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                    Idempotent Attendance & Rapid Biometric Sync
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Guarantees single daily record integrity via database composite unique constraints (`studentId + date`), preventing accidental double-marking.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Supports Mobile Teacher Roll Call, RFID tap cards, and Biometric turnstiles.</li>
                    <li>Automated 75% CBSE mandatory attendance threshold warning monitors.</li>
                    <li>Instant dispatch queue for SMS / WhatsApp parent notifications on unexcused absence.</li>
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fbfe',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Attendance Idempotency Model
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '12px', color: '#334155' }}>
                    @@unique([studentId, date])<br />
                    Status: PRESENT | ABSENT | LATE | HALF_DAY | EXCUSED<br />
                    Execution: Atomic upsert prevents concurrency collision
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#64748b' }}>
                    Guaranteed data accuracy for state inspection logs.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'multicampus' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#f3e8ff', color: '#7c3aed', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                    Multi-Entity Scale
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                    True Multi-Campus Federation
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Single unified SaaS deployment supporting school groups with multiple cities, branches, and independent institutions under one legal trust.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Strict database tenant isolation (`organizationId + institutionId + branchId`).</li>
                    <li>Centralized management dashboard for group trustees.</li>
                    <li>Isolated books of accounts and faculty payroll per physical campus.</li>
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fbfe',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Organization Hierarchy Hierarchy
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#334155' }}>
                    <strong>Education Trust / Group</strong><br />
                    └── <strong>Main City K-12 School</strong> (Branch 1, Branch 2)<br />
                    └── <strong>Integrated Coaching Academy</strong> (City Center, Branch 3)
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#64748b' }}>
                    Zero cross-tenant data bleed across legal entities.
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ROLE-SPECIFIC WORKFLOW ARCHITECTURE */}
        <section
          id="roles"
          style={{
            maxWidth: '1240px',
            margin: '0 auto 80px',
            padding: '0 20px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#0284c7',
                letterSpacing: '0.05em',
              }}
            >
              Role Workflows
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginTop: '4px' }}>
              Purpose-Built Interfaces for Every Institutional Stakeholder
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid rgba(186, 230, 253, 0.9)', padding: '24px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.05)' }}>
              <Building2 size={24} color="#0284c7" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Principals & Trustees</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Real-time fee reconciliation, daily attendance percentage, audit logs, and faculty deployment metrics.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid rgba(186, 230, 253, 0.9)', padding: '24px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.05)' }}>
              <GraduationCap size={24} color="#0284c7" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Teachers & Faculty</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                30-second mobile attendance roll call, test marks entry, automated CBSE grade point conversions, and timetable view.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid rgba(186, 230, 253, 0.9)', padding: '24px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.05)' }}>
              <Receipt size={24} color="#0284c7" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Accountants & Bursars</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Instant quarter-wise ledger creation, bank reconciliation, RTE 25% reimbursement claims, and fee receipts.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid rgba(186, 230, 253, 0.9)', padding: '24px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.05)' }}>
              <Users size={24} color="#0284c7" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Parents & Students</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Download official report cards, verify fee balances, pay installments, and check live attendance history.
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section
          style={{
            maxWidth: '1240px',
            margin: '0 auto 60px',
            padding: '0 20px',
          }}
        >
          <div
            style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
              color: '#ffffff',
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: '0 16px 40px -10px rgba(2, 132, 199, 0.35)',
            }}
          >
            <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Provision Your Institution on AURXON in Minutes
            </h2>
            <p style={{ fontSize: '15px', color: '#e0f2fe', maxWidth: '580px', margin: '0 auto 28px' }}>
              Deploy an independent multi-tenant educational scope complete with custom branded access link and administrative credentials.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href="/onboard"
                style={{
                  padding: '12px 26px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: '#0369a1',
                  fontSize: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                }}
              >
                Start Free Onboarding
              </Link>

              <Link
                href="/login"
                style={{
                  padding: '12px 22px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign In to Existing Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Global Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(186, 230, 253, 0.8)',
          backgroundColor: '#f8fbfe',
          padding: '28px 20px',
          fontSize: '12.5px',
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
            gap: '16px',
          }}
        >
          <div>
            <strong>AURXON Education OS</strong> • Multi-Tenant School & Coaching ERP Architecture
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
              Staff & Student Login
            </Link>
            <Link href="/onboard" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
              Self-Service Onboard
            </Link>
            <Link href="/aurxon/login" style={{ color: '#64748b', textDecoration: 'none' }}>
              Platform Master HQ
            </Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @media (max-width: 820px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
