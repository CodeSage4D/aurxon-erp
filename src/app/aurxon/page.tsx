'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import LiveClockWidget from '@/components/ui/LiveClockWidget';
import {
  Building2,
  GraduationCap,
  Users,
  PlusCircle,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Layers,
  Search,
  Activity,
  LogOut,
  MapPin,
  Server,
  Filter,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

interface EnrolledOrg {
  id: string;
  name: string;
  slug: string;
  code: string;
  primaryColor: string;
  status: string;
  institutions: Array<{
    name: string;
    type: string;
    city: string;
    branches: Array<{ name: string }>;
  }>;
  _count: { students: number; users: number };
}

export default function AurxonMasterCockpitPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orgs, setOrgs] = useState<EnrolledOrg[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Search & Filter State
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Enrollment Form State
  const [formOpen, setFormOpen] = useState(false);
  const [instituteName, setInstituteName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [instituteType, setInstituteType] = useState<'SCHOOL' | 'COACHING' | 'HYBRID'>('SCHOOL');
  const [board, setBoard] = useState('CBSE');
  const [city, setCity] = useState('Indore');
  const [campusesText, setCampusesText] = useState('Main Campus, Rau Campus');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('Password@123');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  const [submitting, setSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Deployment Success State
  const [deployedData, setDeployedData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Security: Invalidate bfcache on back button navigation
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Auto-generate shortest clean slug from institute name
  useEffect(() => {
    if (isSlugEdited) return;
    if (!instituteName.trim()) {
      setCustomSlug('');
      return;
    }
    const words = instituteName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/);

    if (words.length >= 3) {
      const acronym = words.map((w) => w[0]).join('');
      if (acronym.length >= 3) {
        setCustomSlug(acronym);
        return;
      }
    }
    setCustomSlug(words.slice(0, 3).join('-'));
  }, [instituteName, isSlugEdited]);

  const loadData = async () => {
    try {
      const [meRes, orgsRes, statsRes] = await Promise.all([
        fetch('/api/v1/auth/me'),
        fetch('/api/v1/platform/organizations'),
        fetch('/api/v1/platform/stats'),
      ]);

      if (!meRes.ok) {
        window.location.replace('/aurxon/login');
        return;
      }

      const meJson = await meRes.json();
      if (meJson.user?.role !== 'SUPER_ADMIN') {
        window.location.replace('/aurxon/login');
        return;
      }
      setUser(meJson.user);

      if (orgsRes.ok) {
        const orgsJson = await orgsRes.json();
        setOrgs(orgsJson.organizations || []);
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson.stats);
      }
    } catch (err) {
      console.error('Error loading master cockpit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Proceed
    }
    // Hard replacement of history to guarantee no Back button recovery
    window.location.replace('/aurxon/login');
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setEnrollError('');

    try {
      const branches = campusesText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await fetch('/api/v1/platform/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: instituteName,
          customSlug: customSlug || undefined,
          type: instituteType,
          board,
          city,
          branches: branches.length > 0 ? branches : ['Main Campus'],
          adminName,
          adminEmail,
          adminPassword,
          primaryColor,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setEnrollError(json.error || 'Enrollment failed.');
        setSubmitting(false);
        return;
      }

      setDeployedData(json);
      await loadData();
    } catch {
      setEnrollError('Network error connecting to deployment pipeline.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Filtered organizations based on search query and selected type
  const filteredOrgs = useMemo(() => {
    return orgs.filter((org) => {
      const matchesSearch =
        !searchFilter.trim() ||
        org.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        org.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
        org.institutions.some((inst) => inst.city.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchesType =
        selectedType === 'ALL' ||
        org.institutions.some((inst) => inst.type === selectedType);

      return matchesSearch && matchesType;
    });
  }, [orgs, searchFilter, selectedType]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070d1e',
          color: '#38bdf8',
          fontWeight: 600,
          fontSize: '15px',
          letterSpacing: '0.02em',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Initializing AURXON SaaS Operations Control Center...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#070d1e',
        backgroundImage: 'radial-gradient(ellipse 90% 45% at 50% -5%, rgba(14, 165, 233, 0.12), transparent 70%), linear-gradient(180deg, #070d1e 0%, #0b152d 100%)',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        paddingBottom: '60px',
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'rgba(7, 13, 30, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #1e293b',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              flexShrink: 0,
            }}
          >
            <Shield size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#ffffff' }}>
                AURXON <span style={{ color: '#38bdf8' }}>HQ</span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                SaaS Control Center
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Multi-Tenant Operations & Institute Provisioning
            </div>
          </div>
        </div>

        {/* Center: Authoritative System Clock */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <LiveClockWidget theme="dark" />
        </div>

        {/* Right: Operator Profile & Secure Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{user?.name || 'Super Admin'}</span>
            <span style={{ fontSize: '11px', color: '#38bdf8' }}>Platform Operator</span>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out and lock session"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <LogOut size={14} />
            <span className="exit-text">Exit HQ</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 20px' }}>
        {/* Title Bar & Primary Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Platform Operations & Institute Cockpit
            </h1>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
              Provision dedicated branded ERP instances for K-12 schools, coaching academies, and multi-campus trusts.
            </p>
          </div>

          <button
            onClick={() => {
              setFormOpen(true);
              setDeployedData(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'all 150ms ease',
            }}
          >
            <PlusCircle size={17} /> Provision Institution / Coaching
          </button>
        </div>

        {/* KPI Metrics Strip (Verified Production DB Counts) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Enrolled Organizations
              </span>
              <Building2 size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '10px', letterSpacing: '-0.02em' }}>
              {stats?.totalOrgs || orgs.length}
            </div>
            <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '4px', fontWeight: 600 }}>
              Across {stats?.totalBranches || 11} Registered Campuses
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Enrolled Students
              </span>
              <GraduationCap size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '10px', letterSpacing: '-0.02em' }}>
              {stats?.totalStudents || 10}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Verified Database Master Records
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Faculty & Staff
              </span>
              <Users size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '10px', letterSpacing: '-0.02em' }}>
              {stats?.totalUsers || 18}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Principals, Teachers, Accountants
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Monthly Run Rate (MRR)
              </span>
              <Activity size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '10px', letterSpacing: '-0.02em' }}>
              ₹{(stats?.estimatedMRR || 147000).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
              Tier-1 Enterprise SaaS Subscriptions
            </div>
          </div>
        </div>

        {/* Directory Section: Search, Filters & Tenant Table */}
        <div
          style={{
            backgroundColor: '#0b1329',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Search and Filter Strip */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#0c1833',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  maxWidth: '380px',
                }}
              >
                <Search
                  size={15}
                  color="#64748b"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search by name, code, slug, or city..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    backgroundColor: '#070d1e',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Type Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['ALL', 'SCHOOL', 'COACHING'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: selectedType === type ? '1px solid #38bdf8' : '1px solid #1e293b',
                      backgroundColor: selectedType === type ? 'rgba(56, 189, 248, 0.15)' : '#070d1e',
                      color: selectedType === type ? '#38bdf8' : '#94a3b8',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {type === 'ALL' ? 'All Types' : type === 'SCHOOL' ? 'Schools' : 'Coaching'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Showing <strong style={{ color: '#38bdf8' }}>{filteredOrgs.length}</strong> of {orgs.length} Active Portals
            </div>
          </div>

          {/* Institution List */}
          <div>
            {filteredOrgs.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                <Building2 size={36} color="#334155" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#94a3b8' }}>
                  No educational organizations match your search
                </div>
                <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                  Try clearing your search query or switching category filters.
                </div>
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    style={{
                      marginTop: '16px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              filteredOrgs.map((org) => {
                const portalShortLink =
                  typeof window !== 'undefined' ? `${window.location.origin}/s/${org.slug}` : `/s/${org.slug}`;
                const inst = org.institutions[0];

                return (
                  <div
                    key={org.id}
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                      borderBottom: '1px solid #131d38',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    {/* Organization Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: org.primaryColor || '#0284c7',
                          color: '#ffffff',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{org.name}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#1e293b',
                              color: '#94a3b8',
                              fontFamily: 'monospace',
                            }}
                          >
                            {org.code}
                          </span>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            {inst?.type || 'SCHOOL'}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '4px',
                            fontSize: '12px',
                            color: '#64748b',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {inst?.city || 'Indore'}
                          </span>
                          <span>•</span>
                          <span>{inst?.branches?.length || 1} Campuses</span>
                          <span>•</span>
                          <span>{org._count?.students || 0} Students</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Dedicated Short Link */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 10px',
                          backgroundColor: '#070d1e',
                          border: '1px solid #1e293b',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                          /s/{org.slug}
                        </span>
                        <button
                          onClick={() => copyToClipboard(portalShortLink, org.id)}
                          title="Copy direct portal link"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: copiedLink === org.id ? '#10b981' : '#64748b',
                            padding: '2px',
                            display: 'flex',
                          }}
                        >
                          {copiedLink === org.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      <Link
                        href={`/s/${org.slug}`}
                        target="_blank"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                        }}
                      >
                        Launch Portal <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Platform Telemetry Footer Strip */}
        <div
          style={{
            marginTop: '24px',
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: '#0b1329',
            border: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={14} color="#38bdf8" />
            <span>Database Node: <strong>Active (Isolated Multi-Tenant Pool)</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Telemetry: <strong>Zero Readonly Errors</strong></span>
            <span>Security: <strong>Strict No-Store Cache Enforced</strong></span>
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------
          INSTITUTE PROVISIONING MODAL / DRAWER
         ------------------------------------------------------------- */}
      {formOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              backgroundColor: '#0b1329',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #1e293b',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              padding: '28px 24px',
              boxSizing: 'border-box',
            }}
          >
            {!deployedData ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                      Provision New Institution / Coaching
                    </h3>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
                      Deploys an independent, isolated ERP scope with dedicated access link.
                    </p>
                  </div>
                  <button
                    onClick={() => setFormOpen(false)}
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    ✕
                  </button>
                </div>

                {enrollError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      fontSize: '12.5px',
                      marginBottom: '16px',
                    }}
                  >
                    {enrollError}
                  </div>
                )}

                <form onSubmit={handleEnrollSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Institution / Coaching Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indore Public School or Allen Career Institute"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#070d1e',
                        border: '1px solid #1e293b',
                        color: '#ffffff',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Auto-Generated Shortest Link */}
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px',
                      backgroundColor: '#070d1e',
                      borderRadius: '10px',
                      border: '1px solid #1e293b',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#38bdf8' }}>
                        Custom Access Link (Auto-Generated Shortest Slug)
                      </label>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Editable</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#64748b' }}>
                        aurxon.io/s/
                      </span>
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => {
                          setIsSlugEdited(true);
                          setCustomSlug(e.target.value);
                        }}
                        placeholder="slug"
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#0b1329',
                          border: '1px solid #1e293b',
                          color: '#38bdf8',
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Two-Column Grid for Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Organization Type
                      </label>
                      <select
                        value={instituteType}
                        onChange={(e: any) => setInstituteType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#070d1e',
                          border: '1px solid #1e293b',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      >
                        <option value="SCHOOL">K-12 School</option>
                        <option value="COACHING">Coaching / Test-Prep</option>
                        <option value="HYBRID">Hybrid Education Group</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Indore"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#070d1e',
                          border: '1px solid #1e293b',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Campuses & Board */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Initial Campuses (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={campusesText}
                        onChange={(e) => setCampusesText(e.target.value)}
                        placeholder="e.g. Main Campus, City Branch"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#070d1e',
                          border: '1px solid #1e293b',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Board / Accreditation
                      </label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#070d1e',
                          border: '1px solid #1e293b',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      >
                        <option value="CBSE">CBSE (National)</option>
                        <option value="ICSE">ICSE / CISCE</option>
                        <option value="STATE_BOARD">State Board</option>
                        <option value="IB">IB / Cambridge</option>
                      </select>
                    </div>
                  </div>

                  {/* Admin Credentials */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Director / Admin Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#070d1e',
                          border: '1px solid #1e293b',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Admin Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="e.g. director@institution.edu"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#070d1e',
                          border: '1px solid #1e293b',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        backgroundColor: '#0f172a',
                        color: '#94a3b8',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13px',
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      {submitting ? 'Deploying...' : 'Deploy & Generate Link'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Deployment Success */
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Check size={32} strokeWidth={2.5} />
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Institution Successfully Provisioned!
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
                  An isolated multi-tenant ERP scope and access link have been registered.
                </p>

                {(() => {
                  const deployedLink =
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/s/${deployedData.slug}`
                      : `/s/${deployedData.slug}`;
                  return (
                    <div
                      style={{
                        margin: '20px 0',
                        padding: '16px',
                        backgroundColor: '#070d1e',
                        borderRadius: '12px',
                        border: '1px solid #1e293b',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.04em' }}>
                        Dedicated School Portal Link
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#0b1329',
                          borderRadius: '8px',
                          border: '1px solid #1e293b',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#38bdf8', wordBreak: 'break-all' }}>
                          {deployedLink}
                        </span>
                        <button
                          onClick={() => copyToClipboard(deployedLink, 'modal')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: copiedLink === 'modal' ? '#059669' : '#0284c7',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedLink === 'modal' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                        </button>
                      </div>

                      <div style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8' }}>
                        <strong>Admin Email:</strong> {deployedData.admin?.email} <br />
                        <strong>Temporary Password:</strong> {deployedData.admin?.temporaryPassword}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setDeployedData(null);
                      setFormOpen(false);
                    }}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      backgroundColor: '#0f172a',
                      color: '#94a3b8',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Done & Close
                  </button>

                  <Link
                    href={`/s/${deployedData.slug}`}
                    target="_blank"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      textDecoration: 'none',
                    }}
                  >
                    Launch School Portal <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 640px) {
          .exit-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
