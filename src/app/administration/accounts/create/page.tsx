'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Shield,
  Layers,
  Link as LinkIcon,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  School,
  BookOpen,
  GraduationCap,
  Users,
  Briefcase,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Identity', desc: 'Basic user credentials' },
  { id: 2, title: 'Actor Type', desc: 'Operational persona' },
  { id: 3, title: 'Role Profile', desc: 'Assigned system role' },
  { id: 4, title: 'Relationships', desc: 'Academic & family links' },
  { id: 5, title: 'Permissions', desc: 'Effective authorizations' },
  { id: 6, title: 'Resource Scope', desc: 'Access boundaries' },
  { id: 7, title: 'Review & Create', desc: 'Verify and provision' },
];

export default function CreateAccountWizard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Catalog metadata loaded from backend
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [canonicalPermissions, setCanonicalPermissions] = useState<string[]>([]);
  const [studentsCatalog, setStudentsCatalog] = useState<any[]>([]);
  const [classesCatalog, setClassesCatalog] = useState<any[]>([]);

  // Wizard Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    status: 'ACTIVE',
    actorType: 'TEACHER',
    role: 'TEACHER',
    scope: 'ASSIGNED_SECTIONS',
    // Teacher specifics
    teacherDepartment: 'Mathematics',
    teacherDesignation: 'PGT Mathematics',
    teacherSections: [] as string[],
    teacherSubjects: [] as string[],
    // Parent specifics
    parentRelation: 'FATHER',
    parentLinkedStudents: [] as string[],
    // Student specifics
    studentLinkedId: '',
    // Staff specifics
    staffDepartment: 'Administration',
    staffDesignation: 'Administrative Officer',
    // Custom permission overrides
    customOverrides: {} as Record<string, boolean>,
  });

  useEffect(() => {
    async function initData() {
      try {
        const [meRes, rolesRes, studentsRes, academicsRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/roles'),
          fetch('/api/v1/students?status=ACTIVE'),
          fetch('/api/v1/academics/classes'),
        ]);

        if (meRes.ok) {
          const d = await meRes.json();
          setCurrentUser(d.user);
        } else {
          router.replace('/login');
        }

        if (rolesRes.ok) {
          const rJson = await rolesRes.json();
          setAvailableRoles(rJson.roles || []);
          setCanonicalPermissions(rJson.canonicalPermissions || []);
        }

        if (studentsRes.ok) {
          const sJson = await studentsRes.json();
          setStudentsCatalog(sJson.students || []);
        }

        if (academicsRes.ok) {
          const aJson = await academicsRes.json();
          setClassesCatalog(aJson.classLevels || []);
        }
      } catch (err) {
        console.error('Failed to initialize account wizard:', err);
      }
    }
    initData();
  }, [router]);

  // Filter available roles according to selected actorType
  const filteredRoles = availableRoles.filter((r) => {
    if (formData.actorType === 'TEACHER') {
      return r.role === 'TEACHER' || r.role === 'CLASS_TEACHER' || r.role === 'SUBJECT_TEACHER' || r.role === 'FACULTY';
    }
    if (formData.actorType === 'PARENT') {
      return r.role === 'PARENT';
    }
    if (formData.actorType === 'STUDENT') {
      return r.role === 'STUDENT';
    }
    if (formData.actorType === 'STAFF') {
      return ['SCHOOL_ADMIN', 'ACCOUNTANT', 'HR_MANAGER', 'FRONT_OFFICE', 'LIBRARIAN', 'FINANCE_MANAGER'].includes(r.role);
    }
    if (formData.actorType === 'LEADERSHIP') {
      return ['PRINCIPAL', 'VICE_PRINCIPAL', 'DIRECTOR', 'ACADEMIC_COORDINATOR', 'HOD', 'BRANCH_HEAD'].includes(r.role);
    }
    return true;
  });

  // Automatically adjust default role and scope on actorType change
  const handleActorTypeChange = (type: string) => {
    let defaultRole = 'TEACHER';
    let defaultScope = 'ASSIGNED_SECTIONS';

    if (type === 'PARENT') {
      defaultRole = 'PARENT';
      defaultScope = 'OWN_CHILDREN';
    } else if (type === 'STUDENT') {
      defaultRole = 'STUDENT';
      defaultScope = 'SELF';
    } else if (type === 'STAFF') {
      defaultRole = 'SCHOOL_ADMIN';
      defaultScope = 'INSTITUTION';
    } else if (type === 'LEADERSHIP') {
      defaultRole = 'PRINCIPAL';
      defaultScope = 'ORGANIZATION';
    }

    setFormData((prev) => ({
      ...prev,
      actorType: type,
      role: defaultRole,
      scope: defaultScope,
    }));
  };

  const selectedRoleObj = availableRoles.find((r) => r.role === formData.role);
  const roleBasePermissions = selectedRoleObj?.permissions || [];

  const handleCreateAccount = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const customPermsList = Object.entries(formData.customOverrides).map(([permission, granted]) => ({
        permission,
        granted,
      }));

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password,
        status: formData.status,
        actorType: formData.actorType,
        role: formData.role,
        scope: formData.scope,
        teacherDetails: formData.actorType === 'TEACHER' ? {
          department: formData.teacherDepartment,
          designation: formData.teacherDesignation,
          assignedSectionIds: formData.teacherSections,
          assignedSubjectIds: formData.teacherSubjects,
        } : undefined,
        parentDetails: formData.actorType === 'PARENT' ? {
          relation: formData.parentRelation,
          linkedStudentIds: formData.parentLinkedStudents,
        } : undefined,
        studentDetails: formData.actorType === 'STUDENT' ? {
          studentId: formData.studentLinkedId || null,
        } : undefined,
        staffDetails: formData.actorType === 'STAFF' || formData.actorType === 'LEADERSHIP' ? {
          department: formData.staffDepartment,
          designation: formData.staffDesignation,
        } : undefined,
        customPermissions: customPermsList,
      };

      const res = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        router.push(`/administration/accounts/${json.account.id}`);
      } else {
        setErrorMsg(json.error || 'Failed to create account');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error creating account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell user={currentUser || { id: '', name: 'Loading...', email: '', role: 'PRINCIPAL', organizationName: 'AURXON' }}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/administration/accounts"
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Provision User Account</h1>
              <p className="text-xs text-slate-500">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title} — {STEPS[currentStep - 1].desc}
              </p>
            </div>
          </div>
        </div>

        {/* Step Navigation Pill Indicator */}
        <div className="grid grid-cols-7 gap-2">
          {STEPS.map((step) => {
            const isDone = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                disabled={step.id > currentStep}
                onClick={() => setCurrentStep(step.id)}
                className={`text-left p-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-teal-600 bg-teal-50/50 text-teal-900 ring-2 ring-teal-500/20'
                    : isDone
                    ? 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isDone ? 'bg-teal-600 text-white' : isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {isDone ? <Check className="w-2.5 h-2.5" /> : step.id}
                  </span>
                  <span className="truncate">{step.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Step Content Container */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
          {/* STEP 1: Basic Identity */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">User Identity & Authentication</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. Meenakshi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. Sundaram"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Official / Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. meenakshi@dps-society.edu"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  placeholder="Minimum 6 characters"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  A temporary password will require mandatory reset on the user&apos;s first login.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Actor Type */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Select Business Persona / Actor Type</h2>
              <p className="text-xs text-slate-500">
                Actor type defines the operational domain and user interface tailored to this person&apos;s role in the school ecosystem.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {[
                  {
                    type: 'TEACHER',
                    title: 'Teaching Faculty',
                    desc: 'Classroom teaching, attendance roll-call, grade entry, and student remarks.',
                    icon: BookOpen,
                    color: 'blue',
                  },
                  {
                    type: 'PARENT',
                    title: 'Parent / Guardian',
                    desc: 'Family portal strictly relationship-scoped to authorized children only.',
                    icon: Users,
                    color: 'indigo',
                  },
                  {
                    type: 'STUDENT',
                    title: 'Student',
                    desc: 'Self-service dashboard strictly scoped to own classes, attendance, and report cards.',
                    icon: GraduationCap,
                    color: 'amber',
                  },
                  {
                    type: 'STAFF',
                    title: 'Operational Staff',
                    desc: 'Admissions, front desk, fee cashier, bursar, IT, or payroll operations.',
                    icon: Briefcase,
                    color: 'teal',
                  },
                  {
                    type: 'LEADERSHIP',
                    title: 'Institutional Leadership',
                    desc: 'Principals, Directors, Vice Principals, and Academic Coordinators.',
                    icon: School,
                    color: 'purple',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = formData.actorType === item.type;

                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleActorTypeChange(item.type)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-lg bg-${item.color}-50 text-${item.color}-700 border border-${item.color}-200`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                      </div>
                      <h3 className="font-bold text-slate-900 mt-3 text-sm">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Role Profile */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Assign System Role for {formData.actorType}
              </h2>
              <p className="text-xs text-slate-500">
                Available roles are dynamically filtered based on your delegation authority and the chosen actor type.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {filteredRoles.map((r) => {
                  const isSelected = formData.role === r.role;

                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.role, scope: r.defaultScope })}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{r.displayName}</span>
                        {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                      <div className="mt-2 text-[11px] text-teal-700 font-medium">
                        Default scope: <span className="font-mono">{r.defaultScope}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Business Relationships */}
          {currentStep === 4 && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Configure Business Relationships & Profile
              </h2>

              {formData.actorType === 'TEACHER' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Academic Department</label>
                    <input
                      type="text"
                      value={formData.teacherDepartment}
                      onChange={(e) => setFormData({ ...formData, teacherDepartment: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Faculty Designation</label>
                    <input
                      type="text"
                      value={formData.teacherDesignation}
                      onChange={(e) => setFormData({ ...formData, teacherDesignation: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Academic Scope Binding:</p>
                    <p className="mt-0.5">
                      Teacher can only view student rosters and enter marks for officially assigned sections.
                    </p>
                  </div>
                </div>
              )}

              {formData.actorType === 'PARENT' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Guardian Relationship</label>
                    <select
                      value={formData.parentRelation}
                      onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="GUARDIAN">Legal Guardian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Link Children (Select from SIS)</label>
                    <select
                      multiple
                      value={formData.parentLinkedStudents}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                        setFormData({ ...formData, parentLinkedStudents: selected });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white h-32 focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                    >
                      {studentsCatalog.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} (Adm: {s.admissionNumber})
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Hold Ctrl / Cmd to select multiple siblings. Access will be strictly bounded to selected children.
                    </span>
                  </div>
                </div>
              )}

              {formData.actorType === 'STUDENT' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Link Enrolled Student Record</label>
                    <select
                      value={formData.studentLinkedId}
                      onChange={(e) => setFormData({ ...formData, studentLinkedId: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                    >
                      <option value="">-- Select Student to Bind Account --</option>
                      {studentsCatalog.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} (Adm: {s.admissionNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {(formData.actorType === 'STAFF' || formData.actorType === 'LEADERSHIP') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.staffDepartment}
                      onChange={(e) => setFormData({ ...formData, staffDepartment: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.staffDesignation}
                      onChange={(e) => setFormData({ ...formData, staffDesignation: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Effective Permissions Matrix */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Effective Permissions Matrix</h2>
                  <p className="text-xs text-slate-500">
                    Review role-inherited permissions and configure explicit user-level grant/deny overrides.
                  </p>
                </div>
                <div className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  Role: {formData.role}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto p-1 border rounded-lg">
                {canonicalPermissions.map((perm) => {
                  const isInherited = roleBasePermissions.includes('*') || roleBasePermissions.includes(perm);
                  const isOverridden = formData.customOverrides[perm] !== undefined;
                  const isEffective = isOverridden ? formData.customOverrides[perm] : isInherited;

                  return (
                    <div
                      key={perm}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                        isEffective
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                          : 'border-slate-200 bg-slate-50/40 text-slate-500 opacity-60'
                      }`}
                    >
                      <div>
                        <span className="font-mono font-medium">{perm}</span>
                        <div className="text-[10px] text-slate-400">
                          {isOverridden ? 'User Custom Override' : isInherited ? 'Inherited from Role' : 'Not Granted'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              customOverrides: {
                                ...prev.customOverrides,
                                [perm]: !isEffective,
                              },
                            }));
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                            isEffective
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isEffective ? 'ALLOW' : 'DENY'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Resource Scope Configuration */}
          {currentStep === 6 && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Configure Operational Resource Scope
              </h2>
              <p className="text-xs text-slate-500">
                Determines WHERE and on WHOSE data this user is authorized to execute their permissions.
              </p>

              <div className="space-y-2 pt-2">
                {[
                  { scope: 'ORGANIZATION', title: 'Institution-Wide (Entire Organization)', desc: 'Unrestricted institutional oversight (Principals, School Admins)' },
                  { scope: 'BRANCH', title: 'Campus / Branch Level', desc: 'Bound strictly to physical branch facilities and records' },
                  { scope: 'ASSIGNED_SECTIONS', title: 'Assigned Classes & Sections', desc: 'Bound strictly to assigned academic classes (Teachers)' },
                  { scope: 'OWN_CHILDREN', title: 'Verified Children Only', desc: 'Bound strictly to verified guardian-child links (Parents)' },
                  { scope: 'SELF', title: 'Self Record Only', desc: 'Bound strictly to own profile and timetable (Students)' },
                  { scope: 'BASIC_PROFILE', title: 'Basic Profile / Front Desk', desc: 'Front-office inquiries without sensitive student or fee details' },
                  { scope: 'FINANCIAL', title: 'Financial Resources Only', desc: 'Fee collections and receipts without payroll or academic editing' },
                ].map((s) => {
                  const isSelected = formData.scope === s.scope;

                  return (
                    <button
                      key={s.scope}
                      type="button"
                      onClick={() => setFormData({ ...formData, scope: s.scope })}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{s.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: Review & Confirm */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Review Account Provisioning Specifications
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                    WHO (Identity & Actor)
                  </span>
                  <div><strong className="text-slate-700">Name:</strong> {formData.firstName} {formData.lastName}</div>
                  <div><strong className="text-slate-700">Email:</strong> {formData.email}</div>
                  <div><strong className="text-slate-700">Actor Type:</strong> <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold">{formData.actorType}</span></div>
                  <div><strong className="text-slate-700">Status:</strong> {formData.status}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                    WHAT & WHERE (Role & Scope)
                  </span>
                  <div><strong className="text-slate-700">Role:</strong> {formData.role}</div>
                  <div><strong className="text-slate-700">Resource Scope:</strong> <span className="font-mono font-bold text-slate-800">{formData.scope}</span></div>
                  {formData.actorType === 'PARENT' && (
                    <div><strong className="text-slate-700">Children:</strong> {formData.parentLinkedStudents.length} selected</div>
                  )}
                  {formData.actorType === 'STUDENT' && (
                    <div><strong className="text-slate-700">Bound Record:</strong> {formData.studentLinkedId || 'None'}</div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Authoritative IAM Verification</span>
                </span>
                Upon account creation, the user will be provisioned in the database with hashed credentials, linked to their corresponding profile, and strictly restricted to the specified resource scope.
              </div>
            </div>
          )}
        </div>

        {/* Wizard Bottom Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(STEPS.length, prev + 1))}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={handleCreateAccount}
              className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Provision & Create Account</span>
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
