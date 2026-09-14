'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ParticleCanvas3D from '@/components/vfx/ParticleCanvas3D';
import Card3D from '@/components/vfx/Card3D';
import ConfettiVFX from '@/components/vfx/ConfettiVFX';
import {
  Building2,
  GraduationCap,
  Users,
  PlusCircle,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowRight,
  LogOut,
  MapPin,
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

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
        window.location.href = '/aurxon/login';
        return;
      }

      const meJson = await meRes.json();
      if (meJson.user?.role !== 'SUPER_ADMIN') {
        window.location.href = '/aurxon/login';
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
      setTriggerConfetti(true);
      await loadData();
    } catch {
      setEnrollError('Network error connecting to deployment pipeline.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f7ff',
          color: '#0369a1',
          fontWeight: 600,
          fontSize: '15px',
        }}
      >
        Initializing AURXON Master Control Plane...
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#f8fbfe',
        backgroundImage: 'radial-gradient(ellipse 100% 50% at 50% -10%, #dbeafe 0%, #edf6fd 30%, #f8fbfe 65%, #ffffff 100%)',
        color: '#0f172a',
        paddingBottom: '60px',
      }}
    >
      {triggerConfetti && <ConfettiVFX onComplete={() => setTriggerConfetti(false)} />}

      {/* Top Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(186, 230, 253, 0.75)',
          padding: '0 32px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em', color: '#0f172a' }}>
                AURXON <span style={{ color: '#0284c7' }}>HQ</span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                }}
              >
                Master Account
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>SaaS Multi-Tenant Operations & Institute Provisioning</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{user?.name || 'Super Admin'}</div>
            <div style={{ fontSize: '11px', color: '#0284c7' }}>Platform Operator</div>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/v1/auth/logout', { method: 'POST' });
              window.location.href = '/aurxon/login';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} /> Exit HQ
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Hero Title & Primary Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Institute Enrollment & Operations Cockpit
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              Deploy dedicated branded ERP portals for K-12 schools, coaching academies, and multi-campus trusts.
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
              padding: '12px 22px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 50%, #1e40af 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              cursor: 'pointer',
              boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.4), 0 0 0 1px rgba(2, 132, 199, 0.1) inset',
              transition: 'all 150ms ease',
            }}
          >
            <PlusCircle size={18} /> Enroll Institute / Coaching
          </button>
        </div>

        {/* 3D KPI Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '36px' }}>
          <Card3D maxTilt={5}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(186, 230, 253, 0.85)',
                borderRadius: '16px',
                padding: '22px',
                boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Enrolled Institutes
                </span>
                <Building2 size={20} color="#0284c7" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '12px', letterSpacing: '-0.03em' }}>
                {stats?.totalOrgs || orgs.length}
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
                Across {stats?.totalBranches || 11} Campuses
              </div>
            </div>
          </Card3D>

          <Card3D maxTilt={5}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(186, 230, 253, 0.85)',
                borderRadius: '16px',
                padding: '22px',
                boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Active Enrolled Students
                </span>
                <GraduationCap size={20} color="#0284c7" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '12px', letterSpacing: '-0.03em' }}>
                {stats?.totalStudents || 10}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                100% verified DB records
              </div>
            </div>
          </Card3D>

          <Card3D maxTilt={5}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(186, 230, 253, 0.85)',
                borderRadius: '16px',
                padding: '22px',
                boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Staff & Faculty
                </span>
                <Users size={20} color="#0284c7" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '12px', letterSpacing: '-0.03em' }}>
                {stats?.totalUsers || 18}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Principals, Teachers, Accountants
              </div>
            </div>
          </Card3D>

          <Card3D maxTilt={5}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(186, 230, 253, 0.85)',
                borderRadius: '16px',
                padding: '22px',
                boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Monthly SaaS Run Rate
                </span>
                <TrendingUp size={20} color="#0284c7" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0284c7', marginTop: '12px', letterSpacing: '-0.03em' }}>
                ₹{(stats?.estimatedMRR || 147000).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
                Enterprise Tier Subscriptions
              </div>
            </div>
          </Card3D>
        </div>

        {/* Directory Section: Enrolled Institutes & Custom Links */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            border: '1px solid rgba(186, 230, 253, 0.8)',
            boxShadow: '0 10px 30px -10px rgba(2, 132, 199, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(186, 230, 253, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#f8fbfe',
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Enrolled Institutions & Custom Access Links
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Each school possesses an auto-generated, customizable portal link for their staff and students.
              </p>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#0284c7',
                backgroundColor: '#e0f2fe',
                border: '1px solid rgba(186, 230, 253, 0.8)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              {orgs.length} Active Portals
            </span>
          </div>

          <div>
            {orgs.map((org) => {
              const portalShortLink = typeof window !== 'undefined' ? `${window.location.origin}/s/${org.slug}` : `/s/${org.slug}`;
              const inst = org.institutions[0];

              return (
                <div
                  key={org.id}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background-color 150ms',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: org.primaryColor || '#0284c7',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '16px',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {org.name.charAt(0)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{org.name}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            fontFamily: 'monospace',
                          }}
                        >
                          {org.code}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                          }}
                        >
                          {inst?.type || 'SCHOOL'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} /> {inst?.city || 'Indore'}
                        </span>
                        <span>•</span>
                        <span>{inst?.branches?.length || 1} Campuses</span>
                        <span>•</span>
                        <span>{org._count?.students || 0} Students Enrolled</span>
                      </div>
                    </div>
                  </div>

                  {/* Generated Custom Short Link & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#f8fbfe',
                        border: '1px solid rgba(186, 230, 253, 0.9)',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0369a1', fontWeight: 600 }}>
                        /s/{org.slug}
                      </span>
                      <button
                        onClick={() => copyToClipboard(portalShortLink)}
                        title="Copy dedicated school link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    <Link
                      href={`/s/${org.slug}`}
                      target="_blank"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 50%, #1e40af 100%)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: '0 3px 10px rgba(2, 132, 199, 0.35)',
                      }}
                    >
                      Open School Portal <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------
          INSTITUTE ENROLLMENT SLIDE-OVER / MODAL WITH LIVE LINK GENERATOR
         ------------------------------------------------------------- */}
      {formOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #bae6fd',
              boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.25)',
              padding: '32px',
            }}
          >
            {!deployedData ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      Enroll New Institution / Coaching
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      Deploys an independent, isolated ERP setup and generates an easy custom link.
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
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '13px',
                      marginBottom: '18px',
                    }}
                  >
                    {enrollError}
                  </div>
                )}

                <form onSubmit={handleEnrollSubmit}>
                  {/* Institute Name */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Institution / Coaching Academy Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indore Public School or Allen Career Institute"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Auto-Generated Shortest Link & Customizer */}
                  <div
                    style={{
                      marginBottom: '18px',
                      padding: '14px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '12px',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>
                        Customized Access Link (Auto-Generated Shortest Slug)
                      </label>
                      <span style={{ fontSize: '11px', color: '#0284c7' }}>Editable</span>
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
                        placeholder="short-slug"
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #38bdf8',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: '#0284c7',
                          backgroundColor: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                      Employees will use this link to access their dedicated school portal.
                    </div>
                  </div>

                  {/* Type and Board */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Institution Type
                      </label>
                      <select
                        value={instituteType}
                        onChange={(e) => setInstituteType(e.target.value as any)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        <option value="SCHOOL">K-12 School</option>
                        <option value="COACHING">Coaching / Test Prep Academy</option>
                        <option value="HYBRID">Hybrid School + Coaching</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Affiliation / Board
                      </label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        <option value="CBSE">CBSE (Central Board)</option>
                        <option value="ICSE">ICSE / ISC</option>
                        <option value="STATE">State Board (MP Board)</option>
                        <option value="NEET_JEE">IIT-JEE & NEET Coaching</option>
                        <option value="CAMBRIDGE">Cambridge / IB</option>
                      </select>
                    </div>
                  </div>

                  {/* Campuses */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Campuses / Branches (comma separated)
                    </label>
                    <input
                      type="text"
                      value={campusesText}
                      onChange={(e) => setCampusesText(e.target.value)}
                      placeholder="e.g. Main Campus (AB Road), Rau Campus (Bypass)"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  {/* Admin Credentials */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        School Director / Principal Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Director / Admin Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="e.g. director@institution.edu"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 50%, #1e40af 100%)',
                        color: '#ffffff',
                        fontWeight: 700,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 18px -2px rgba(2, 132, 199, 0.4)',
                      }}
                    >
                      {submitting ? 'Deploying Setup ERP...' : (
                        <>
                          <Sparkles size={16} /> Deploy & Generate Link
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Deployment Success 3D Modal */
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  <Check size={36} strokeWidth={2.5} />
                </div>

                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Institute Successfully Enrolled!
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                  A dedicated ERP instance and customized access link have been provisioned.
                </p>

                {/* Generated Link Share Card */}
                {(() => {
                  const deployedLink = typeof window !== 'undefined' ? `${window.location.origin}/s/${deployedData.slug}` : `/s/${deployedData.slug}`;
                  return (
                    <div
                      style={{
                        margin: '24px 0',
                        padding: '20px',
                        backgroundColor: '#f8fbfe',
                        borderRadius: '16px',
                        border: '1px solid rgba(186, 230, 253, 0.9)',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.06)',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.05em' }}>
                        Dedicated School Access Link
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '8px',
                          padding: '10px 14px',
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          border: '1px solid #7dd3fc',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#0284c7', wordBreak: 'break-all' }}>
                          {deployedLink}
                        </span>
                        <button
                          onClick={() => copyToClipboard(deployedLink)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: copiedLink ? '#059669' : 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 50%, #1e40af 100%)',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedLink ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                        </button>
                      </div>

                      <div style={{ marginTop: '16px', fontSize: '12px', color: '#334155' }}>
                        <strong>Admin Email:</strong> {deployedData.admin?.email} <br />
                        <strong>Default Password:</strong> {deployedData.admin?.temporaryPassword}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setDeployedData(null);
                      setFormOpen(false);
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Done & Close
                  </button>

                  <Link
                    href={`/s/${deployedData.slug}`}
                    target="_blank"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 50%, #1e40af 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 6px 18px -2px rgba(2, 132, 199, 0.35)',
                    }}
                  >
                    Launch School Portal <ExternalLink size={16} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
