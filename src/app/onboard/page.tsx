'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Mail,
  User,
  MapPin,
  Compass,
  ArrowRight,
  ArrowLeft,
  FileText,
  Phone,
  HelpCircle,
  AlertCircle,
  Award,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  // Wizard Steps: 1. Org Details, 2. Institution & Branch, 3. Compliance & Docs, 4. Admin User, 5. Review & Submit
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State - Step 1: Org Details
  const [orgName, setOrgName] = useState('Shri Ram International School');
  const [orgType, setOrgType] = useState<'SCHOOL' | 'COACHING' | 'HYBRID'>('SCHOOL');
  const [contactEmail, setContactEmail] = useState('contact@sris-edu.in');
  const [phone, setPhone] = useState('+91 98765 43210');

  // Step 2: Institution & Branch
  const [instName, setInstName] = useState('Shri Ram Public School');
  const [board, setBoard] = useState<'CBSE' | 'ICSE' | 'STATE' | 'NEET_JEE' | 'CAMBRIDGE'>('CBSE');
  const [address, setAddress] = useState('Plot 42, Super Corridor, MR-10');
  const [city, setCity] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('452001');
  const [branches, setBranches] = useState<string[]>(['Main Campus']);
  const [newBranchInput, setNewBranchInput] = useState('');

  // Step 3: Compliance & Documents
  const [udiseCode, setUdiseCode] = useState('23260100412');
  const [affiliationNo, setAffiliationNo] = useState('CBSE/AFF/1030992');
  const [customSlug, setCustomSlug] = useState('sris');
  const [isCustomizingSlug, setIsCustomizingSlug] = useState(false);

  // Step 4: Admin User
  const [adminName, setAdminName] = useState('Dr. Raghav Sharma');
  const [adminEmail, setAdminEmail] = useState('principal@sris-edu.in');
  const [adminPhone, setAdminPhone] = useState('+91 98765 43210');
  const [adminPassword, setAdminPassword] = useState('Password@123');

  // Step 5: Terms Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Success result
  const [registeredResult, setRegisteredResult] = useState<{
    slug: string;
    orgName: string;
    portalUrl: string;
  } | null>(null);

  // Auto-slug generator when org name changes
  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
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

  const removeBranch = (idx: number) => {
    if (branches.length > 1) {
      setBranches(branches.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          customSlug: customSlug || undefined,
          type: orgType,
          board,
          city,
          branches,
          adminName,
          adminEmail,
          adminPassword,
          modules: ['ACADEMICS', 'ATTENDANCE', 'EXAMINATIONS', 'FEES', 'TRANSPORT', 'LIBRARY', 'STAFF_HR', 'REPORTS', 'INVENTORY'],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to complete registration.');
        setSubmitting(false);
        return;
      }

      setRegisteredResult({
        slug: data.data.slug,
        orgName: data.data.name,
        portalUrl: data.data.portalUrl,
      });
    } catch {
      setErrorMsg('Network error connecting to registration service.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShortLink = () => {
    if (registeredResult && typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}/s/${registeredResult.slug}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
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
      {/* Top Bar */}
      <header
        style={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '14px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
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
                fontSize: '16px',
              }}
            >
              A
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0c4a6e', letterSpacing: '-0.02em' }}>
                AURXON
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px', textTransform: 'uppercase', fontWeight: 700 }}>
                Onboarding Portal
              </span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/login"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748b',
                textDecoration: 'none',
              }}
            >
              Already Registered? Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {registeredResult ? (
            /* SUCCESS CONFIRMATION SCREEN (Blueprint Section 3: After Submission) */
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '48px 36px',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Registration Submitted Successfully!
              </h1>
              <p style={{ fontSize: '14.5px', color: '#64748b', maxWidth: '540px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                Your institution <strong>{registeredResult.orgName}</strong> is now registered on AURXON.
                Your dedicated workspace has been provisioned.
              </p>

              {/* Direct Workspace Link Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '20px',
                  maxWidth: '520px',
                  margin: '0 auto 32px',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Your School Dedicated Workspace URL
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0284c7' }}>
                    aurxon.app/s/{registeredResult.slug}
                  </span>
                  <button
                    onClick={copyShortLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedLink ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  href={`/s/${registeredResult.slug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>Go to School Workspace</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    fontSize: '14px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span>Open Executive Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            /* MULTI-STEP ONBOARDING WIZARD */
            <div>
              {/* Wizard Steps Indicator (Blueprint Section 3) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '32px',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '16px',
                }}
              >
                {[
                  { num: 1, label: 'Organization Details' },
                  { num: 2, label: 'Institution & Branch' },
                  { num: 3, label: 'Compliance & Docs' },
                  { num: 4, label: 'Admin User' },
                  { num: 5, label: 'Review & Submit' },
                ].map((step) => {
                  const isActive = step.num === currentStep;
                  const isCompleted = step.num < currentStep;
                  return (
                    <div
                      key={step.num}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: isCompleted ? 'pointer' : 'default',
                      }}
                      onClick={() => isCompleted && setCurrentStep(step.num)}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isActive ? '#0284c7' : isCompleted ? '#ecfdf5' : '#f1f5f9',
                          color: isActive ? '#ffffff' : isCompleted ? '#059669' : '#64748b',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isCompleted ? <Check size={15} /> : step.num}
                      </div>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#0f172a' : '#64748b',
                          display: 'none',
                        }}
                        className="wizard-step-label"
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '13px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: ORGANIZATION DETAILS */}
              {currentStep === 1 && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '32px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                    1. Organization Details
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
                    Enter the legal name and commercial details of your school, coaching institute, or education trust.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => handleOrgNameChange(e.target.value)}
                        placeholder="e.g. ABC Education Group"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Organization Type
                      </label>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        {[
                          { id: 'SCHOOL', label: 'School' },
                          { id: 'COACHING', label: 'Coaching Institute' },
                          { id: 'HYBRID', label: 'Both (School + Coaching)' },
                        ].map((opt) => (
                          <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="orgType"
                              checked={orgType === opt.id}
                              onChange={() => setOrgType(opt.id as any)}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Official Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="admin@yourorganization.com"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Phone Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Next: Institution & Branch</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: INSTITUTION & BRANCH */}
              {currentStep === 2 && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '32px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                    2. Primary Institution & Branch
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
                    Define the operational educational institution and physical campus branch.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Institution Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={instName}
                        onChange={(e) => setInstName(e.target.value)}
                        placeholder="e.g. ABC Public School"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Board / Curriculum *
                      </label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          outline: 'none',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <option value="CBSE">Central Board of Secondary Education (CBSE)</option>
                        <option value="ICSE">Council for the Indian School Certificate Examinations (ICSE)</option>
                        <option value="STATE">State Secondary Education Board</option>
                        <option value="NEET_JEE">IIT-JEE & NEET Competitive Coaching Track</option>
                        <option value="CAMBRIDGE">Cambridge / International Baccalaureate</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Physical Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Campus street address"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Indore"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          State
                        </label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="Madhya Pradesh"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="452001"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Branches / Campuses
                      </label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={newBranchInput}
                          onChange={(e) => setNewBranchInput(e.target.value)}
                          placeholder="Add another branch (e.g. Rau Campus)"
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={addBranch}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          + Add Branch
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {branches.map((b, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              fontSize: '12.5px',
                              fontWeight: 600,
                            }}
                          >
                            <span>{b}</span>
                            {branches.length > 1 && (
                              <span
                                onClick={() => removeBranch(idx)}
                                style={{ cursor: 'pointer', fontWeight: 700 }}
                              >
                                ×
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Next: Compliance & Docs</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: COMPLIANCE & DOCUMENTS */}
              {currentStep === 3 && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '32px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                    3. Compliance & Dedicated Link
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
                    Enter regulatory identifiers to ensure national compliance and customize your shortest school link.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        U-DISE+ Code (if applicable)
                      </label>
                      <input
                        type="text"
                        value={udiseCode}
                        onChange={(e) => setUdiseCode(e.target.value)}
                        placeholder="Enter 11-digit U-DISE+ School Code"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Affiliation / Recognition Number
                      </label>
                      <input
                        type="text"
                        value={affiliationNo}
                        onChange={(e) => setAffiliationNo(e.target.value)}
                        placeholder="Enter CBSE/ICSE/State Board Affiliation Number"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Shortest Link Customization */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Custom Shortest School Portal URL
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                        <span style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b', backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                          aurxon.app/s/
                        </span>
                        <input
                          type="text"
                          value={customSlug}
                          onChange={(e) => {
                            setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                            setIsCustomizingSlug(true);
                          }}
                          placeholder="sris"
                          style={{
                            padding: '8px 12px',
                            border: 'none',
                            outline: 'none',
                            fontSize: '14px',
                            color: '#0284c7',
                            fontWeight: 700,
                            flex: 1,
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                        This creates your clean, shortest fast-path URL for students and employees.
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Next: Admin User</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: ADMIN USER ACCOUNT */}
              {currentStep === 4 && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '32px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                    4. Primary Administrator Profile
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
                    Create the super user account that will manage your organization&apos;s ERP operations.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Dr. Raghav Sharma"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Official Admin Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="principal@sris-edu.in"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Choose a strong password"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                        Must be at least 8 characters with at least one number and special character.
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Next: Review & Submit</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & SUBMIT */}
              {currentStep === 5 && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '32px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                    5. Review & Submit Registration
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
                    Please review your educational entity details before submitting registration.
                  </p>

                  {/* Summary Card */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      marginBottom: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Organization:</span>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{orgName} ({orgType})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Primary Institution:</span>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{instName} • {board}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Campuses:</span>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{branches.join(', ')} ({city})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Dedicated Portal URL:</span>
                      <strong style={{ fontSize: '13.5px', color: '#0284c7' }}>aurxon.app/s/{customSlug}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Super Administrator:</span>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{adminName} ({adminEmail})</strong>
                    </div>
                  </div>

                  {/* Agreement Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '24px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    <span>I agree to the AURXON Terms of Service and Multi-Tenant Privacy Policy.</span>
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submitting || !agreedToTerms}
                      onClick={handleSubmit}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: submitting || !agreedToTerms ? 'not-allowed' : 'pointer',
                        opacity: submitting || !agreedToTerms ? 0.7 : 1,
                      }}
                    >
                      <span>{submitting ? 'Submitting Registration...' : 'Submit Registration'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
