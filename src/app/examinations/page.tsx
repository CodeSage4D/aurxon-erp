'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Drawer from '@/components/ui/Drawer';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  FileSpreadsheet,
  PlusCircle,
  Calendar,
  Printer,
  FileCheck,
  CheckCircle,
} from 'lucide-react';

export default function ExaminationsPage() {
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Marks Entry Drawer
  const [marksDrawerOpen, setMarksDrawerOpen] = useState(false);
  const [selectedExamSubject, setSelectedExamSubject] = useState<any>(null);
  const [marksRoster, setMarksRoster] = useState<any[]>([]);
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksSuccess, setMarksSuccess] = useState('');
  const [marksError, setMarksError] = useState('');

  // Report Card Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCardData, setReportCardData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // New Exam Drawer
  const [newExamDrawerOpen, setNewExamDrawerOpen] = useState(false);
  const [newExamData, setNewExamData] = useState({
    name: '',
    examType: 'PERIODIC_TEST',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    status: 'SCHEDULED',
  });

  const loadExams = async () => {
    try {
      const res = await fetch('/api/v1/examinations');
      if (res.ok) {
        const json = await res.json();
        setExams(json.exams || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, exRes, stRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/examinations'),
          fetch('/api/v1/students?status=ALL'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        }

        if (exRes.ok) {
          const exJson = await exRes.json();
          setExams(exJson.exams || []);
          if (exJson.exams?.length > 0) {
            setSelectedExamId(exJson.exams[0].id);
          }
        }

        if (stRes.ok) {
          const stJson = await stRes.json();
          setStudents(stJson.students || []);
          if (stJson.students?.length > 0) {
            setSelectedStudentId(stJson.students[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const openMarksEntry = async (examSubject: any) => {
    setSelectedExamSubject(examSubject);
    setMarksSuccess('');
    setMarksError('');
    try {
      const res = await fetch(`/api/v1/examinations/${examSubject.examId}/marks?examSubjectId=${examSubject.id}`);
      if (res.ok) {
        const json = await res.json();
        setMarksRoster(json.roster || []);
        setMarksDrawerOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExamSubject) return;
    setSavingMarks(true);
    setMarksError('');
    setMarksSuccess('');

    try {
      const res = await fetch(`/api/v1/examinations/${selectedExamSubject.examId}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examSubjectId: selectedExamSubject.id,
          entries: marksRoster.map((r) => ({
            studentId: r.studentId,
            marksObtained: Number(r.marksObtained),
            isAbsent: r.isAbsent,
            remarks: r.remarks,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setMarksError(json.error || 'Failed to submit marks');
        setSavingMarks(false);
        return;
      }

      setMarksSuccess(json.message);
      await loadExams();
    } catch {
      setMarksError('Network error while saving marks');
    } finally {
      setSavingMarks(false);
    }
  };

  const viewReportCard = async (studentId: string, examId: string) => {
    try {
      const res = await fetch(`/api/v1/examinations/report-card?studentId=${studentId}&examId=${examId}`);
      if (res.ok) {
        const json = await res.json();
        setReportCardData(json.reportCard);
        setReportModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/examinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExamData),
      });
      if (res.ok) {
        setNewExamDrawerOpen(false);
        await loadExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Examinations Hub...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Examinations & Academic Assessment</h1>
            <p className="page-subtitle">
              Manage test schedules, faculty marks entry, deterministic grading calculations, and report card generation
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (selectedStudentId && selectedExamId) {
                  viewReportCard(selectedStudentId, selectedExamId);
                }
              }}
            >
              <FileCheck size={16} /> View Student Report Card
            </button>

            {(user.role === 'PRINCIPAL' || user.role === 'ORG_ADMIN') && (
              <button className="btn btn-primary" onClick={() => setNewExamDrawerOpen(true)}>
                <PlusCircle size={16} /> Create Examination
              </button>
            )}
          </div>
        </div>

        {/* Examinations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {exams.map((exam) => (
            <div key={exam.id} className="card">
              <div className="card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 className="card-title" style={{ fontSize: '18px' }}>{exam.name}</h3>
                    <Badge variant={exam.status === 'PUBLISHED' ? 'success' : 'info'}>
                      {exam.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Type: {exam.examType} • {new Date(exam.startDate).toLocaleDateString('en-IN')} to {new Date(exam.endDate).toLocaleDateString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (students.length > 0) {
                        viewReportCard(students[0].id, exam.id);
                      }
                    }}
                  >
                    <Printer size={14} /> Report Cards
                  </button>
                </div>
              </div>

              {/* Exam Subjects / Papers Table */}
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Paper / Subject</th>
                      <th>Class & Section / Batch</th>
                      <th>Max Marks</th>
                      <th>Pass Marks</th>
                      <th>Marks Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exam.examSubjects?.map((es: any) => (
                      <tr key={es.id}>
                        <td style={{ fontWeight: 600 }}>{es.subject.name}</td>
                        <td>
                          {es.section
                            ? `${es.section.classLevel?.name} - ${es.section.name}`
                            : (es.batch?.name || 'Class 10')}
                        </td>
                        <td>{es.maxMarks}</td>
                        <td>{es.passMarks}</td>
                        <td>
                          {es.marksEntries?.length > 0 ? (
                            <Badge variant="success">
                              <CheckCircle size={12} /> {es.marksEntries.length} Marks Entered
                            </Badge>
                          ) : (
                            <Badge variant="warning">Pending Entry</Badge>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openMarksEntry(es)}
                          >
                            Enter Marks
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* -------------------------------------------------------------
            MARKS ENTRY SLIDE-OVER DRAWER
           ------------------------------------------------------------- */}
        <Drawer
          isOpen={marksDrawerOpen}
          onClose={() => setMarksDrawerOpen(false)}
          title={`Marks Entry: ${selectedExamSubject?.subjectName || 'Subject'}`}
          subtitle={`Max Marks: ${selectedExamSubject?.maxMarks || 100} • Pass Marks: ${selectedExamSubject?.passMarks || 33}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setMarksDrawerOpen(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveMarks}
                disabled={savingMarks}
              >
                {savingMarks ? 'Calculating & Saving...' : 'Save & Compute Grades'}
              </button>
            </>
          }
        >
          <div>
            {marksSuccess && (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {marksSuccess}
              </div>
            )}
            {marksError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {marksError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {marksRoster.map((item, idx) => (
                <div
                  key={item.studentId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--surface-subtle)',
                    borderRadius: '8px',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {item.rollNumber ? `Roll ${item.rollNumber}: ` : ''}{item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.admissionNumber}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '90px' }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Marks (Max {selectedExamSubject?.maxMarks})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={selectedExamSubject?.maxMarks || 100}
                        className="form-input"
                        style={{ padding: '6px 8px', fontSize: '13px', fontWeight: 600 }}
                        value={item.marksObtained}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMarksRoster((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, marksObtained: val } : r
                            )
                          );
                        }}
                      />
                    </div>

                    {item.grade && (
                      <div style={{ textAlign: 'center', minWidth: '45px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Grade</div>
                        <Badge variant="success">{item.grade}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Drawer>

        {/* -------------------------------------------------------------
            PRINTABLE DIGITAL REPORT CARD MODAL
           ------------------------------------------------------------- */}
        <Modal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          title="Official Academic Report Card"
          subtitle={reportCardData?.institution?.name}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setReportModalOpen(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print / Download PDF
              </button>
            </>
          }
        >
          {reportCardData && (
            <div style={{ padding: '8px' }}>
              {/* Institution & Exam Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-default)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {reportCardData.institution.name}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Affiliated to {reportCardData.institution.board} • {reportCardData.institution.address}
                </div>
                <div style={{ display: 'inline-block', backgroundColor: 'var(--primary-light)', padding: '4px 12px', borderRadius: '4px', fontWeight: 700, fontSize: '13px', color: 'var(--primary-dark)', marginTop: '8px' }}>
                  {reportCardData.exam.name}
                </div>
              </div>

              {/* Student Details */}
              {/* Student Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px', backgroundColor: 'var(--surface-subtle)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Student Name: </span>
                  <strong>{reportCardData.student.name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Class & Section: </span>
                  <strong>{reportCardData.student.classSection}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Father&apos;s Name: </span>
                  <strong>{reportCardData.student.fatherName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Mother&apos;s Name: </span>
                  <strong>{reportCardData.student.motherName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Admission No: </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{reportCardData.student.admissionNumber}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Roll Number: </span>
                  <strong>{reportCardData.student.rollNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Aadhar No: </span>
                  <span style={{ fontFamily: 'monospace' }}>{reportCardData.student.aadharNumber || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Date of Birth: </span>
                  <strong>{reportCardData.student.dob}</strong>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <table className="data-table" style={{ marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Max Marks</th>
                    <th>Pass Marks</th>
                    <th>Marks Scored</th>
                    <th>CBSE Grade</th>
                    <th>Grade Point</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCardData.subjects.map((sub: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{sub.subjectName} ({sub.subjectCode})</td>
                      <td>{sub.maxMarks}</td>
                      <td>{sub.passMarks}</td>
                      <td style={{ fontWeight: 700, color: sub.isPass ? 'var(--text-main)' : '#dc2626' }}>
                        {sub.marksObtained}
                      </td>
                      <td><Badge variant={sub.isPass ? 'success' : 'danger'}>{sub.grade}</Badge></td>
                      <td style={{ fontWeight: 600 }}>{sub.gradePoint !== undefined ? sub.gradePoint.toFixed(1) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Results */}
              <div style={{ padding: '14px', border: '1px solid var(--border-default)', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', textAlign: 'center', backgroundColor: 'var(--surface-subtle)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Marks</div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>
                    {reportCardData.summary.totalMarksObtained} / {reportCardData.summary.totalMaxMarks}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Percentage</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                    {reportCardData.summary.percentage}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CGPA</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb' }}>
                    {reportCardData.summary.cgpa || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Result / Division</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: reportCardData.summary.resultStatus === 'PASSED' ? '#059669' : '#dc2626' }}>
                    {reportCardData.summary.resultStatus} ({reportCardData.summary.division})
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Create Exam Drawer */}
        <Drawer
          isOpen={newExamDrawerOpen}
          onClose={() => setNewExamDrawerOpen(false)}
          title="Create New Examination"
          subtitle="Define assessment term and schedule"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setNewExamDrawerOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateExam}>
                Save Examination
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateExam}>
            <div className="form-group">
              <label className="form-label">Examination Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={newExamData.name}
                onChange={(e) => setNewExamData({ ...newExamData, name: e.target.value })}
                placeholder="e.g. Term 2 Final Examination 2026"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Indian Exam Category / Type *</label>
              <select
                className="form-select"
                value={newExamData.examType}
                onChange={(e) => setNewExamData({ ...newExamData, examType: e.target.value })}
              >
                <option value="UNIT_TEST_1">Unit Test I (Formative)</option>
                <option value="PERIODIC_TEST_1">Periodic Test I (PT-1)</option>
                <option value="HALF_YEARLY">Half Yearly / Mid-Term Exam</option>
                <option value="UNIT_TEST_2">Unit Test II (Formative)</option>
                <option value="PERIODIC_TEST_2">Periodic Test II (PT-2)</option>
                <option value="ANNUAL">Annual / Final Examination</option>
                <option value="PRE_BOARD_1">Pre-Board Examination I</option>
                <option value="PRE_BOARD_2">Pre-Board Examination II</option>
                <option value="MOCK_TEST">NEET / JEE Mock Test</option>
                <option value="BOARD_EXAM">Board Public Examination</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={newExamData.startDate}
                  onChange={(e) => setNewExamData({ ...newExamData, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={newExamData.endDate}
                  onChange={(e) => setNewExamData({ ...newExamData, endDate: e.target.value })}
                />
              </div>
            </div>
          </form>
        </Drawer>
      </div>
    </AppShell>
  );
}
