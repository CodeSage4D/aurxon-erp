'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlatformShell from '@/components/layout/PlatformShell';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  School,
  GitBranch,
  Layers,
  UserCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export default function PlatformProvisioningPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  // 4-step wizard state
  const [step, setStep] = useState(1);

  // Form State
  const [form, setForm] = useState({
    // Step 1: Organization
    orgName: '',
    orgSlug: '',
    orgCode: '',
    primaryColor: '#1e40af',

    // Step 2: Institution & Branches
    instName: '',
    instCode: '',
    instType: 'SCHOOL',
    board: 'CBSE',
    city: 'Indore',
    state: 'Madhya Pradesh',
    branches: [
      { name: 'Main Campus', code: 'MAIN', city: 'Indore', address: 'AB Road' },
    ],

    // Step 3: Modules & Academic Session
    sessionName: '2025-2026',
    modules: ['TRANSPORT', 'LIBRARY', 'INVENTORY', 'PAYROLL'],

    // Step 4: Initial Admin
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const json = await res.json();
          setUserData(json.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  const handleOrgNameChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const code = val.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    setForm((prev) => ({
      ...prev,
      orgName: val,
      orgSlug: slug,
      orgCode: code || prev.orgCode,
      instName: prev.instName || val,
      instCode: prev.instCode || (code ? `${code}-01` : ''),
    }));
  };

  const addBranch = () => {
    setForm((prev) => ({
      ...prev,
      branches: [
        ...prev.branches,
        { name: `Campus ${prev.branches.length + 1}`, code: `BR-${prev.branches.length + 1}`, city: 'Indore', address: '' },
      ],
    }));
  };

  const updateBranch = (index: number, field: string, value: string) => {
    const updated = [...form.branches];
    updated[index] = { ...updated[index], [field]: value };
    setForm((prev) => ({ ...prev, branches: updated }));
  };

  const removeBranch = (index: number) => {
    if (form.branches.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      branches: prev.branches.filter((_, i) => i !== index),
    }));
  };

  const toggleModule = (mod: string) => {
    setForm((prev) => {
      const exists = prev.modules.includes(mod);
      return {
        ...prev,
        modules: exists ? prev.modules.filter((m) => m !== mod) : [...prev.modules, mod],
      };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        organization: {
          name: form.orgName,
          slug: form.orgSlug,
          code: form.orgCode,
          primaryColor: form.primaryColor,
        },
        institution: {
          name: form.instName,
          code: form.instCode,
          type: form.instType,
          board: form.board,
          city: form.city,
          state: form.state,
        },
        branches: form.branches,
        modules: form.modules,
        academicSession: {
          name: form.sessionName,
        },
        initialAdmin: {
          firstName: form.adminFirstName,
          lastName: form.adminLastName,
          email: form.adminEmail,
          password: form.adminPassword,
          phone: form.adminPhone,
        },
      };

      const res = await fetch('/api/v1/platform/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Provisioning failed');
      }

      setSuccessData(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during provisioning.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !userData) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', color: '#94a3b8' }}>
        Loading Provisioning Engine...
      </div>
    );
  }

  return (
    <PlatformShell user={userData}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Tenant Provisioning Wizard
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '4px 0 0' }}>
            Onboard new educational organizations, configure campuses & provision admin credentials
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          {[
            { num: 1, label: 'Organization Boundary' },
            { num: 2, label: 'Institution & Branches' },
            { num: 3, label: 'Modules & Academics' },
            { num: 4, label: 'Initial Administrator' },
          ].map((s) => (
            <div
              key={s.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: step === s.num ? 1 : step > s.num ? 0.8 : 0.4,
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '9999px',
                  backgroundColor: step > s.num ? '#10b981' : step === s.num ? '#06b6d4' : '#1e293b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '6px', color: '#fecaca', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Confirmation */}
        {successData ? (
          <div className="platform-surface" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '9999px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
              Workspace Provisioned Successfully!
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', maxWidth: '500px', margin: '0 auto 24px' }}>
              The organization, institutions, branches, module entitlements, and initial administrator have been atomically deployed to the database.
            </p>

            <div style={{ backgroundColor: '#131d31', padding: '16px', borderRadius: '6px', maxWidth: '420px', margin: '0 auto 24px', textAlign: 'left', fontSize: '13px', color: '#cbd5e1' }}>
              <div>Organization Code: <strong style={{ color: '#38bdf8' }}>{successData.code}</strong></div>
              <div>Admin Login: <strong style={{ color: '#f8fafc' }}>{successData.adminEmail}</strong></div>
              <div>Configured Campuses: <strong style={{ color: '#f8fafc' }}>{successData.branchesCount}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => router.push('/platform/organizations')}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
              >
                View in Organizations Directory
              </button>
            </div>
          </div>
        ) : (
          <div className="platform-surface">
            {/* STEP 1: ORGANIZATION BOUNDARY */}
            {step === 1 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
                  Organization Commercial Boundary
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 20px' }}>
                  Define the legal entity or educational society owning this tenant workspace.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Organization / Society Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Progressive Education Society"
                      value={form.orgName}
                      onChange={(e) => handleOrgNameChange(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Tenant Identifier Slug *
                      </label>
                      <input
                        type="text"
                        placeholder="progressive-society"
                        value={form.orgSlug}
                        onChange={(e) => setForm({ ...form, orgSlug: e.target.value })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Organization Code *
                      </label>
                      <input
                        type="text"
                        placeholder="PROG"
                        value={form.orgCode}
                        onChange={(e) => setForm({ ...form, orgCode: e.target.value.toUpperCase() })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Primary Brand Color
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                        style={{ border: 'none', width: '42px', height: '38px', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      />
                      <span style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>{form.primaryColor}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button
                    disabled={!form.orgName || !form.orgSlug || !form.orgCode}
                    onClick={() => setStep(2)}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
                  >
                    Next: Institution & Branches <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: INSTITUTION & BRANCHES */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
                  Institution & Campus Architecture
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 20px' }}>
                  Configure the primary school or coaching institute and its physical campuses.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Institution Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Progressive Public School"
                        value={form.instName}
                        onChange={(e) => setForm({ ...form, instName: e.target.value })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Institution Code *
                      </label>
                      <input
                        type="text"
                        placeholder="PPS-01"
                        value={form.instCode}
                        onChange={(e) => setForm({ ...form, instCode: e.target.value.toUpperCase() })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Institution Type
                      </label>
                      <select
                        value={form.instType}
                        onChange={(e) => setForm({ ...form, instType: e.target.value })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                      >
                        <option value="SCHOOL">K-12 School</option>
                        <option value="COACHING">Coaching / Test Prep Institute</option>
                        <option value="HYBRID">Hybrid (School + Integrated Coaching)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Affiliated Board
                      </label>
                      <select
                        value={form.board}
                        onChange={(e) => setForm({ ...form, board: e.target.value })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                      >
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="STATE">State Board (MP Board)</option>
                        <option value="NEET_JEE">NEET / JEE Test Prep</option>
                      </select>
                    </div>
                  </div>

                  {/* Branches list */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                        Campuses / Branches ({form.branches.length})
                      </label>
                      <button
                        type="button"
                        onClick={addBranch}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#38bdf8' }}
                      >
                        + Add Campus
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {form.branches.map((b, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr auto',
                            gap: '10px',
                            backgroundColor: '#131d31',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Campus Name (e.g. Rau Campus)"
                            value={b.name}
                            onChange={(e) => updateBranch(idx, 'name', e.target.value)}
                            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc', padding: '6px 10px', borderRadius: '4px', fontSize: '12.5px' }}
                          />
                          <input
                            type="text"
                            placeholder="Code (e.g. RAU)"
                            value={b.code}
                            onChange={(e) => updateBranch(idx, 'code', e.target.value.toUpperCase())}
                            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc', padding: '6px 10px', borderRadius: '4px', fontSize: '12.5px', fontFamily: 'monospace' }}
                          />
                          <input
                            type="text"
                            placeholder="City (e.g. Indore)"
                            value={b.city}
                            onChange={(e) => updateBranch(idx, 'city', e.target.value)}
                            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc', padding: '6px 10px', borderRadius: '4px', fontSize: '12.5px' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeBranch(idx)}
                            disabled={form.branches.length <= 1}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(1)} className="btn btn-secondary">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    disabled={!form.instName || !form.instCode || form.branches.length === 0}
                    onClick={() => setStep(3)}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
                  >
                    Next: Modules & Academics <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: MODULES & ACADEMICS */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
                  Module Entitlements & Initial Academic Session
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 20px' }}>
                  Select the purchased software modules for this tenant.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Initial Academic Session Name
                    </label>
                    <input
                      type="text"
                      placeholder="2025-2026"
                      value={form.sessionName}
                      onChange={(e) => setForm({ ...form, sessionName: e.target.value })}
                      style={{ width: '200px', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>
                      Licensed Modules
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { id: 'TRANSPORT', title: 'Student Transport & Fleets', desc: 'Routes, stops & driver allocation' },
                        { id: 'LIBRARY', title: 'Library Management', desc: 'Catalog, book issues & barcode checkout' },
                        { id: 'HOSTEL', title: 'Hostel & Residential Facilities', desc: 'Room allotment & hostel warden portal' },
                        { id: 'INVENTORY', title: 'Asset & Stock Inventory', desc: 'School supplies, uniforms & stock ledger' },
                        { id: 'PAYROLL', title: 'Staff Payroll & HR', desc: 'Salary structures, allowances & slips' },
                        { id: 'LMS', title: 'Learning Management System (LMS)', desc: 'Study materials, assignments & video lectures' },
                      ].map((mod) => {
                        const isChecked = form.modules.includes(mod.id);
                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleModule(mod.id)}
                            style={{
                              padding: '12px',
                              borderRadius: '6px',
                              backgroundColor: isChecked ? 'rgba(6, 182, 212, 0.12)' : '#131d31',
                              border: `1px solid ${isChecked ? '#06b6d4' : '#1e293b'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              style={{ marginTop: '3px' }}
                            />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: isChecked ? '#38bdf8' : '#f8fafc' }}>
                                {mod.title}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{mod.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(2)} className="btn btn-secondary">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
                  >
                    Next: Initial Administrator <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: INITIAL ADMINISTRATOR & REVIEW */}
            {step === 4 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
                  Initial Organization Administrator & Launch
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 20px' }}>
                  Create the root organization admin credentials for the customer.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Admin First Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Rameshwar"
                        value={form.adminFirstName}
                        onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Admin Last Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Sharma"
                        value={form.adminLastName}
                        onChange={(e) => setForm({ ...form, adminLastName: e.target.value })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Admin Email (Login Username) *
                      </label>
                      <input
                        type="email"
                        placeholder="director@sharmagroup.edu"
                        value={form.adminEmail}
                        onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                        Initial Password (min 8 chars) *
                      </label>
                      <input
                        type="password"
                        placeholder="Password@123"
                        value={form.adminPassword}
                        onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                        style={{ width: '100%', backgroundColor: '#131d31', border: '1px solid #1e293b', color: '#f8fafc', padding: '10px 12px', borderRadius: '6px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Summary preview */}
                  <div style={{ backgroundColor: '#131d31', padding: '16px', borderRadius: '6px', marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                      Ready to Deploy Workspace
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: '1.6' }}>
                      Organization: <strong style={{ color: '#f8fafc' }}>{form.orgName}</strong> ({form.orgCode})<br />
                      Institution: <strong style={{ color: '#f8fafc' }}>{form.instName}</strong> ({form.instType}, {form.board})<br />
                      Campuses: <strong style={{ color: '#f8fafc' }}>{form.branches.map((b) => b.name).join(', ')}</strong><br />
                      Active Modules: <strong style={{ color: '#38bdf8' }}>{form.modules.join(', ')}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setStep(3)} className="btn btn-secondary">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    disabled={!form.adminFirstName || !form.adminLastName || !form.adminEmail || form.adminPassword.length < 8 || submitting}
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                  >
                    {submitting ? 'Provisioning Workspace...' : 'Deploy Workspace to Database'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
