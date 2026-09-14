'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DigitalStaffIdCard from '@/components/staff/DigitalStaffIdCard';
import {
  Users,
  UserCheck,
  Building2,
  GraduationCap,
  BookOpen,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Lock,
  Plus,
  Trash2,
  QrCode,
  FileCheck,
} from 'lucide-react';

export default function StaffOnboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('1990-05-15');
  const [gender, setGender] = useState('FEMALE');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [address, setAddress] = useState('42 Vasant Kunj, Sector B');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('110070');

  // Step 2: Employment
  const [department, setDepartment] = useState('Mathematics');
  const [designation, setDesignation] = useState('PGT Mathematics');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [joiningDate, setJoiningDate] = useState('2026-09-01');

  // Step 3: Education
  const [qualifications, setQualifications] = useState([
    {
      qualification: 'Post Graduate',
      degree: 'M.Sc.',
      specialization: 'Pure Mathematics',
      institution: 'Delhi University',
      universityBoard: 'University of Delhi',
      passingYear: '2014',
      percentageGrade: '86.4%',
    },
    {
      qualification: 'Professional',
      degree: 'B.Ed.',
      specialization: 'Mathematics Pedagogy',
      institution: 'Central Institute of Education',
      universityBoard: 'University of Delhi',
      passingYear: '2016',
      percentageGrade: '89.2%',
    },
  ]);

  // Step 4: Teaching Experience
  const [teachingSubject, setTeachingSubject] = useState('Calculus, Algebra, Coordinate Geometry');
  const [classesTaught, setClassesTaught] = useState('Grade 10, Grade 11, Grade 12');
  const [curricula, setCurricula] = useState('CBSE, JEE Advanced Foundation');
  const [yearsExperience, setYearsExperience] = useState('8.5');
  const [isCoaching, setIsCoaching] = useState(true);

  // Step 5: Responsibility
  const [assignResponsibility, setAssignResponsibility] = useState(true);
  const [responsibilityType, setResponsibilityType] = useState('CLASS_TEACHER');
  const [sectionName, setSectionName] = useState('Grade 11-A');

  // Step 6: Sensitive Financial & KYC
  const [basicSalary, setBasicSalary] = useState('78000');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [bankAccountNumber, setBankAccountNumber] = useState('50100489271923');
  const [bankIfsc, setBankIfsc] = useState('HDFC0000128');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [aadhaarNumber, setAadhaarNumber] = useState('9876 5432 1098');

  // Step 7: ERP Account Provisioning
  const [provisionAccount, setProvisionAccount] = useState(true);
  const [role, setRole] = useState('TEACHER');

  // Result state
  const [completedData, setCompletedData] = useState<any>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const json = await res.json();
          setCurrentUser(json.user);
        } else {
          window.location.href = '/login';
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingUser(false);
      }
    }
    loadUser();
  }, []);

  const handleAddQualification = () => {
    setQualifications([
      ...qualifications,
      {
        qualification: 'Graduate',
        degree: 'B.Sc.',
        specialization: 'Mathematics',
        institution: 'St. Stephen’s College',
        universityBoard: 'Delhi University',
        passingYear: '2012',
        percentageGrade: '82.0%',
      },
    ]);
  };

  const handleRemoveQualification = (index: number) => {
    setQualifications(qualifications.filter((_, idx) => idx !== index));
  };

  const handleSubmitOnboarding = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phone,
        dob,
        gender,
        bloodGroup,
        address,
        city,
        state,
        pincode,
        department,
        designation,
        employmentType,
        joiningDate,
        education: qualifications,
        teachingExperience: [
          {
            subjectsTaught: teachingSubject,
            classesTaught,
            curricula,
            yearsExperience,
            isCoaching,
          },
        ],
        responsibility: assignResponsibility
          ? {
              type: responsibilityType,
              title: `${responsibilityType === 'CLASS_TEACHER' ? 'Class Teacher' : 'Coordinator'} - ${sectionName}`,
              scopeLevel: 'SECTION',
              sectionId: sectionName.replace(/\s+/g, '-').toLowerCase(),
            }
          : null,
        basicSalary,
        bankName,
        bankAccountNumber,
        bankIfsc,
        panNumber,
        aadhaarNumber,
        provisionAccount,
        role,
      };

      const res = await fetch('/api/v1/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to complete onboarding');
        setSubmitting(false);
        return;
      }

      setCompletedData(json);
      setStep(8); // Success confirmation step
    } catch (err: any) {
      setError(err?.message || 'Server communication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!completedData?.provisioning) return;
    const text = `AURXON ERP Access Credentials\nEmail: ${completedData.provisioning.email}\nTemporary Password: ${completedData.provisioning.temporaryPassword}\nLogin Portal: ${window.location.origin}/login\nNotice: Temporary password reset is mandatory on first login.`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  if (loadingUser || !currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <AppShell user={currentUser}>
      <div style={{ padding: '28px', maxWidth: '1080px', margin: '0 auto' }}>
        {/* Header Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          <Link href="/staff" style={{ color: '#2270AF', textDecoration: 'none', fontWeight: 600 }}>
            Faculty & Staff Directory
          </Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Autonomous Staff Onboarding Center</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Faculty & Staff Onboarding
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0' }}>
              Auto-generate Employee ID, scannable QR verification badge, and provision ERP accounts with first-login password enforcement.
            </p>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#FFFFFF',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            overflowX: 'auto',
            gap: '8px',
          }}
        >
          {[
            { num: 1, label: 'Personal' },
            { num: 2, label: 'Designation' },
            { num: 3, label: 'Academics' },
            { num: 4, label: 'Experience' },
            { num: 5, label: 'Role Scope' },
            { num: 6, label: 'KYC & Salary' },
            { num: 7, label: 'ERP Account' },
          ].map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                onClick={() => (isDone || step < 8 ? setStep(s.num) : null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: step < 8 ? 'pointer' : 'default',
                  backgroundColor: isActive ? '#EAF5FC' : 'transparent',
                  color: isActive ? '#2270AF' : isDone ? '#16a34a' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#2270AF' : isDone ? '#16a34a' : '#e2e8f0',
                    color: isActive || isDone ? '#FFFFFF' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {isDone ? '✓' : s.num}
                </div>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Form Container */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                Step 1: Personal & Identification Details
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Chandra"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh.chandra@dps.edu.in"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98100 00000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Apartment / Sector"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', marginBottom: '10px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (e.g. New Delhi)"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State (e.g. Delhi)"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode (e.g. 110070)"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!firstName || !lastName || !email) {
                      setError('First Name, Last Name and Email are mandatory');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2270AF',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Continue to Designation</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DESIGNATION & DEPARTMENT */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                Step 2: Department, Designation & Joining
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Academic Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics & Science">Physics & Science</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science & AI">Computer Science & AI</option>
                    <option value="English & Humanities">English & Humanities</option>
                    <option value="Commerce & Economics">Commerce & Economics</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. PGT Mathematics, HOD Sciences"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Employment Contract Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="FULL_TIME">Permanent Full-Time</option>
                    <option value="CONTRACT">Annual Contract</option>
                    <option value="PROBATION">Probationary Period</option>
                    <option value="VISITING">Visiting / Guest Faculty</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2270AF',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Continue to Academics</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: QUALIFICATIONS */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Step 3: Higher Education & Degrees
                </h2>
                <button
                  type="button"
                  onClick={handleAddQualification}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #2270AF',
                    backgroundColor: '#EAF5FC',
                    color: '#2270AF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} />
                  <span>Add Degree</span>
                </button>
              </div>

              {qualifications.map((edu, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#2270AF' }}>
                      Degree #{idx + 1}
                    </span>
                    {qualifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQualification(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const copy = [...qualifications];
                        copy[idx].degree = e.target.value;
                        setQualifications(copy);
                      }}
                      placeholder="Degree (e.g. M.Sc., B.Ed.)"
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                    <input
                      type="text"
                      value={edu.specialization}
                      onChange={(e) => {
                        const copy = [...qualifications];
                        copy[idx].specialization = e.target.value;
                        setQualifications(copy);
                      }}
                      placeholder="Specialization (e.g. Mathematics)"
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const copy = [...qualifications];
                        copy[idx].institution = e.target.value;
                        setQualifications(copy);
                      }}
                      placeholder="College / University"
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input
                      type="number"
                      value={edu.passingYear}
                      onChange={(e) => {
                        const copy = [...qualifications];
                        copy[idx].passingYear = e.target.value;
                        setQualifications(copy);
                      }}
                      placeholder="Passing Year (e.g. 2016)"
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                    <input
                      type="text"
                      value={edu.percentageGrade}
                      onChange={(e) => {
                        const copy = [...qualifications];
                        copy[idx].percentageGrade = e.target.value;
                        setQualifications(copy);
                      }}
                      placeholder="Percentage / CGPA (e.g. 88%)"
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2270AF',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Continue to Experience</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: TEACHING EXPERTISE */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                Step 4: Teaching Expertise & Curricula
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Subjects Taught
                </label>
                <input
                  type="text"
                  value={teachingSubject}
                  onChange={(e) => setTeachingSubject(e.target.value)}
                  placeholder="e.g. Advanced Calculus, Algebra, Coordinate Geometry"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Classes / Grade Levels Taught
                  </label>
                  <input
                    type="text"
                    value={classesTaught}
                    onChange={(e) => setClassesTaught(e.target.value)}
                    placeholder="e.g. Grade 9, Grade 10, Grade 11, Grade 12"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Curricula & Examination Boards
                  </label>
                  <input
                    type="text"
                    value={curricula}
                    onChange={(e) => setCurricula(e.target.value)}
                    placeholder="e.g. CBSE, ICSE, JEE Advanced, NEET"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Years of Relevant Teaching Experience
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g. 7.5"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isCoaching}
                      onChange={(e) => setIsCoaching(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Has Competitive Exam Coaching Experience (JEE/NEET)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2270AF',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Continue to Scoped Responsibilities</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SCOPED RESPONSIBILITIES */}
          {step === 5 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                Step 5: Scoped Role Responsibility Assignment
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                AURXON uses temporal, mathematically bounded responsibilities so teachers can manage designated sections or examination wings without elevated admin rights.
              </p>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', fontWeight: 700, color: '#0f172a', cursor: 'pointer', marginBottom: '14px' }}>
                  <input
                    type="checkbox"
                    checked={assignResponsibility}
                    onChange={(e) => setAssignResponsibility(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Assign an Academic Responsibility upon Joining</span>
                </label>

                {assignResponsibility && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Responsibility Type
                      </label>
                      <select
                        value={responsibilityType}
                        onChange={(e) => setResponsibilityType(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="CLASS_TEACHER">Class Teacher (Attendance & Section Reports)</option>
                        <option value="SUBJECT_TEACHER">Subject Teacher (Marks Entry & Assignments)</option>
                        <option value="EXAM_COORDINATOR">Examination Coordinator (Exam Hall & Question Papers)</option>
                        <option value="ACADEMIC_COORDINATOR">Academic Coordinator (Curriculum & Syllabus)</option>
                        <option value="HOD">Head of Department (Faculty Oversight)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Assigned Class & Section
                      </label>
                      <input
                        type="text"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="e.g. Grade 11-A, Section 10-B"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2270AF',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Continue to Sensitive KYC</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: SENSITIVE FINANCIAL & STATUTORY DATA */}
          {step === 6 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Shield size={20} color="#9E3BB3" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Step 6: Sensitive Financial, Payroll & Statutory KYC
                </h2>
              </div>

              <div
                style={{
                  backgroundColor: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Lock size={16} color="#7c3aed" />
                <span style={{ fontSize: '12px', color: '#6d28d9', lineHeight: 1.4 }}>
                  Zero-Trust Redaction Active: These sensitive fields are strictly restricted to HR Managers and Principals. Normal teachers and staff cannot view payroll or bank identifiers.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Monthly Basic Salary (INR)
                  </label>
                  <input
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="e.g. 75000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, State Bank of India"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 50100489271923"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    placeholder="e.g. HDFC0000128"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Permanent Account Number (PAN)
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Aadhaar Number (UIDAI)
                  </label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="e.g. 9876 5432 1098"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2270AF',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Continue to Account Provisioning</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: ACCOUNT PROVISIONING & FINAL REVIEW */}
          {step === 7 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <KeyRound size={20} color="#2270AF" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Step 7: ERP Login Provisioning & First-Login Security
                </h2>
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={provisionAccount}
                    onChange={(e) => setProvisionAccount(e.target.checked)}
                    style={{ width: '20px', height: '20px', marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      Auto-Provision ERP Access Account for this Staff Member
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                      Generates a secure temporary password. When the faculty member logs in for the first time, AURXON will enforce a mandatory password reset before granting access to academic or administrative modules.
                    </div>
                  </div>
                </label>

                {provisionAccount && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Assigned Base Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{ width: '100%', maxWidth: '300px', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="TEACHER">Teacher / Faculty</option>
                      <option value="PRINCIPAL">Principal / Academic Director</option>
                      <option value="VICE_PRINCIPAL">Vice Principal</option>
                      <option value="ACCOUNTANT">Accountant / Bursar</option>
                      <option value="HR_MANAGER">HR Manager</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Onboarding Summary Card */}
              <div
                style={{
                  backgroundColor: '#EAF5FC',
                  border: '1px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1', margin: '0 0 10px', textTransform: 'uppercase' }}>
                  Ready to Issue Official Credentials
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12.5px', color: '#0c4a6e' }}>
                  <div>• Faculty: <strong>{firstName} {lastName}</strong></div>
                  <div>• Department: <strong>{department}</strong></div>
                  <div>• Designation: <strong>{designation}</strong></div>
                  <div>• Email: <strong>{email}</strong></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
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
                    padding: '12px 28px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2270AF 0%, #9E3BB3 100%)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(34, 112, 175, 0.3)',
                  }}
                >
                  {submitting ? (
                    <span>Generating Credentials & Badges...</span>
                  ) : (
                    <>
                      <FileCheck size={18} />
                      <span>Complete Onboarding & Issue Badge</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: SUCCESS CONFIRMATION & DIGITAL BADGE */}
          {step === 8 && completedData && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Faculty Onboarding Completed Successfully!
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  Employee ID auto-generated and scannable verification QR Code badge issued.
                </p>
              </div>

              {/* Temporary Password Modal / Box */}
              {completedData.provisioning && (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: '12px',
                    padding: '18px 24px',
                    marginBottom: '28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <KeyRound size={18} color="#b45309" />
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#92400e' }}>
                        Temporary ERP Login Credentials
                      </span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#78350f' }}>
                      Email: <strong>{completedData.provisioning.email}</strong> • Temporary Password: <code style={{ backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{completedData.provisioning.temporaryPassword}</code>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '4px' }}>
                      * Mandatory password reset required upon their first login.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d97706',
                      backgroundColor: '#FFFFFF',
                      color: '#b45309',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {copiedCreds ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
                    <span>{copiedCreds ? 'Credentials Copied!' : 'Copy Credentials'}</span>
                  </button>
                </div>
              )}

              {/* Issued Digital ID Badge Preview */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: '16px' }}>
                  Official Digital Staff Badge
                </h3>
                <DigitalStaffIdCard
                  staff={{
                    id: completedData.staff.id,
                    employeeId: completedData.staff.employeeId,
                    name: `${completedData.staff.firstName} ${completedData.staff.lastName}`,
                    designation: completedData.staff.designation,
                    department: completedData.staff.department,
                    bloodGroup: completedData.staff.bloodGroup,
                    employmentType: completedData.staff.employmentType,
                    qrCodeDataUrl: completedData.staff.qrCodeDataUrl,
                    responsibilities: completedData.staff.responsibilities,
                  }}
                  organizationName={currentUser.organizationName}
                  institutionName={currentUser.institutionName}
                />
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Link
                  href="/staff"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: '#192D55',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Users size={16} />
                  <span>Return to Staff HR Directory</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setPhone('');
                    setCompletedData(null);
                  }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Onboard Another Faculty Member
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
