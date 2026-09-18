'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import {
  authorize,
  explainAccess,
  evaluateAccessLevel,
} from '@/lib/authorization/engine';
import {
  SecurityActor,
  ResourceTarget,
  Role,
  RoleCategory,
  AccessLevel,
  ActionPermission,
} from '@/lib/authorization/types';
import {
  CENTRAL_MODULE_ACCESS_MATRIX,
  getModuleAccessLevel,
  ALL_PERMISSIONS,
} from '@/lib/authorization/permissions-registry';
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
  BookOpen,
  Users,
  Briefcase,
  DollarSign,
  GraduationCap,
  Sliders,
  Check,
} from 'lucide-react';

const ROLE_CATEGORIES: Record<RoleCategory, { name: string; icon: any; roles: Role[] }> = {
  LEADERSHIP: {
    name: 'Institutional Leadership',
    icon: GraduationCap,
    roles: [
      'PRINCIPAL',
      'VICE_PRINCIPAL',
      'DIRECTOR',
      'HEAD_OF_SCHOOL',
      'ACADEMIC_COORDINATOR',
      'EXAM_COORDINATOR',
      'DISCIPLINE_COORDINATOR',
      'HOD',
      'BRANCH_HEAD',
    ],
  },
  ADMINISTRATION: {
    name: 'School Administration & HR',
    icon: Briefcase,
    roles: [
      'SCHOOL_ADMIN',
      'ORG_ADMIN',
      'FRONT_OFFICE',
      'ADMISSION_COUNSELLOR',
      'HR_MANAGER',
      'HR_OFFICER',
      'IT_ADMIN',
    ],
  },
  ACADEMIC: {
    name: 'Academic Faculty & Teaching',
    icon: BookOpen,
    roles: [
      'TEACHER',
      'FACULTY',
      'CLASS_TEACHER',
      'SUBJECT_TEACHER',
      'SPECIAL_EDUCATOR',
      'COUNSELLOR',
      'LIBRARIAN',
      'LAB_ASSISTANT',
      'SPORTS_COORDINATOR',
    ],
  },
  FINANCE_OPERATIONS: {
    name: 'Finance, Fees & Operations',
    icon: DollarSign,
    roles: [
      'ACCOUNTANT',
      'FINANCE_MANAGER',
      'FEE_COLLECTOR',
      'TRANSPORT_MANAGER',
      'TRANSPORT_COORDINATOR',
    ],
  },
  END_USER: {
    name: 'End Users & Self-Service',
    icon: Users,
    roles: ['PARENT', 'STUDENT', 'CLASS_MONITOR'],
  },
};

const MODULES = [
  'STUDENT',
  'ATTENDANCE',
  'MARKS',
  'RESULTS',
  'FEES',
  'STAFF',
  'SALARY',
  'LEAVE',
  'ROLES',
  'REPORTS',
];

export default function AccessDebuggerPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory>('ACADEMIC');
  const [actorRole, setActorRole] = useState<Role>('TEACHER');

  // Actor Configuration
  const [actorOrgId, setActorOrgId] = useState('org_abc_school');
  const [actorBranchId, setActorBranchId] = useState('branch_indore');
  const [actorDepartment, setActorDepartment] = useState('Mathematics');
  const [hasResp, setHasResp] = useState(true);
  const [respType, setRespType] = useState('CLASS_TEACHER');
  const [respSection, setRespSection] = useState('section_8A');
  const [respSubject, setRespSubject] = useState('sub_math');

  // Target Configuration
  const [targetAction, setTargetAction] = useState<ActionPermission>('attendance.correct');
  const [targetType, setTargetType] = useState('ATTENDANCE');
  const [targetOrgId, setTargetOrgId] = useState('org_abc_school');
  const [targetBranchId, setTargetBranchId] = useState('branch_indore');
  const [targetSectionId, setTargetSectionId] = useState('section_8A');
  const [targetSubjectId, setTargetSubjectId] = useState('sub_math');
  const [targetDepartment, setTargetDepartment] = useState('Mathematics');

  // Evaluation Decision
  const [decision, setDecision] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const json = await res.json();
        if (json.user) setUser(json.user);
      } catch {
        // Ignore
      }
    }
    load();
  }, []);

  // Recalculate pure authorization decision whenever inputs change
  useEffect(() => {
    const actor: SecurityActor = {
      id: 'usr_eval_actor',
      email: 'eval.actor@aurxon.io',
      firstName: 'Evaluation',
      lastName: 'Principal',
      role: actorRole,
      organizationId: actorOrgId,
      branchId: actorBranchId,
      department: actorDepartment,
      responsibilities: hasResp
        ? [
            {
              responsibilityType: respType,
              title: `${respType} — ${respSection || respSubject}`,
              scopeLevel: respType === 'SUBJECT_TEACHER' ? 'SUBJECT' : 'SECTION',
              sectionId: respSection,
              subjectId: respSubject,
              branchId: actorBranchId,
              validFrom: new Date('2026-01-01'),
              status: 'ACTIVE',
            },
          ]
        : [],
      verifiedChildIds: ['student_verified_01'],
      studentProfileId: 'student_profile_01',
    };

    const target: ResourceTarget = {
      type: targetType,
      organizationId: targetOrgId,
      branchId: targetBranchId,
      sectionId: targetSectionId,
      subjectId: targetSubjectId,
      department: targetDepartment,
      studentId: 'student_verified_01',
    };

    const result = explainAccess(actor, targetAction, target);
    setDecision(result);
  }, [
    actorRole,
    actorOrgId,
    actorBranchId,
    actorDepartment,
    hasResp,
    respType,
    respSection,
    respSubject,
    targetAction,
    targetType,
    targetOrgId,
    targetBranchId,
    targetSectionId,
    targetSubjectId,
    targetDepartment,
  ]);

  // Quick Scenarios Presets
  const applyScenario = (scenario: string) => {
    if (scenario === 'RAHUL_TEACHER') {
      setSelectedCategory('ACADEMIC');
      setActorRole('TEACHER');
      setActorOrgId('org_abc_school');
      setActorBranchId('branch_indore');
      setActorDepartment('Mathematics');
      setHasResp(true);
      setRespType('CLASS_TEACHER');
      setRespSection('section_8A');
      setRespSubject('sub_math');
      setTargetAction('attendance.correct');
      setTargetType('ATTENDANCE');
      setTargetOrgId('org_abc_school');
      setTargetBranchId('branch_indore');
      setTargetSectionId('section_8A');
      setTargetSubjectId('sub_math');
    } else if (scenario === 'CLASS_MONITOR_CR') {
      setSelectedCategory('END_USER');
      setActorRole('STUDENT');
      setActorOrgId('org_abc_school');
      setActorBranchId('branch_indore');
      setHasResp(true);
      setRespType('CLASS_MONITOR');
      setRespSection('section_8A');
      setTargetAction('attendance.mark');
      setTargetType('ATTENDANCE');
      setTargetOrgId('org_abc_school');
      setTargetBranchId('branch_indore');
      setTargetSectionId('section_8A');
    } else if (scenario === 'HOD_MATH') {
      setSelectedCategory('LEADERSHIP');
      setActorRole('HOD');
      setActorOrgId('org_abc_school');
      setActorBranchId('branch_indore');
      setActorDepartment('Mathematics');
      setHasResp(false);
      setTargetAction('examinations.review');
      setTargetType('EXAMINATION');
      setTargetOrgId('org_abc_school');
      setTargetBranchId('branch_indore');
      setTargetDepartment('Mathematics');
    } else if (scenario === 'ACCOUNTANT_FEES') {
      setSelectedCategory('FINANCE_OPERATIONS');
      setActorRole('ACCOUNTANT');
      setActorOrgId('org_abc_school');
      setActorBranchId('branch_indore');
      setHasResp(false);
      setTargetAction('fees.collect');
      setTargetType('FEE');
      setTargetOrgId('org_abc_school');
      setTargetBranchId('branch_indore');
    } else if (scenario === 'PRINCIPAL_PUBLISH') {
      setSelectedCategory('LEADERSHIP');
      setActorRole('PRINCIPAL');
      setActorOrgId('org_abc_school');
      setActorBranchId('branch_indore');
      setHasResp(false);
      setTargetAction('examinations.publish');
      setTargetType('EXAMINATION');
      setTargetOrgId('org_abc_school');
      setTargetBranchId('branch_indore');
    }
  };

  const getBadgeColor = (level: AccessLevel) => {
    switch (level) {
      case 'FINALIZE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PUBLISH':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'APPROVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'EDIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REVIEW':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'CREATE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'VIEW_SENSITIVE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'VIEW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'EXPORT':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <AppShell user={user || { id: 'usr_eval', name: 'Security Evaluator', email: 'eval@aurxon.io', role: 'SUPER_ADMIN', organizationName: 'AURXON HQ' }}>
      <div className="min-h-screen bg-slate-50/60 pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#192D55] via-[#2270AF] to-[#9E3BB3] text-white pt-8 pb-14 px-6 sm:px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-sm">
                  Pure Functional RBAC Simulation
                </span>
                <span className="text-xs text-blue-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Mathematical Zero-Trust
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Enterprise Access & Role Architecture Studio
              </h1>
              <p className="text-blue-100 text-sm mt-1 max-w-3xl">
                Simulate multi-dimensional scoping (Org ➔ Institution ➔ Branch ➔ Session ➔ Class/Section/Subject), role-responsibility capabilities, anti-self-approval rules, and the Section 44 Central Module Matrix.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-blue-100 font-semibold">Presets:</span>
              <button
                onClick={() => applyScenario('RAHUL_TEACHER')}
                className="bg-white/15 hover:bg-white/25 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm font-semibold transition-all"
              >
                Rahul (Class 8A Math)
              </button>
              <button
                onClick={() => applyScenario('CLASS_MONITOR_CR')}
                className="bg-white/15 hover:bg-white/25 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm font-semibold transition-all"
              >
                Class Monitor (CR)
              </button>
              <button
                onClick={() => applyScenario('HOD_MATH')}
                className="bg-white/15 hover:bg-white/25 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm font-semibold transition-all"
              >
                HOD Mathematics
              </button>
              <button
                onClick={() => applyScenario('ACCOUNTANT_FEES')}
                className="bg-white/15 hover:bg-white/25 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm font-semibold transition-all"
              >
                Accountant
              </button>
              <button
                onClick={() => applyScenario('PRINCIPAL_PUBLISH')}
                className="bg-white/15 hover:bg-white/25 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm font-semibold transition-all"
              >
                Principal
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-6 space-y-6">
          {/* Decision Cockpit Card */}
          {decision && (
            <div
              className={`bg-white rounded-2xl p-6 border shadow-md transition-all ${
                decision.decision.allowed ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-rose-300 ring-2 ring-rose-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {decision.decision.allowed ? (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shadow-inner">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black shadow-inner">
                      <XCircle className="w-7 h-7" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          decision.decision.allowed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {decision.decision.allowed ? 'AUTHORIZATION GRANTED (ALLOW)' : 'AUTHORIZATION REJECTED (DENY)'}
                      </span>
                      {decision.decision.denialCode && (
                        <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          CODE: {decision.decision.denialCode}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#192D55] mt-1">
                      {decision.decision.reason}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold">Effective Access Level</div>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-xl text-xs font-black border ${getBadgeColor(evaluateAccessLevel({ role: actorRole } as any, targetType))}`}>
                    {evaluateAccessLevel({ role: actorRole } as any, targetType)}
                  </span>
                </div>
              </div>

              {/* Explanatory Trace Log */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-mono bg-slate-900 text-emerald-400 p-3.5 rounded-xl flex items-center justify-between">
                <span>{decision.auditExplanation}</span>
                <span className="text-slate-500 text-[11px]">MATHEMATICAL_EVALUATION</span>
              </div>
            </div>
          )}

          {/* Interactive Simulator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 5 Role Categories & Actor Config (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-[#192D55] text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#2270AF]" />
                    1. Security Actor & Role Category
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">Step 1 of 3</span>
                </div>

                {/* Category Picker Tabs */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(Object.keys(ROLE_CATEGORIES) as RoleCategory[]).map((cat) => {
                    const info = ROLE_CATEGORIES[cat];
                    const Icon = info.icon;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setActorRole(info.roles[0]);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 text-center ${
                          selectedCategory === cat
                            ? 'bg-[#2270AF] text-white shadow-sm'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] truncate max-w-full">{info.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Role Dropdown */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Specific Role ({ROLE_CATEGORIES[selectedCategory].name})</label>
                  <select
                    value={actorRole}
                    onChange={(e) => setActorRole(e.target.value as Role)}
                    className="w-full text-xs mt-1 px-3 py-2 rounded-xl border border-slate-200 font-bold text-[#192D55] focus:ring-2 focus:ring-[#2270AF]"
                  >
                    {ROLE_CATEGORIES[selectedCategory].roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Actor Scope */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t text-xs">
                  <div>
                    <label className="font-semibold text-slate-600">Actor Branch</label>
                    <input
                      type="text"
                      value={actorBranchId}
                      onChange={(e) => setActorBranchId(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Department</label>
                    <input
                      type="text"
                      value={actorDepartment}
                      onChange={(e) => setActorDepartment(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                  </div>
                </div>

                {/* Temporal Scoped Responsibility Extension */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#192D55] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#9E3BB3]" />
                      Scoped Responsibility
                    </label>
                    <input
                      type="checkbox"
                      checked={hasResp}
                      onChange={(e) => setHasResp(e.target.checked)}
                      className="rounded text-[#2270AF]"
                    />
                  </div>

                  {hasResp && (
                    <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs border">
                      <div>
                        <span className="font-medium text-slate-500">Responsibility Duty:</span>
                        <select
                          value={respType}
                          onChange={(e) => setRespType(e.target.value)}
                          className="w-full mt-1 px-2 py-1 rounded border text-xs font-semibold"
                        >
                          <option value="CLASS_TEACHER">CLASS_TEACHER (Section Bound)</option>
                          <option value="SUBJECT_TEACHER">SUBJECT_TEACHER (Subject Bound)</option>
                          <option value="HOD">HOD (Department Bound)</option>
                          <option value="EXAM_COORDINATOR">EXAM_COORDINATOR</option>
                          <option value="ACADEMIC_COORDINATOR">ACADEMIC_COORDINATOR</option>
                          <option value="CLASS_MONITOR">CLASS_MONITOR (CR - Advisory Only)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-slate-500">Assigned Section:</span>
                          <input
                            type="text"
                            value={respSection}
                            onChange={(e) => setRespSection(e.target.value)}
                            className="w-full mt-0.5 px-2 py-1 rounded border text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500">Assigned Subject:</span>
                          <input
                            type="text"
                            value={respSubject}
                            onChange={(e) => setRespSubject(e.target.value)}
                            className="w-full mt-0.5 px-2 py-1 rounded border text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Target Resource & Action (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-[#192D55] text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#9E3BB3]" />
                    2. Target Action & Boundary Scopes
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">Step 2 of 3</span>
                </div>

                {/* Target Action */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Requested Action Permission</label>
                  <select
                    value={targetAction}
                    onChange={(e) => setTargetAction(e.target.value)}
                    className="w-full text-xs mt-1 px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-[#2270AF] focus:ring-2 focus:ring-[#2270AF]"
                  >
                    {ALL_PERMISSIONS.map((perm) => (
                      <option key={perm} value={perm}>{perm}</option>
                    ))}
                  </select>
                </div>

                {/* Target Resource Coordinates */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border">
                  <div>
                    <label className="font-semibold text-slate-600">Target Type</label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold"
                    >
                      <option value="ATTENDANCE">ATTENDANCE</option>
                      <option value="EXAMINATION">EXAMINATION</option>
                      <option value="MARKS">MARKS</option>
                      <option value="FEE">FEE</option>
                      <option value="STUDENT">STUDENT</option>
                      <option value="STAFF">STAFF</option>
                      <option value="LEAVE">LEAVE</option>
                      <option value="REPORT">REPORT</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600">Target Branch</label>
                    <input
                      type="text"
                      value={targetBranchId}
                      onChange={(e) => setTargetBranchId(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600">Target Section</label>
                    <input
                      type="text"
                      value={targetSectionId}
                      onChange={(e) => setTargetSectionId(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600">Target Subject</label>
                    <input
                      type="text"
                      value={targetSubjectId}
                      onChange={(e) => setTargetSubjectId(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600">Target Department</label>
                    <input
                      type="text"
                      value={targetDepartment}
                      onChange={(e) => setTargetDepartment(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600">Target Org (Tenant)</label>
                    <input
                      type="text"
                      value={targetOrgId}
                      onChange={(e) => setTargetOrgId(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                  </div>
                </div>

                {/* Boundary Rules Summary */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-[#192D55] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#2270AF]" /> Scoping Integrity Rules:
                  </div>
                  <p>• If Actor Branch != Target Branch ➔ DENY with <code>BRANCH_MISMATCH</code></p>
                  <p>• If Subject Teacher enters marks for unassigned subject ➔ DENY with <code>OUT_OF_SCOPE</code></p>
                  <p>• If Class Monitor (CR) attempts attendance or mark edits ➔ DENY with <code>INSUFFICIENT_ROLE_PERMISSIONS</code></p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 44 Central Module Access Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b gap-2">
              <div>
                <h3 className="text-base font-extrabold text-[#192D55]">
                  Standard School ERP Module Access Matrix (Section 44 Standard)
                </h3>
                <p className="text-xs text-slate-500">
                  Defines default access levels across institutional leadership, faculty, administrative staff, and end users.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-400">Legend:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">APPROVE</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">PUBLISH</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">EDIT</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">VIEW</span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">SENSITIVE</span>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b">
                    <th className="py-2.5 px-3">Module</th>
                    <th className="py-2.5 px-3">Principal</th>
                    <th className="py-2.5 px-3">Vice Principal</th>
                    <th className="py-2.5 px-3">School Admin</th>
                    <th className="py-2.5 px-3">Teacher</th>
                    <th className="py-2.5 px-3">Accountant</th>
                    <th className="py-2.5 px-3">HR Manager</th>
                    <th className="py-2.5 px-3">Parent</th>
                    <th className="py-2.5 px-3">Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {MODULES.map((mod) => (
                    <tr key={mod} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#192D55]">{mod}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getBadgeColor(getModuleAccessLevel('PRINCIPAL', mod))}`}>
                          {getModuleAccessLevel('PRINCIPAL', mod)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getBadgeColor(getModuleAccessLevel('VICE_PRINCIPAL', mod))}`}>
                          {getModuleAccessLevel('VICE_PRINCIPAL', mod)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getBadgeColor(getModuleAccessLevel('SCHOOL_ADMIN', mod))}`}>
                          {getModuleAccessLevel('SCHOOL_ADMIN', mod)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getBadgeColor(getModuleAccessLevel('TEACHER', mod))}`}>
                          {getModuleAccessLevel('TEACHER', mod)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getBadgeColor(getModuleAccessLevel('ACCOUNTANT', mod))}`}>
                          {getModuleAccessLevel('ACCOUNTANT', mod)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getBadgeColor(getModuleAccessLevel('HR_MANAGER', mod))}`}>
                          {getModuleAccessLevel('HR_MANAGER', mod)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getBadgeColor(getModuleAccessLevel('PARENT', mod))}`}>
                          {getModuleAccessLevel('PARENT', mod)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getBadgeColor(getModuleAccessLevel('STUDENT', mod))}`}>
                          {getModuleAccessLevel('STUDENT', mod)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
