'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import DataTable, { Column } from '@/components/ui/DataTable';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import {
  UserPlus,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Upload,
} from 'lucide-react';

import { INDIAN_STATES_AND_UTS } from '@/lib/data/indian-states';

const initialStudentFormData = {
  firstName: '',
  lastName: '',
  fatherName: '',
  motherName: '',
  fatherOccupation: '',
  motherOccupation: '',
  guardianPhone: '',
  aadharNumber: '',
  religion: 'HINDU',
  casteCategory: 'GENERAL',
  previousSchool: '',
  tcNumber: '',
  schoolBoard: 'CBSE',
  dob: '2010-06-15',
  gender: 'MALE',
  branchId: '',
  sectionId: '',
  batchId: '',
  contactPhone: '',
  email: '',
  address: '',
  city: 'Delhi',
  state: 'Delhi NCR',
  pincode: '',
  category: 'GENERAL',
  bloodGroup: '',
  parentName: '',
  parentPhone: '',
  parentRelation: 'FATHER',
};

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer states
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'overview' | 'attendance' | 'fees' | 'exams' | 'documents'>('overview');

  // Document upload state
  const [docUploadType, setDocUploadType] = useState('BIRTH_CERTIFICATE');
  const [docUploadTitle, setDocUploadTitle] = useState('');
  const [docUploadUrl, setDocUploadUrl] = useState('');
  const [docSubmitting, setDocSubmitting] = useState(false);

  // New Student Form state
  const [sections, setSections] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState(initialStudentFormData);

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/v1/students?status=ALL');
      if (res.ok) {
        const json = await res.json();
        setStudents(json.students || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, stRes, clsRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/students?status=ALL'),
          fetch('/api/v1/academics/classes'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (stRes.ok) {
          const stJson = await stRes.json();
          setStudents(stJson.students || []);
        }

        if (clsRes.ok) {
          const clsJson = await clsRes.json();
          setSections(clsJson.sections || []);
          setBatches(clsJson.batches || []);
          setBranches(clsJson.branches || []);
          setFormData((prev) => ({
            ...prev,
            sectionId: clsJson.sections?.[0]?.id || '',
            branchId: clsJson.branches?.[0]?.id || '',
          }));
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const openStudentProfile = async (studentId: string) => {
    try {
      const res = await fetch(`/api/v1/students/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedStudent(json.student);
        setProfileTab('overview');
        setProfileOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/v1/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error || 'Failed to enroll student');
        setFormSubmitting(false);
        return;
      }

      setCreateOpen(false);
      setFormData({
        ...initialStudentFormData,
        branchId: branches[0]?.id || '',
        sectionId: sections[0]?.id || '',
      });
      await loadStudents();
    } catch {
      setFormError('Network error while saving student');
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'admissionNumber',
      header: 'Admission No',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          {row.admissionNumber}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Student Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}
          >
            {row.firstName.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600 }}>{row.firstName} {row.lastName}</span>
              {row.branch && (
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'var(--surface-hover)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {row.branch.code}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Roll: {row.rollNumber || 'N/A'} • {row.gender}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'classPlacement',
      header: 'Academic Placement',
      render: (row) => (
        <div>
          {row.section ? (
            <div>
              <span style={{ fontWeight: 500 }}>{row.section.classLevel?.name}</span>{' '}
              <Badge variant="neutral">{row.section.name}</Badge>
            </div>
          ) : row.batch ? (
            <div>
              <span style={{ fontWeight: 500 }}>{row.batch.course?.name}</span>{' '}
              <Badge variant="info">{row.batch.name}</Badge>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'contactPhone',
      header: 'Contact',
      render: (row) => (
        <div style={{ fontSize: '13px' }}>
          <div>{row.contactPhone || 'N/A'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Guardian: {row.studentParents?.[0]?.parent?.firstName || 'Registered'}
          </div>
        </div>
      ),
    },
    {
      key: 'feeStatus',
      header: 'Fee Dues',
      render: (row) => {
        const alloc = row.feeAllocations?.[0];
        if (!alloc) return <Badge variant="neutral">Not Assigned</Badge>;
        if (alloc.balanceAmount === 0) return <Badge variant="success">Fully Paid</Badge>;
        if (alloc.paidAmount > 0) return <Badge variant="warning">Partial (₹{alloc.balanceAmount.toLocaleString('en-IN')})</Badge>;
        return <Badge variant="danger">Unpaid (₹{alloc.balanceAmount.toLocaleString('en-IN')})</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            openStudentProfile(row.id);
          }}
        >
          <Eye size={13} /> View 360
        </button>
      ),
    },
  ];

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Student Information System...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Student Information System (SIS)</h1>
            <p className="page-subtitle">
              Centralized repository of active student profiles, academic history, fees, and attendance
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                const csv = [
                  ['Admission Number', 'Name', 'Class/Batch', 'Contact', 'Status'],
                  ...students.map((s) => [
                    s.admissionNumber,
                    `${s.firstName} ${s.lastName}`,
                    s.section ? `${s.section.classLevel?.name} - ${s.section.name}` : (s.batch?.name || ''),
                    s.contactPhone,
                    s.status,
                  ]),
                ]
                  .map((e) => e.join(','))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `AURXON_Students_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
            >
              <Download size={15} /> Export CSV
            </button>

            <button
              className="btn btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              <UserPlus size={16} /> Enroll New Student
            </button>
          </div>
        </div>

        {/* Student Directory Table */}
        <DataTable
          columns={columns}
          data={students}
          searchPlaceholder="Search student name or admission number..."
          searchKey={(s) => `${s.firstName} ${s.lastName} ${s.admissionNumber}`}
          onRowClick={(row) => openStudentProfile(row.id)}
          emptyMessage="No students found matching filters."
        />

        {/* -------------------------------------------------------------
            STUDENT 360 PROFILE SLIDE-OVER DRAWER
           ------------------------------------------------------------- */}
        <Drawer
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          title={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Student Profile'}
          subtitle={selectedStudent ? `Admission: ${selectedStudent.admissionNumber} • Roll No: ${selectedStudent.rollNumber || 'N/A'}` : ''}
          footer={
            <button className="btn btn-secondary" onClick={() => setProfileOpen(false)}>
              Close Profile
            </button>
          }
        >
          {selectedStudent && (
            <div>
              {/* Tab Navigation */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 'var(--space-5)',
                  gap: 'var(--space-2)',
                }}
              >
                {(['overview', 'attendance', 'fees', 'exams'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setProfileTab(tab)}
                    style={{
                      padding: '8px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: profileTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                      color: profileTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: profileTab === tab ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview & Personal Details */}
              {profileTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ padding: '14px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Academic Placement
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                      {selectedStudent.section
                        ? `${selectedStudent.section.classLevel?.name} - ${selectedStudent.section.name}`
                        : (selectedStudent.batch?.name || 'Unassigned')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Room: {selectedStudent.section?.roomNumber || 'Assigned Campus'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <span className="form-label">Date of Birth</span>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {new Date(selectedStudent.dob).toLocaleDateString('en-IN')}
                      </div>
                    </div>

                    <div className="form-group">
                      <span className="form-label">Gender</span>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedStudent.gender}</div>
                    </div>

                    <div className="form-group">
                      <span className="form-label">Category</span>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedStudent.category || 'General'}</div>
                    </div>

                    <div className="form-group">
                      <span className="form-label">Blood Group</span>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedStudent.bloodGroup || 'Not Specified'}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Parent & Guardian Contact</div>
                    {selectedStudent.studentParents?.map((sp: any) => (
                      <div key={sp.id} style={{ padding: '10px 12px', backgroundColor: 'var(--surface-subtle)', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {sp.parent.firstName} {sp.parent.lastName} ({sp.parent.relation})
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <Phone size={13} /> {sp.parent.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Attendance History */}
              {profileTab === 'attendance' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                    Past 14 Days Attendance Log
                  </div>
                  {selectedStudent.attendanceRecords?.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No recorded attendance history.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedStudent.attendanceRecords.map((att: any) => (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            <span>{new Date(att.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div>
                            {att.status === 'PRESENT' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '12px', fontWeight: 600 }}>
                                <CheckCircle2 size={14} /> Present
                              </span>
                            )}
                            {att.status === 'ABSENT' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}>
                                <XCircle size={14} /> Absent
                              </span>
                            )}
                            {att.status === 'LATE' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#d97706', fontSize: '12px', fontWeight: 600 }}>
                                <Clock size={14} /> Late
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Fees & Billing */}
              {profileTab === 'fees' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                    Fee Allocations & Outstanding Balances
                  </div>
                  {selectedStudent.feeAllocations?.map((alloc: any) => (
                    <div key={alloc.id} style={{ padding: '14px', border: '1px solid var(--border-subtle)', borderRadius: '8px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{alloc.feeStructure?.name}</span>
                        <Badge variant={alloc.status === 'PAID' ? 'success' : alloc.status === 'PARTIAL' ? 'warning' : 'danger'}>
                          {alloc.status}
                        </Badge>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '10px 0' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Total</div>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>₹{alloc.netAmount.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paid</div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#059669' }}>₹{alloc.paidAmount.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Balance</div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: alloc.balanceAmount > 0 ? '#dc2626' : '#059669' }}>
                            ₹{alloc.balanceAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {alloc.payments?.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Receipts Issued:</div>
                          {alloc.payments.map((p: any) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                              <span>{p.receiptNumber} ({p.paymentMethod})</span>
                              <span style={{ fontWeight: 600 }}>₹{p.amount.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Examination Results */}
              {profileTab === 'exams' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                    Academic Assessments & Marks
                  </div>
                  {selectedStudent.marksEntries?.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No exam scores recorded yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedStudent.marksEntries.map((m: any) => (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.examSubject.subject.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Exam: {m.examSubject.exam?.name || 'Term Exam'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: '15px' }}>
                              {m.marksObtained} / {m.examSubject.maxMarks}
                            </div>
                            <Badge variant="success">Grade {m.grade || 'Pass'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Drawer>

        {/* -------------------------------------------------------------
            ENROLL NEW STUDENT SLIDE-OVER DRAWER
           ------------------------------------------------------------- */}
        <Drawer
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Enroll New Student"
          subtitle="Add student profile, academic allocation, and parent credentials"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateSubmit}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Enrolling...' : 'Complete Enrollment'}
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit}>
            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Aryan"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Kapoor"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  className="form-select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {branches.length > 0 && (
              <div className="form-group">
                <label className="form-label">Campus / Branch Location *</label>
                <select
                  className="form-select"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                >
                  {branches.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.name} ({br.code}) {br.city ? `• ${br.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Class & Section Assignment *</label>
              <select
                className="form-select"
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.classLevel?.name} - {sec.name}
                  </option>
                ))}
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    Coaching: {batch.name} ({batch.course?.code})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+91 98111 22233"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@institution.edu"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Sector / Flat / Street address"
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Parent / Guardian Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Parent Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="e.g. Sunil Kapoor"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Relationship *</label>
                  <select
                    className="form-select"
                    value={formData.parentRelation}
                    onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                  >
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="GUARDIAN">Guardian</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Parent Emergency Phone *</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="+91 98111 44556"
                />
              </div>
            </div>
          </form>
        </Drawer>
      </div>
    </AppShell>
  );
}
