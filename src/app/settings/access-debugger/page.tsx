'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  authorize,
  explainAccess,
  SecurityActor,
  ResourceTarget,
  Role,
  ActionPermission,
  ALL_PERMISSIONS,
} from '@/lib/authorization';
import {
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function AccessDebuggerPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Actor Configuration
  const [actorRole, setActorRole] = useState<Role>('TEACHER');
  const [actorOrgId, setActorOrgId] = useState('org-dps-delhi');
  const [actorInstId, setActorInstId] = useState('inst-senior-campus');
  const [actorBranchId, setActorBranchId] = useState('branch-main');
  const [hasResp, setHasResp] = useState(true);
  const [respType, setRespType] = useState('CLASS_TEACHER');
  const [respSection, setRespSection] = useState('sec-10a');
  const [respSubject, setRespSubject] = useState('sub-math');
  const [respValid, setRespValid] = useState(true);

  // Action to Evaluate
  const [testAction, setTestAction] = useState<ActionPermission>('examinations.enter_marks');

  // Resource Target
  const [targetType, setTargetType] = useState<'STUDENT' | 'EXAM' | 'ATTENDANCE' | 'FEE' | 'STAFF'>('EXAM');
  const [targetOrgId, setTargetOrgId] = useState('org-dps-delhi');
  const [targetInstId, setTargetInstId] = useState('inst-senior-campus');
  const [targetBranchId, setTargetBranchId] = useState('branch-main');
  const [targetSectionId, setTargetSectionId] = useState('sec-10a');
  const [targetSubjectId, setTargetSubjectId] = useState('sub-math');

  // Live Decision
  const [decision, setDecision] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
        } else {
          window.location.href = '/login';
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRunEvaluation = () => {
    const actor: SecurityActor = {
      id: 'actor-simulated-01',
      email: 'simulated.actor@aurxon.test',
      firstName: 'Simulated',
      lastName: 'Actor',
      role: actorRole,
      organizationId: actorOrgId,
      institutionId: actorInstId,
      branchId: actorBranchId,
      verifiedChildIds: [],
      responsibilities: hasResp
        ? [
            {
              id: 'resp-01',
              responsibilityType: respType as any,
              title: `${respType} Assignment`,
              scopeLevel: respType === 'CLASS_TEACHER' ? 'SECTION' : 'SUBJECT',
              scopeId: respType === 'CLASS_TEACHER' ? respSection : respSubject,
              sectionId: respSection,
              subjectId: respSubject,
              validFrom: new Date('2026-01-01'),
              validUntil: respValid ? new Date('2026-12-31') : new Date('2026-02-01'), // Expired if false
              status: 'ACTIVE',
            },
          ]
        : [],
    };

    const resource: ResourceTarget = {
      type: targetType,
      id: 'target-resource-01',
      organizationId: targetOrgId,
      institutionId: targetInstId,
      branchId: targetBranchId,
      sectionId: targetSectionId,
      subjectId: targetSubjectId,
    };

    const dec = authorize(actor, testAction, resource);
    const trace = explainAccess(actor, testAction, resource);
    setDecision({ ...dec, trace });
  };

  useEffect(() => {
    handleRunEvaluation();
  }, [
    actorRole,
    actorOrgId,
    actorInstId,
    actorBranchId,
    hasResp,
    respType,
    respSection,
    respSubject,
    respValid,
    testAction,
    targetType,
    targetOrgId,
    targetInstId,
    targetBranchId,
    targetSectionId,
    targetSubjectId,
  ]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e0f2fe', borderTopColor: '#2270AF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          <Link href="/dashboard" style={{ color: '#2270AF', textDecoration: 'none', fontWeight: 600 }}>
            Workspace
          </Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Pure Mathematical RBAC & Access Explainability Debugger</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#f5f3ff', color: '#9E3BB3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd6fe' }}>
                <Terminal size={22} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                RBAC Access Simulation & Audit Debugger
              </h1>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 48px' }}>
              Simulate any actor, temporal responsibility, action and resource target to verify mathematical proof of access
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Left Column: Simulation Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Actor Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={17} color="#2270AF" />
                <span>1. Simulated Security Actor</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Actor Base Role
                  </label>
                  <select
                    value={actorRole}
                    onChange={(e) => setActorRole(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Platform)</option>
                    <option value="ORG_ADMIN">ORG_ADMIN (Directorate)</option>
                    <option value="PRINCIPAL">PRINCIPAL</option>
                    <option value="VICE_PRINCIPAL">VICE_PRINCIPAL</option>
                    <option value="BRANCH_HEAD">BRANCH_HEAD</option>
                    <option value="ACADEMIC_COORDINATOR">ACADEMIC_COORDINATOR</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="HR_MANAGER">HR_MANAGER</option>
                    <option value="STUDENT">STUDENT</option>
                    <option value="PARENT">PARENT</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Tenant Organization ID
                  </label>
                  <input
                    type="text"
                    value={actorOrgId}
                    onChange={(e) => setActorOrgId(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Scoped Temporal Responsibility */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', cursor: 'pointer', marginBottom: hasResp ? '10px' : '0' }}>
                  <input
                    type="checkbox"
                    checked={hasResp}
                    onChange={(e) => setHasResp(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Attach Temporal Scoped Responsibility</span>
                </label>

                {hasResp && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                        Responsibility Type
                      </label>
                      <select
                        value={respType}
                        onChange={(e) => setRespType(e.target.value)}
                        style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      >
                        <option value="CLASS_TEACHER">CLASS_TEACHER</option>
                        <option value="SUBJECT_TEACHER">SUBJECT_TEACHER</option>
                        <option value="EXAM_COORDINATOR">EXAM_COORDINATOR</option>
                        <option value="CLASS_MONITOR">CLASS_MONITOR (CR)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                        Assigned Section ID
                      </label>
                      <input
                        type="text"
                        value={respSection}
                        onChange={(e) => setRespSection(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                        Assigned Subject ID
                      </label>
                      <input
                        type="text"
                        value={respSubject}
                        onChange={(e) => setRespSubject(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                        Temporal Validity Status
                      </label>
                      <select
                        value={respValid ? 'ACTIVE' : 'EXPIRED'}
                        onChange={(e) => setRespValid(e.target.value === 'ACTIVE')}
                        style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      >
                        <option value="ACTIVE">Currently Valid</option>
                        <option value="EXPIRED">Temporally Expired</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Target Action & Resource Card */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={17} color="#9E3BB3" />
                <span>2. Action & Target Resource</span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Action to Evaluate
                </label>
                <select
                  value={testAction}
                  onChange={(e) => setTestAction(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace', color: '#192D55', fontWeight: 700 }}
                >
                  <option value="examinations.enter_marks">examinations.enter_marks</option>
                  <option value="attendance.mark">attendance.mark</option>
                  <option value="students.view_all">students.view_all</option>
                  <option value="fees.refund">fees.refund</option>
                  <option value="staff.view_sensitive_hr">staff.view_sensitive_hr</option>
                  <option value="license.manage">license.manage</option>
                  <option value="approvals.approve">approvals.approve</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                    Target Tenant Org ID
                  </label>
                  <input
                    type="text"
                    value={targetOrgId}
                    onChange={(e) => setTargetOrgId(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                    Target Section ID
                  </label>
                  <input
                    type="text"
                    value={targetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                    Target Subject ID
                  </label>
                  <input
                    type="text"
                    value={targetSubjectId}
                    onChange={(e) => setTargetSubjectId(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                    Target Resource Type
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="EXAM">EXAM</option>
                    <option value="ATTENDANCE">ATTENDANCE</option>
                    <option value="FEE">FEE</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Decision & Mathematical Proof */}
          <div>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)',
                position: 'sticky',
                top: '20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Authoritative Authorization Verdict
              </div>

              {/* Banner Outcome */}
              {decision?.allowed ? (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d' }}>
                      ACCESS ALLOWED
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#166534', marginTop: '2px' }}>
                      Authorization verified under defined institutional policies.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#b91c1c' }}>
                      ACCESS STRICTLY DENIED
                    </div>
                    <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '2px', fontWeight: 600 }}>
                      Reason: {decision?.reason || 'Policy violation'}
                    </div>
                  </div>
                </div>
              )}

              {/* Rule Breakdown Checklist */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Mathematical Verification Pipeline
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <span>Tenant Containment</span>
                    <strong style={{ color: actorOrgId === targetOrgId || actorRole === 'SUPER_ADMIN' ? '#16a34a' : '#dc2626' }}>
                      {actorOrgId === targetOrgId || actorRole === 'SUPER_ADMIN' ? 'PASSED' : 'DENIED (CROSS_TENANT)'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <span>Scope Matching</span>
                    <strong style={{ color: decision?.allowed ? '#16a34a' : '#64748b' }}>
                      {decision?.allowed ? 'VALIDATED' : 'BOUNDED'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <span>Temporal Expiry</span>
                    <strong style={{ color: respValid ? '#16a34a' : '#dc2626' }}>
                      {respValid ? 'WITHIN VALIDITY' : 'EXPIRED'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Complete Trace Output Box */}
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Audit Explainability Trace
                </div>
                <pre
                  style={{
                    backgroundColor: '#101b38',
                    color: '#38bdf8',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {decision?.trace || 'Evaluating...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
