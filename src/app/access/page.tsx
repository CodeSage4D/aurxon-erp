'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Mail,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Building2,
  GraduationCap,
  Users,
  DollarSign,
  School,
  KeyRound,
  Compass,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';
import ParticleCanvas3D from '@/components/vfx/ParticleCanvas3D';
import Card3D from '@/components/vfx/Card3D';

interface CredentialItem {
  id: string;
  name: string;
  role: string;
  roleBadge: string;
  email: string;
  password: string;
  entity: string;
  type: 'PLATFORM' | 'SCHOOL' | 'COACHING';
  portalUrl?: string;
  shortestLink?: string;
  destination: string;
  description: string;
  board?: string;
  campuses?: string;
}

const CREDENTIAL_REGISTRY: CredentialItem[] = [
  {
    id: 'c-superadmin',
    name: 'Vikramaditya Singhania',
    role: 'SUPER_ADMIN',
    roleBadge: 'Platform Super Admin',
    email: 'superadmin@aurxon.io',
    password: 'Password@123',
    entity: 'AURXON Cloud Platform',
    type: 'PLATFORM',
    destination: '/aurxon',
    description: 'Master operator access: provision institutions, manage SaaS plans, inspect system audit trail.',
  },
  {
    id: 'c-dps-principal',
    name: 'Dr. Meenakshi Sundaram',
    role: 'PRINCIPAL',
    roleBadge: 'School Principal',
    email: 'principal.rkp@dps-society.edu',
    password: 'Password@123',
    entity: 'Delhi Public School, R.K. Puram',
    type: 'SCHOOL',
    board: 'CBSE',
    campuses: 'Senior Wing Campus',
    shortestLink: '/s/dps',
    portalUrl: '/s/dps',
    destination: '/dashboard',
    description: 'Executive campus command: academic mastery, student records, CBSE 9-point assessments.',
  },
  {
    id: 'c-dps-teacher',
    name: 'Amit Kulkarni',
    role: 'TEACHER',
    roleBadge: 'Mathematics Faculty',
    email: 'teacher.math@dps-society.edu',
    password: 'Password@123',
    entity: 'Delhi Public School Society',
    type: 'SCHOOL',
    board: 'CBSE',
    shortestLink: '/s/dps',
    portalUrl: '/s/dps',
    destination: '/dashboard',
    description: 'Classroom portal: daily roll-call attendance, exam marks entry, timetable schedule.',
  },
  {
    id: 'c-dps-accountant',
    name: 'Ramesh Bansal',
    role: 'ACCOUNTANT',
    roleBadge: 'Fee Bursar / Accountant',
    email: 'accountant@dps-society.edu',
    password: 'Password@123',
    entity: 'Delhi Public School Society',
    type: 'SCHOOL',
    board: 'CBSE',
    shortestLink: '/s/dps',
    portalUrl: '/s/dps',
    destination: '/dashboard',
    description: 'Collections hub: fee structures, computerized receipts, quarterly payment reconciliations.',
  },
  {
    id: 'c-sharma-director',
    name: 'Rameshwar Sharma',
    role: 'ORG_ADMIN',
    roleBadge: 'Group Managing Director',
    email: 'director@sharma-group.in',
    password: 'Password@123',
    entity: 'Sharma Education Group',
    type: 'SCHOOL',
    board: 'CBSE',
    campuses: 'Indore Main & Rau Campus',
    shortestLink: '/s/sharma',
    portalUrl: '/s/sharma',
    destination: '/dashboard',
    description: 'Multi-campus network executive: cross-branch benchmarks, admissions pipeline, fee oversight.',
  },
  {
    id: 'c-sharma-principal',
    name: 'Meenakshi Verma',
    role: 'PRINCIPAL',
    roleBadge: 'Main Campus Principal',
    email: 'principal.sps@sharma-group.in',
    password: 'Password@123',
    entity: 'Sharma Public School (Indore)',
    type: 'SCHOOL',
    board: 'CBSE',
    shortestLink: '/s/sharma',
    portalUrl: '/s/sharma',
    destination: '/dashboard',
    description: 'Single-campus operational command: attendance registers, timetable slots, teacher routines.',
  },
  {
    id: 'c-sharma-teacher',
    name: 'Anita Saxena',
    role: 'TEACHER',
    roleBadge: 'Science Faculty',
    email: 'teacher.sharma@sharma-group.in',
    password: 'Password@123',
    entity: 'Sharma Public School',
    type: 'SCHOOL',
    board: 'CBSE',
    shortestLink: '/s/sharma',
    portalUrl: '/s/sharma',
    destination: '/dashboard',
    description: 'Faculty schedule & gradebook: subject assignments, student attendance, lab sessions.',
  },
  {
    id: 'c-sharma-accountant',
    name: 'Rajesh Verma',
    role: 'ACCOUNTANT',
    roleBadge: 'Senior Accountant',
    email: 'accountant.sharma@sharma-group.in',
    password: 'Password@123',
    entity: 'Sharma Education Group',
    type: 'SCHOOL',
    board: 'CBSE',
    shortestLink: '/s/sharma',
    portalUrl: '/s/sharma',
    destination: '/dashboard',
    description: 'Ledger management: student fee heads, defaulter tracking, income & expenses.',
  },
  {
    id: 'c-apex-director',
    name: 'Alok Gupta',
    role: 'ORG_ADMIN',
    roleBadge: 'Coaching Center Director',
    email: 'admin@apex-coaching.edu',
    password: 'Password@123',
    entity: 'Apex Career Institute (Kota)',
    type: 'COACHING',
    board: 'NEET & IIT-JEE',
    shortestLink: '/s/apex',
    portalUrl: '/s/apex',
    destination: '/dashboard',
    description: 'Competitive coaching command: batch scheduling, mock test scores, target enrollment.',
  },
  {
    id: 'c-apex-faculty',
    name: 'Prof. Hemant Tripathi',
    role: 'FACULTY',
    roleBadge: 'Physics Senior Faculty',
    email: 'faculty.physics@apex-coaching.edu',
    password: 'Password@123',
    entity: 'Apex Career Institute Network',
    type: 'COACHING',
    board: 'IIT-JEE',
    shortestLink: '/s/apex',
    portalUrl: '/s/apex',
    destination: '/dashboard',
    description: 'Faculty lecture schedules: batch attendance, test analytics, assignment distribution.',
  },
  {
    id: 'c-giws-principal',
    name: 'Aditya Chouhan',
    role: 'ORG_ADMIN',
    roleBadge: 'School Founder & Principal',
    email: 'aditya.chouhan@giws.edu.in',
    password: 'Password@123',
    entity: 'Greenwood World Academy',
    type: 'SCHOOL',
    board: 'CBSE',
    campuses: 'Super Corridor Campus',
    shortestLink: '/s/giws',
    portalUrl: '/s/giws',
    destination: '/dashboard',
    description: 'Newly onboarded institution: classes 9-12, campus branches, real-time onboarding setup.',
  },
];

export default function AccessDirectoryPage() {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loggingInId, setLoggingInId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PLATFORM' | 'SCHOOL' | 'COACHING'>('ALL');
  const [showPassword, setShowPassword] = useState(false);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInstantLogin = async (cred: CredentialItem) => {
    setLoggingInId(cred.id);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cred.email, password: cred.password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(cred.destination);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch {
      alert('Network error connecting to login service');
    } finally {
      setLoggingInId(null);
    }
  };

  const filteredCredentials = CREDENTIAL_REGISTRY.filter((c) => {
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleBadge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 30%, #f8fafc 70%, #eff6ff 100%)',
        color: '#0f172a',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      {/* 3D Particle Constellation Background */}
      <ParticleCanvas3D particleCount={50} color="rgba(2, 132, 199, " />

      {/* Top Glass Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 4px 20px -2px rgba(2, 132, 199, 0.08)',
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0369a1', letterSpacing: '-0.02em' }}>
                  AURXON <span style={{ color: '#0ea5e9' }}>ACCESS</span>
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                  Verified ID & Password Directory
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Hub Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/aurxon"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                backgroundColor: '#f0f9ff',
                color: '#0284c7',
                border: '1px solid #bae6fd',
                textDecoration: 'none',
              }}
            >
              <Shield size={14} />
              <span>AURXON HQ Panel</span>
            </Link>

            <Link
              href="/onboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              <Building2 size={14} />
              <span>Onboard Organization</span>
            </Link>

            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                textDecoration: 'none',
              }}
            >
              <span>Standard Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main style={{ maxWidth: '1280px', margin: '32px auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '12px',
              border: '1px solid #bae6fd',
            }}
          >
            <Sparkles size={14} /> 1-CLICK INSTANT EVALUATOR GATEWAY
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#0c4a6e',
              margin: '0 0 8px',
              letterSpacing: '-0.03em',
            }}
          >
            System Credentials & Portal Access Directory
          </h1>
          <p style={{ fontSize: '15px', color: '#475569', maxWidth: '680px', margin: '0 auto', lineHeight: '1.6' }}>
            Every authenticated user account in the AURXON multi-tenant network is listed below with verified
            credentials, direct shortest links, and 1-click login triggers.
          </p>
        </div>

        {/* 3 Top Gateway Cards (AURXON HQ, Onboarding, and Branded Portals) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {/* Card 1: AURXON Master Control */}
          <Card3D
            maxTilt={5}
            glareOpacity={0.2}
            style={{
              background: 'linear-gradient(135deg, #0c1524 0%, #172554 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(12, 21, 36, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.06em' }}>
                MASTER CONTROL PLANE
              </span>
              <Shield size={18} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
              AURXON SaaS HQ Cockpit
            </h3>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px', lineHeight: '1.4' }}>
              Super Admin operator portal: enroll institutions, monitor multi-tenant telemetry, manage SaaS licenses.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                href="/aurxon"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <span>Launch Cockpit</span>
                <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() =>
                  handleInstantLogin({
                    id: 'c-superadmin',
                    name: 'Super Admin',
                    role: 'SUPER_ADMIN',
                    roleBadge: 'Super Admin',
                    email: 'superadmin@aurxon.io',
                    password: 'Password@123',
                    entity: 'AURXON SaaS',
                    type: 'PLATFORM',
                    destination: '/aurxon',
                    description: '',
                  })
                }
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                1-Click Login
              </button>
            </div>
          </Card3D>

          {/* Card 2: Organization Onboard Wizard */}
          <Card3D
            maxTilt={5}
            glareOpacity={0.2}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', letterSpacing: '0.06em' }}>
                SELF-SERVICE ONBOARDING
              </span>
              <Building2 size={18} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#14532d' }}>
              Onboard Your School
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px', lineHeight: '1.4' }}>
              Register a new school or coaching academy in 60 seconds with an auto-generated shortest link (`/s/[slug]`).
            </p>
            <Link
              href="/onboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>Launch Onboarding Wizard</span>
              <ArrowRight size={14} />
            </Link>
          </Card3D>

          {/* Card 3: School Shortest Links Showcase */}
          <Card3D
            maxTilt={5}
            glareOpacity={0.2}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', letterSpacing: '0.06em' }}>
                DEDICATED BRANDED ERP
              </span>
              <Compass size={18} color="#0284c7" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0c4a6e' }}>
              Shortest School Links
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px', lineHeight: '1.4' }}>
              Clean, branded access portals: `/s/dps`, `/s/sharma`, `/s/apex`, `/s/giws` with employee & student access.
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Link
                href="/s/dps"
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                /s/dps
              </Link>
              <Link
                href="/s/sharma"
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                /s/sharma
              </Link>
              <Link
                href="/s/apex"
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                /s/apex
              </Link>
              <Link
                href="/s/giws"
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                /s/giws
              </Link>
            </div>
          </Card3D>
        </div>

        {/* Search & Filter Controls */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.06)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, school, or role..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {(['ALL', 'PLATFORM', 'SCHOOL', 'COACHING'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: typeFilter === t ? '#0284c7' : '#f1f5f9',
                  color: typeFilter === t ? '#ffffff' : '#64748b',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {t === 'ALL' ? 'All Roles' : t}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                marginLeft: '8px',
              }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPassword ? 'Hide Passwords' : 'Reveal Passwords'}</span>
            </button>
          </div>
        </div>

        {/* Credentials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '18px',
          }}
        >
          {filteredCredentials.map((c) => {
            const isLoggingIn = loggingInId === c.id;

            return (
              <Card3D
                key={c.id}
                maxTilt={4}
                glareOpacity={0.15}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Entity & Role Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor:
                          c.type === 'PLATFORM'
                            ? '#0c1524'
                            : c.type === 'COACHING'
                            ? '#f3e8ff'
                            : '#e0f2fe',
                        color:
                          c.type === 'PLATFORM'
                            ? '#38bdf8'
                            : c.type === 'COACHING'
                            ? '#7e22ce'
                            : '#0369a1',
                      }}
                    >
                      {c.roleBadge}
                    </span>

                    {c.shortestLink && (
                      <Link
                        href={c.shortestLink}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#0284c7',
                          backgroundColor: '#f0f9ff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #bae6fd',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <span>{c.shortestLink}</span>
                        <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>

                  {/* Name and Entity */}
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                    {c.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    {c.entity} {c.board ? `• ${c.board}` : ''}
                  </div>

                  {/* Credentials Box */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      marginBottom: '14px',
                    }}
                  >
                    {/* Email / ID */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Mail size={13} color="#94a3b8" />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{c.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(c.email, `${c.id}-email`)}
                        title="Copy Email ID"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedKey === `${c.id}-email` ? '#10b981' : '#94a3b8',
                          padding: '2px',
                        }}
                      >
                        {copiedKey === `${c.id}-email` ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Password */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Lock size={13} color="#94a3b8" />
                        <span style={{ fontFamily: 'monospace', color: '#475569' }}>
                          {showPassword ? c.password : '••••••••••••'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(c.password, `${c.id}-pwd`)}
                        title="Copy Password"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedKey === `${c.id}-pwd` ? '#10b981' : '#94a3b8',
                          padding: '2px',
                        }}
                      >
                        {copiedKey === `${c.id}-pwd` ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 16px', lineHeight: '1.4' }}>
                    {c.description}
                  </p>
                </div>

                {/* 1-Click Launch Button */}
                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={() => handleInstantLogin(c)}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background:
                      c.type === 'PLATFORM'
                        ? 'linear-gradient(135deg, #0c1524 0%, #1e293b 100%)'
                        : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isLoggingIn ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>1-Click Sign In as {c.name.split(' ')[0]}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </Card3D>
            );
          })}
        </div>
      </main>
    </div>
  );
}
