'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import {
  FileText,
  Printer,
  Download,
  Award,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  GraduationCap,
  Building2,
  Calendar,
  Search,
} from 'lucide-react';

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'reportCard' | 'transferCert' | 'tabulation' | 'defaulters'>('reportCard');

  useEffect(() => {
    async function load() {
      try {
        const [meRes, repRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/reports'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (repRes.ok) {
          const rJson = await repRes.json();
          setData(rJson);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#0284c7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading Official CBSE Reports & Certificate Center...</p>
        </div>
      </div>
    );
  }

  const card = data?.sampleReportCard;

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        {/* Header Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bae6fd' }}>
                <FileText size={20} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                CBSE Reports & Document Certification
              </h1>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 46px' }}>
              Board-compliant scholastic report cards, Transfer Certificates (TC), Tabulation Registers & Dues Ledgers
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Printer size={15} />
              <span>Print Document</span>
            </button>
            <button
              onClick={() => alert('Downloading official PDF document package...')}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={15} />
              <span>Export PDF Bundle</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('reportCard')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'reportCard' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'reportCard' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Award size={16} />
            <span>CBSE Term Report Card</span>
          </button>
          <button
            onClick={() => setActiveTab('transferCert')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'transferCert' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'transferCert' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={16} />
            <span>Transfer Certificate (TC)</span>
          </button>
          <button
            onClick={() => setActiveTab('tabulation')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'tabulation' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'tabulation' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Class Tabulation Register</span>
          </button>
          <button
            onClick={() => setActiveTab('defaulters')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'defaulters' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'defaulters' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={16} />
            <span>Fee Defaulters Ledger</span>
          </button>
        </div>

        {/* TAB 1: OFFICIAL CBSE REPORT CARD */}
        {activeTab === 'reportCard' && card && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #0c4a6e',
              borderRadius: '8px',
              padding: '36px',
              maxWidth: '900px',
              margin: '0 auto',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
          >
            {/* Institution Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0284c7', marginBottom: '4px' }}>
                Affiliated to Central Board of Secondary Education (CBSE), New Delhi
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0c4a6e', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {card.institutionName}
              </h2>
              <div style={{ fontSize: '12.5px', color: '#475569' }}>
                Affiliation No: <strong>{card.affiliationNumber}</strong> • School Code: <strong>25014</strong> • Academic Session: <strong>{card.academicSession}</strong>
              </div>
              <div style={{ marginTop: '12px', display: 'inline-block', padding: '4px 16px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px', fontSize: '13px', fontWeight: 800, color: '#0369a1' }}>
                CONTINUOUS & COMPREHENSIVE SCHOLASTIC REPORT CARD
              </div>
            </div>

            {/* Student Profile Grid */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div><span style={{ color: '#64748b' }}>Student Name:</span> <strong>{card.studentName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Admission No:</span> <strong>{card.admissionNumber}</strong></div>
                <div><span style={{ color: '#64748b' }}>Roll No:</span> <strong>{card.rollNumber}</strong></div>
                <div><span style={{ color: '#64748b' }}>Class & Section:</span> <strong>{card.classAndSection}</strong></div>
                <div><span style={{ color: '#64748b' }}>Date of Birth:</span> <strong>{card.dob}</strong></div>
                <div><span style={{ color: '#64748b' }}>Attendance:</span> <strong>{card.attendance}</strong></div>
                <div><span style={{ color: '#64748b' }}>Father&apos;s Name:</span> <strong>{card.fatherName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Mother&apos;s Name:</span> <strong>{card.motherName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Curriculum:</span> <strong>CBSE NEP-2020</strong></div>
              </div>
            </div>

            {/* Part 1: Scholastic Assessment Table */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0c4a6e', marginBottom: '8px', textTransform: 'uppercase' }}>
                Part 1: Scholastic Performance
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>Subject</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Periodic Test (10)</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Notebook (5)</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Sub Enrichment (5)</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Term Exam (80)</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Total (100)</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {card.scholasticSubjects.map((sub: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>{sub.subject}</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{sub.ptMarks}</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{sub.nbMarks}</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{sub.seaMarks}</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{sub.halfYearlyMarks}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: '#0c4a6e', borderRight: '1px solid #e2e8f0' }}>{sub.total}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>{sub.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Part 2: Co-Scholastic & Overall Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0c4a6e', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Part 2: Co-Scholastic Activities
                </h4>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', fontSize: '12.5px' }}>
                  {card.coScholasticAreas.map((co: any, cIdx: number) => (
                    <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: cIdx < 3 ? '1px solid #e2e8f0' : 'none' }}>
                      <span>{co.area}</span>
                      <strong style={{ color: '#0284c7' }}>Grade {co.grade}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0c4a6e', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Summary & Assessment
                </h4>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 14px', fontSize: '12.5px', backgroundColor: '#f8fafc' }}>
                  <div style={{ marginBottom: '6px' }}>Aggregate Percentage: <strong>{card.overallPercentage}</strong> (Grade <strong>{card.overallGrade}</strong>)</div>
                  <div style={{ marginBottom: '6px' }}>Result: <strong style={{ color: '#15803d' }}>{card.result}</strong></div>
                  <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>&ldquo;{card.remarks}&rdquo;</div>
                </div>
              </div>
            </div>

            {/* Official Signature Lines */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e2e8f0', paddingTop: '40px', marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#334155' }}>
              <div style={{ width: '160px' }}>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>Class Teacher</div>
              </div>
              <div style={{ width: '160px' }}>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>Examination In-Charge</div>
              </div>
              <div style={{ width: '160px' }}>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>Principal & School Seal</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSFER CERTIFICATE (TC) */}
        {activeTab === 'transferCert' && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #0c4a6e',
              borderRadius: '8px',
              padding: '36px',
              maxWidth: '850px',
              margin: '0 auto',
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0284c7' }}>
                Education Department • Government of NCT of Delhi
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0c4a6e', margin: '4px 0' }}>
                {card?.institutionName || 'Delhi Public School, R.K. Puram'}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                UDISE+ Code: <strong>07080300411</strong> • Affiliation No: <strong>CBSE-DEL-270014</strong>
              </div>
              <div style={{ marginTop: '10px', display: 'inline-block', padding: '4px 14px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '14px', fontWeight: 800 }}>
                TRANSFER CERTIFICATE / SCHOOL LEAVING CERTIFICATE
              </div>
            </div>

            <div style={{ fontSize: '13.5px', lineHeight: '2.2', color: '#1e293b' }}>
              <div>1. TC Serial Number: <strong>DPS/TC/2026/0412</strong></div>
              <div>2. Student Full Name: <strong>Aarav Sharma</strong></div>
              <div>3. Mother&apos;s Name: <strong>Mrs. Sunita Sharma</strong></div>
              <div>4. Father&apos;s / Guardian&apos;s Name: <strong>Dr. Alok Sharma</strong></div>
              <div>5. Nationality: <strong>Indian</strong></div>
              <div>6. Whether belongs to SC/ST/OBC: <strong>General</strong></div>
              <div>7. Date of first admission in the school with Class: <strong>04-Apr-2018 in Class 2</strong></div>
              <div>8. Date of Birth according to Admission Register: <strong>14-Aug-2009 (Fourteenth August Two Thousand Nine)</strong></div>
              <div>9. Class in which pupil last studied: <strong>Class 10 (Tenth)</strong></div>
              <div>10. School / Board Annual Examination last taken: <strong>Passed Class 10 CBSE Board Examination</strong></div>
              <div>11. Whether failed, if so once/twice: <strong>No</strong></div>
              <div>12. Month up to which school dues have been paid: <strong>March 2026 (All dues fully cleared)</strong></div>
              <div>13. Total number of working days: <strong>196 Days</strong></div>
              <div>14. Total number of working days present: <strong>188 Days</strong></div>
              <div>15. General Conduct: <strong>Exemplary</strong></div>
              <div>16. Date of application for certificate: <strong>02-Sep-2026</strong></div>
              <div>17. Reason for leaving the school: <strong>Parent relocation to Mumbai</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e2e8f0', paddingTop: '40px', marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#334155' }}>
              <div style={{ width: '160px' }}><div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>Prepared By</div></div>
              <div style={{ width: '160px' }}><div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>Verified By Head Clerk</div></div>
              <div style={{ width: '160px' }}><div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700 }}>Principal (Seal & Signature)</div></div>
            </div>
          </div>
        )}

        {/* TAB 3: TABULATION REGISTER */}
        {activeTab === 'tabulation' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Class 10-A Master Tabulation Roll</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Subject-wise marks compilation for CBSE Moderation Committee</p>
              </div>
              <button
                onClick={() => alert('Exporting tabulation sheet to CSV...')}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Export Tabulation CSV</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 14px' }}>Roll No</th>
                    <th style={{ padding: '10px 14px' }}>Student Name</th>
                    <th style={{ padding: '10px 14px' }}>English</th>
                    <th style={{ padding: '10px 14px' }}>Maths</th>
                    <th style={{ padding: '10px 14px' }}>Science</th>
                    <th style={{ padding: '10px 14px' }}>Social Sc</th>
                    <th style={{ padding: '10px 14px' }}>Hindi / Sanskrit</th>
                    <th style={{ padding: '10px 14px' }}>Total (500)</th>
                    <th style={{ padding: '10px 14px' }}>% Score</th>
                    <th style={{ padding: '10px 14px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { roll: '10141', name: 'Aanya Gupta', eng: 92, math: 98, sci: 95, sst: 91, lang: 94, total: 470, pct: '94.0%', grade: 'A1' },
                    { roll: '10142', name: 'Aarav Sharma', eng: 91, math: 96, sci: 88, sst: 88, lang: 91, total: 454, pct: '90.8%', grade: 'A1' },
                    { roll: '10143', name: 'Advait Patel', eng: 85, math: 89, sci: 82, sst: 86, lang: 84, total: 426, pct: '85.2%', grade: 'A2' },
                    { roll: '10144', name: 'Ananya Verma', eng: 88, math: 92, sci: 90, sst: 89, lang: 90, total: 449, pct: '89.8%', grade: 'A1' },
                    { roll: '10145', name: 'Devansh Roy', eng: 78, math: 81, sci: 76, sst: 79, lang: 80, total: 394, pct: '78.8%', grade: 'B1' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{row.roll}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{row.name}</td>
                      <td style={{ padding: '10px 14px' }}>{row.eng}</td>
                      <td style={{ padding: '10px 14px' }}>{row.math}</td>
                      <td style={{ padding: '10px 14px' }}>{row.sci}</td>
                      <td style={{ padding: '10px 14px' }}>{row.sst}</td>
                      <td style={{ padding: '10px 14px' }}>{row.lang}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0c4a6e' }}>{row.total}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0284c7' }}>{row.pct}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f0f9ff', color: '#0369a1' }}>
                          {row.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DEFAULTERS */}
        {activeTab === 'defaulters' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Fee Defaulters & Outstanding Balances</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Quarter 2 (Jul - Sep 2026) recovery ledger</p>
              </div>
              <button
                onClick={() => alert('Sending automated SMS/WhatsApp reminders to defaulter parents...')}
                style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Send SMS Dues Reminder
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                    <th style={{ padding: '12px 16px' }}>Admission No</th>
                    <th style={{ padding: '12px 16px' }}>Student Name</th>
                    <th style={{ padding: '12px 16px' }}>Class / Section</th>
                    <th style={{ padding: '12px 16px' }}>Pending Heads</th>
                    <th style={{ padding: '12px 16px' }}>Amount Overdue</th>
                    <th style={{ padding: '12px 16px' }}>Parent Mobile</th>
                    <th style={{ padding: '12px 16px' }}>Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { adm: 'DPS-2024-108', name: 'Kabir Malhotra', cls: 'Class 9-B', heads: 'Tuition + Transport Fee', amt: '₹14,500', phone: '+91 98112 44101', days: 24 },
                    { adm: 'DPS-2024-114', name: 'Rohan Mehra', cls: 'Class 11-Science', heads: 'Lab Fee + Exam Fee', amt: '₹8,200', phone: '+91 98112 44102', days: 18 },
                    { adm: 'DPS-2024-122', name: 'Siddharth Sen', cls: 'Class 8-A', heads: 'Tuition Fee Q2', amt: '₹12,000', phone: '+91 98112 44103', days: 12 },
                  ].map((def, dIdx) => (
                    <tr key={dIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{def.adm}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{def.name}</td>
                      <td style={{ padding: '12px 16px' }}>{def.cls}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{def.heads}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#b91c1c' }}>{def.amt}</td>
                      <td style={{ padding: '12px 16px', color: '#0284c7' }}>{def.phone}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#b91c1c' }}>
                          {def.days} Days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
