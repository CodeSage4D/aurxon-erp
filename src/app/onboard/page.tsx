'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  Building2,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Mail,
  User,
  MapPin,
  Compass,
  CheckSquare,
  Square,
  ExternalLink,
  Award,
  Layers,
  KeyRound,
} from 'lucide-react';
import ParticleCanvas3D from '@/components/vfx/ParticleCanvas3D';
import Card3D from '@/components/vfx/Card3D';
import ConfettiVFX from '@/components/vfx/ConfettiVFX';

export default function OnboardingPage() {
  const router = useRouter();

  // Wizard Steps: 1. Identity, 2. Shortest Link, 3. Campuses & Setup, 4. Admin Profile, 5. Success
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [name, setName] = useState('Shri Ram International School');
  const [type, setType] = useState<'SCHOOL' | 'COACHING' | 'HYBRID'>('SCHOOL');
  const [board, setBoard] = useState<'CBSE' | 'ICSE' | 'STATE' | 'NEET_JEE' | 'CAMBRIDGE'>('CBSE');
  const [city, setCity] = useState('Indore');
  const [customSlug, setCustomSlug] = useState('sris');
  const [isCustomizingSlug, setIsCustomizingSlug] = useState(false);

  const [branches, setBranches] = useState<string[]>(['Main Campus', 'City Wing']);
  const [newBranchInput, setNewBranchInput] = useState('');

  const [adminName, setAdminName] = useState('Dr. Raghav Sharma');
  const [adminEmail, setAdminEmail] = useState('principal@sris-edu.in');
  const [adminPassword, setAdminPassword] = useState('Password@123');

  const [selectedModules, setSelectedModules] = useState<string[]>([
    'ACADEMICS',
    'ATTENDANCE',
    'EXAMINATIONS',
    'FEES',
    'TRANSPORT',
    'LIBRARY',
  ]);

  // Provisioned Result State
  const [provisionedResult, setProvisionedResult] = useState<{
    slug: string;
    portalUrl: string;
    adminEmail: string;
    orgName: string;
  } | null>(null);

  // Helper to auto-generate shortest slug when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isCustomizingSlug) {
      const words = val
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
    }
  };

  const addBranch = () => {
    if (newBranchInput.trim() && !branches.includes(newBranchInput.trim())) {
      setBranches([...branches, newBranchInput.trim()]);
      setNewBranchInput('');
    }
  };

  const removeBranch = (branchToRemove: string) => {
    if (branches.length > 1) {
      setBranches(branches.filter((b) => b !== branchToRemove));
    }
  };

  const toggleModule = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter((m) => m !== mod));
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const handleSubmitOnboarding = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          customSlug: customSlug.trim() || undefined,
          type,
          board,
          city: city.trim(),
          branches,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword,
          modules: selectedModules,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProvisionedResult({
          slug: data.slug,
          portalUrl: data.portalUrl,
          adminEmail: data.credentials?.email,
          orgName: data.organization?.name,
        });
        setCurrentStep(5);
      } else {
        setErrorMsg(data.error || 'Failed to onboard institution. Please verify fields.');
      }
    } catch {
      setErrorMsg('Network error connecting to onboarding engine.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShortestLink = () => {
    if (!provisionedResult) return;
    const url = `${window.location.origin}${provisionedResult.portalUrl}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

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
      {/* 3D Particle Constellation */}
      <ParticleCanvas3D particleCount={55} color="rgba(2, 132, 199, " />

      {/* Confetti Explosion on Step 5 */}
      {currentStep === 5 && <ConfettiVFX trigger={true} />}

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
            maxWidth: '1200px',
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
                <Building2 size={20} />
              </div>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0369a1', letterSpacing: '-0.02em' }}>
                  AURXON <span style={{ color: '#0ea5e9' }}>ONBOARD</span>
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                  Organization Self-Service Wizard
                </span>
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/access"
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
              <KeyRound size={14} />
              <span>IDs & Passwords</span>
            </Link>

            <Link
              href="/aurxon"
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
              <span>AURXON HQ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wizard Arena */}
      <main style={{ maxWidth: '840px', margin: '36px auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        {/* Progress Stepper */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  backgroundColor: currentStep >= 1 ? '#0284c7' : '#e2e8f0',
                  color: currentStep >= 1 ? '#ffffff' : '#64748b',
                  boxShadow: currentStep >= 1 ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {currentStep > 1 ? <Check size={18} /> : '1'}
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: currentStep === 1 ? 700 : 500, color: currentStep >= 1 ? '#0c4a6e' : '#94a3b8' }}>
                Identity
              </span>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  backgroundColor: currentStep >= 2 ? '#0284c7' : '#e2e8f0',
                  color: currentStep >= 2 ? '#ffffff' : '#64748b',
                  boxShadow: currentStep >= 2 ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {currentStep > 2 ? <Check size={18} /> : '2'}
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: currentStep === 2 ? 700 : 500, color: currentStep >= 2 ? '#0c4a6e' : '#94a3b8' }}>
                Shortest Link
              </span>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  backgroundColor: currentStep >= 3 ? '#0284c7' : '#e2e8f0',
                  color: currentStep >= 3 ? '#ffffff' : '#64748b',
                  boxShadow: currentStep >= 3 ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {currentStep > 3 ? <Check size={18} /> : '3'}
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: currentStep === 3 ? 700 : 500, color: currentStep >= 3 ? '#0c4a6e' : '#94a3b8' }}>
                Campuses
              </span>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  backgroundColor: currentStep >= 4 ? '#0284c7' : '#e2e8f0',
                  color: currentStep >= 4 ? '#ffffff' : '#64748b',
                  boxShadow: currentStep >= 4 ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {currentStep > 4 ? <Check size={18} /> : '4'}
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: currentStep === 4 ? 700 : 500, color: currentStep >= 4 ? '#0c4a6e' : '#94a3b8' }}>
                Admin Setup
              </span>
            </div>

            {/* Step 5 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  backgroundColor: currentStep === 5 ? '#10b981' : '#e2e8f0',
                  color: currentStep === 5 ? '#ffffff' : '#64748b',
                  boxShadow: currentStep === 5 ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {currentStep === 5 ? <CheckCircle2 size={18} /> : '5'}
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: currentStep === 5 ? 700 : 500, color: currentStep === 5 ? '#15803d' : '#94a3b8' }}>
                Launch!
              </span>
            </div>

            {/* Connecting Bar */}
            <div
              style={{
                position: 'absolute',
                top: '18px',
                left: '20px',
                right: '20px',
                height: '3px',
                backgroundColor: '#e2e8f0',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((currentStep - 1) / 4) * 100}%`,
                  backgroundColor: '#0284c7',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Wizard Card Container */}
        <Card3D
          maxTilt={4}
          glareOpacity={0.15}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            padding: '36px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 20px 50px -10px rgba(2, 132, 199, 0.15)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {errorMsg && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* STEP 1: IDENTITY */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Sparkles size={14} /> Step 1 of 4 • Institution Profile
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  What is the name of your School or Academy?
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  Enter the registered organization name. We will auto-generate your shortest URL slug.
                </p>
              </div>

              {/* Institution Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Official School / Organization Name
                </label>
                <div style={{ position: 'relative' }}>
                  <School size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. St. Xavier's International School"
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 40px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Type and Board */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Institution Type
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="SCHOOL">K-12 School (Primary to 12th)</option>
                    <option value="COACHING">Coaching Academy (IIT-JEE / NEET)</option>
                    <option value="HYBRID">Integrated School + Coaching</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Governing Board
                  </label>
                  <select
                    value={board}
                    onChange={(e: any) => setBoard(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="CBSE">CBSE (9-Point Scale & NEP 2020)</option>
                    <option value="ICSE">ICSE / CISCE Board</option>
                    <option value="STATE">State Board (MP / Maharashtra / etc.)</option>
                    <option value="NEET_JEE">NEET & JEE Competitive Track</option>
                    <option value="CAMBRIDGE">Cambridge / IB International</option>
                  </select>
                </div>
              </div>

              {/* City and State */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Campus Headquarter City
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Indore, Bhopal, Delhi"
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 40px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <span>Continue to Shortest Link</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SHORTEST LINK & CUSTOM SLUG */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Sparkles size={14} /> Step 2 of 4 • Clean Shortest URL
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Auto-Generated Shortest Link
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  This short, beautiful link is what your teachers, staff, and students will use to access their ERP.
                </p>
              </div>

              {/* Shortest Link Preview Card */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1.5px solid #bae6fd',
                  marginBottom: '24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: '8px' }}>
                  YOUR SCHOOL&apos;S DIRECT PORTAL URL
                </div>

                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#0c4a6e',
                    fontFamily: 'monospace',
                    letterSpacing: '-0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ color: '#64748b' }}>aurxon.io/s/</span>
                  <span style={{ color: '#0284c7', textDecoration: 'underline' }}>{customSlug || 'myschool'}</span>
                </div>

                <p style={{ fontSize: '12.5px', color: '#475569', marginTop: '10px', marginBottom: 0 }}>
                  Generated from: <strong>{name}</strong>
                </p>
              </div>

              {/* Custom Slug Editor */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Customized Short Slug
                  </label>
                  <span style={{ fontSize: '11.5px', color: '#0284c7' }}>
                    Lowercase letters, numbers and hyphens
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '10px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#64748b', border: '1px solid #cbd5e1' }}>
                    /s/
                  </span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => {
                      setIsCustomizingSlug(true);
                      setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    placeholder="e.g. sris or shram"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0284c7',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <span>Configure Campuses</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CAMPUSES & STRUCTURE */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Sparkles size={14} /> Step 3 of 4 • Multi-Campus & Academic Cycle
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Add Campus Branches & Facilities
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  AURXON supports multi-branch structures. You can add more campuses or stick with Main Campus.
                </p>
              </div>

              {/* Campus Branches List */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Active Campuses ({branches.length})
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {branches.map((bName, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                        {idx + 1}. {bName}
                      </span>
                      {branches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBranch(bName)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new branch input */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newBranchInput}
                    onChange={(e) => setNewBranchInput(e.target.value)}
                    placeholder="e.g. Junior Wing, City Campus, Rau Branch"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={addBranch}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Branch
                  </button>
                </div>
              </div>

              {/* Academic Session Notice */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  marginBottom: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '12.5px', color: '#15803d' }}>
                  <strong>Indian Academic Cycle 2026-2027</strong> will be initialized automatically (April 1 to March 31 financial year with standard sections & classes).
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <span>Admin Credentials</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ADMINISTRATOR CREDENTIALS */}
          {currentStep === 4 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Sparkles size={14} /> Step 4 of 4 • Primary Admin & SaaS Modules
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Create Administrator Account
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  This will be the root administrative sign-in for your school or coaching command center.
                </p>
              </div>

              {/* Admin Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Principal / Administrator Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. Raghav Sharma"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Admin Email & Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Official Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="e.g. principal@sris-edu.in"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 40px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Password@123"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 40px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SaaS Modules Multi-Select */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Enabled SaaS Enterprise Modules
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    'ACADEMICS',
                    'ATTENDANCE',
                    'EXAMINATIONS',
                    'FEES',
                    'TRANSPORT',
                    'LIBRARY',
                  ].map((mod) => {
                    const isSelected = selectedModules.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModule(mod)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#f0f9ff' : '#f8fafc',
                          border: `1px solid ${isSelected ? '#bae6fd' : '#e2e8f0'}`,
                          color: isSelected ? '#0369a1' : '#64748b',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {isSelected ? <CheckSquare size={16} color="#0284c7" /> : <Square size={16} />}
                        <span>{mod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCurrentStep(3)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitOnboarding}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? (
                    <span>Provisioning Institution...</span>
                  ) : (
                    <>
                      <span>Complete & Launch School ERP</span>
                      <Sparkles size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PROVISIONED CELEBRATION */}
          {currentStep === 5 && provisionedResult && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  marginBottom: '10px',
                }}
              >
                LIVE ERP DEPLOYED
              </span>

              <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                {provisionedResult.orgName} is Ready!
              </h2>

              <p style={{ fontSize: '14.5px', color: '#475569', maxWidth: '520px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                Your dedicated school ERP has been provisioned with academic sessions, classes, sections, and administrator access.
              </p>

              {/* Dedicated Shortest Link Box */}
              <div
                style={{
                  maxWidth: '480px',
                  margin: '0 auto 28px',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  backgroundColor: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                    YOUR VERIFIED PORTAL LINK
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0c4a6e', fontFamily: 'monospace' }}>
                    aurxon.io/s/{provisionedResult.slug}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyShortestLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: copiedLink ? '#dcfce7' : '#0284c7',
                    color: copiedLink ? '#166534' : '#ffffff',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Direct Actions */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  href="/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 26px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
                  }}
                >
                  <span>Launch School Dashboard</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href={provisionedResult.portalUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    color: '#0369a1',
                    fontSize: '14px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid #bae6fd',
                  }}
                >
                  <span>Open Branded Portal Page</span>
                  <ExternalLink size={15} />
                </Link>
              </div>
            </div>
          )}
        </Card3D>
      </main>
    </div>
  );
}
