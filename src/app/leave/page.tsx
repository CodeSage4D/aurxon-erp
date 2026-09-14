'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Users,
  ShieldCheck,
  FileText,
  Plus,
  Send,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  X,
  GraduationCap,
  Briefcase,
  AlertCircle,
  User,
  Info,
} from 'lucide-react';

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState<'MY_LEAVE' | 'APPROVAL_HUB' | 'STUDENT_LEAVE' | 'POLICIES'>('MY_LEAVE');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Staff Leave States
  const [staffData, setStaffData] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    totalDays: 1,
    halfDay: false,
    halfDayPeriod: 'FIRST_HALF',
    emergency: false,
    reason: '',
    contactDuringLeave: '',
    supportingDocUrl: '',
    substituteStaffId: '',
  });
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyWarnings, setApplyWarnings] = useState<string[]>([]);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Approval Hub States
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [assignedSubstitute, setAssignedSubstitute] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Student Leave States
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [showStudentApplyModal, setShowStudentApplyModal] = useState(false);
  const [studentApplyForm, setStudentApplyForm] = useState({
    studentId: '',
    leaveType: 'SICK',
    startDate: '',
    endDate: '',
    totalDays: 1,
    reason: '',
    parentConfirmation: true,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user session
      const meRes = await fetch('/api/v1/auth/me');
      const meJson = await meRes.json();
      if (meJson.user) {
        setUser(meJson.user);
      }

      // 2. Fetch staff leave data
      const staffRes = await fetch('/api/v1/leave/staff');
      const staffJson = await staffRes.json();
      if (staffJson.success) {
        setStaffData(staffJson.data);
      }

      // 3. Fetch student leave data
      const studentRes = await fetch('/api/v1/leave/student');
      const studentJson = await studentRes.json();
      if (studentJson.success) {
        setStudentLeaves(studentJson.data.requests || []);
        setAttendanceStats(studentJson.data.attendanceStats || null);
      }
    } catch (err) {
      console.error('Failed to load leave data', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Staff Leave Application
  const handleApplyStaffLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplySubmitting(true);
    setApplyError(null);
    setApplyWarnings([]);
    setApplySuccess(null);

    try {
      const res = await fetch('/api/v1/leave/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyForm),
      });

      const json = await res.json();
      if (!res.ok) {
        const errMsg = json.reasons ? json.reasons.join(' • ') : json.error || 'Failed to submit leave';
        setApplyError(errMsg);
        if (json.warnings) setApplyWarnings(json.warnings);
      } else {
        setApplySuccess(json.message || 'Leave request submitted successfully!');
        if (json.data?.warnings) setApplyWarnings(json.data.warnings);
        setTimeout(() => {
          setShowApplyModal(false);
          setApplySuccess(null);
          fetchInitialData();
        }, 1500);
      }
    } catch (err: any) {
      setApplyError(err.message || 'Submission failed');
    } finally {
      setApplySubmitting(false);
    }
  };

  // Handle Review Actions (Approve / Reject)
  const handleReviewAction = async (requestId: string, action: 'APPROVE' | 'REJECT' | 'CANCEL') => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/v1/leave/staff/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          remarks: approvalRemarks,
          assignedSubstituteStaffId: assignedSubstitute || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: json.error || 'Action failed' });
      } else {
        setActionMessage({ type: 'success', text: json.message || 'Action completed successfully' });
        setTimeout(() => {
          setSelectedRequest(null);
          setActionMessage(null);
          setApprovalRemarks('');
          fetchInitialData();
        }, 1200);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Student Leave Review (Approve / Reject)
  const handleStudentLeaveAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/v1/leave/student/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks: 'Reviewed by Class Teacher' }),
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch {
      // Ignore
    }
  };

  const calculateDays = (start: string, end: string, half: boolean) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return half ? Math.max(0.5, diffDays - 0.5) : diffDays;
  };

  return (
    <AppShell user={user || { id: 'usr_eval', name: 'Authorized User', email: 'user@aurxon.io', role: 'TEACHER', organizationName: 'AURXON Education' }}>
      <div className="min-h-screen bg-slate-50/60 pb-16">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#192D55] via-[#2270AF] to-[#9E3BB3] text-white pt-8 pb-14 px-6 sm:px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-sm">
                  Workflow & Policy Engine
                </span>
                <span className="text-xs text-blue-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Four-Eyes Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Leave Management & Institutional Approvals
              </h1>
              <p className="text-blue-100 text-sm mt-1 max-w-2xl">
                Multi-tier policy routing, timetable conflict detection, intelligent substitute teacher recommendation, and automatic attendance synchronization.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowApplyModal(true)}
                className="bg-white text-[#2270AF] hover:bg-blue-50 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4 text-[#2270AF]" />
                Apply Faculty Leave
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-1.5 flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('MY_LEAVE')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'MY_LEAVE'
                  ? 'bg-[#2270AF] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              My Leave
            </button>

            <button
              onClick={() => setActiveTab('APPROVAL_HUB')}
              className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 relative ${
                activeTab === 'APPROVAL_HUB'
                  ? 'bg-[#2270AF] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approval Hub
              {staffData?.pendingInstitutionalRequests?.length > 0 && (
                <span className="bg-[#9E3BB3] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {staffData.pendingInstitutionalRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('STUDENT_LEAVE')}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'STUDENT_LEAVE'
                  ? 'bg-[#2270AF] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student Leaves
            </button>

            <button
              onClick={() => setActiveTab('POLICIES')}
              className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'POLICIES'
                  ? 'bg-[#2270AF] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Policy Matrix
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-6">
          {/* TAB 1: MY LEAVE (FACULTY SELF-SERVICE) */}
          {activeTab === 'MY_LEAVE' && (
            <div className="space-y-6">
              {/* Balances Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {staffData?.balances?.map((b: any) => (
                  <div
                    key={b.leaveType}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {b.leaveType}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#2270AF]" />
                      </div>
                      <div className="text-2xl font-black text-[#192D55] mt-2">
                        {b.availableDays} <span className="text-xs font-normal text-slate-400">/ {b.totalAllocated}d</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Used: <strong className="text-slate-700">{b.usedDays}</strong></span>
                      {b.pendingDays > 0 && (
                        <span className="text-amber-600 font-medium">Pending: {b.pendingDays}</span>
                      )}
                    </div>
                  </div>
                )) || (
                  <div className="col-span-full py-6 text-center text-slate-400 text-sm bg-white rounded-2xl border">
                    Loading faculty leave balances...
                  </div>
                )}
              </div>

              {/* My Requests History Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#192D55]">My Leave Application History</h3>
                    <p className="text-xs text-slate-500">Track multi-tier approvals, assigned substitutes, and sync logs</p>
                  </div>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="text-xs font-bold text-[#2270AF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Request
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-6">Leave Type</th>
                        <th className="py-3 px-6">Duration & Dates</th>
                        <th className="py-3 px-6">Reason & Notes</th>
                        <th className="py-3 px-6">Current Step</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {staffData?.myRequests?.map((req: any) => (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-semibold text-[#192D55]">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#2270AF]" />
                              {req.leaveType}
                              {req.emergency && (
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  EMERGENCY
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-900">
                              {new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} —{' '}
                              {new Date(req.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-400">
                              {req.totalDays} Day{req.totalDays > 1 ? 's' : ''} {req.halfDay ? `(${req.halfDayPeriod})` : ''}
                            </div>
                          </td>
                          <td className="py-4 px-6 max-w-xs">
                            <p className="truncate text-slate-600">{req.reason}</p>
                            {req.reviewRemarks && (
                              <p className="text-xs text-blue-600 mt-0.5 truncate">Remarks: {req.reviewRemarks}</p>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {req.currentReviewStep}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : req.status === 'UNDER_REVIEW'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {req.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {req.status === 'REJECTED' && <XCircle className="w-3 h-3 text-rose-600" />}
                              {req.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {(req.status === 'PENDING' || req.status === 'UNDER_REVIEW') && (
                              <button
                                onClick={() => handleReviewAction(req.id, 'CANCEL')}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                            No leave applications found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPROVAL HUB (FOR LEADERS & COORDINATORS) */}
          {activeTab === 'APPROVAL_HUB' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#192D55]">Pending Institutional Approvals</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized leaders (HOD, Coordinator, VP, Principal) review faculty absences, timetable impacts, and substitute assignments.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Four-Eyes Enforcement:</span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Anti-Self-Approval Active
                  </span>
                </div>
              </div>

              {/* Pending Requests Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffData?.pendingInstitutionalRequests?.map((req: any) => (
                  <div
                    key={req.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                      selectedRequest?.id === req.id ? 'border-[#2270AF] ring-2 ring-blue-100' : 'border-slate-200/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2270AF] to-[#9E3BB3] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {req.staff?.fullName?.charAt(0) || 'F'}
                          </div>
                          <div>
                            <h4 className="font-bold text-[#192D55] text-base">{req.staff?.fullName}</h4>
                            <p className="text-xs text-slate-500">
                              {req.staff?.employeeId} • {req.staff?.designation} ({req.staff?.department})
                            </p>
                          </div>
                        </div>

                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {req.leaveType}
                        </span>
                      </div>

                      {/* Dates and Reason */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-700">
                          <span className="font-medium">Leave Period:</span>
                          <span className="font-bold text-[#192D55]">
                            {new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} —{' '}
                            {new Date(req.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                            ({req.totalDays} Days)
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                          <strong>Reason:</strong> {req.reason}
                        </div>
                      </div>

                      {/* Routing Step Badge */}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#2270AF]" />
                          Current Step:
                        </span>
                        <span className="font-bold text-[#2270AF] bg-blue-50 px-2.5 py-0.5 rounded-md">
                          {req.currentReviewStep}
                        </span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-xs font-bold text-[#2270AF] hover:underline flex items-center gap-1"
                      >
                        Inspect Impact & Decision
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewAction(req.id, 'REJECT')}
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReviewAction(req.id, 'APPROVE')}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    No pending leave approvals in your queue.
                  </div>
                )}
              </div>

              {/* Action Modal / Drawer */}
              {selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-[#192D55]">Review Faculty Leave Request</h3>
                        <p className="text-xs text-slate-500">{selectedRequest.staff?.fullName} • {selectedRequest.staff?.employeeId}</p>
                      </div>
                      <button
                        onClick={() => setSelectedRequest(null)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Context Summary */}
                    <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Leave Type:</span>
                        <strong className="text-[#192D55] font-bold">{selectedRequest.leaveType}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <strong className="text-[#192D55]">{selectedRequest.totalDays} Day(s)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reason:</span>
                        <span className="text-slate-800 font-medium">{selectedRequest.reason}</span>
                      </div>
                    </div>

                    {/* Intelligent Substitute Assignment */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#9E3BB3]" />
                        Assign Substitute Teacher
                      </label>
                      <input
                        type="text"
                        placeholder="Enter substitute faculty name or ID..."
                        value={assignedSubstitute}
                        onChange={(e) => setAssignedSubstitute(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2270AF]"
                      />
                      <p className="text-[11px] text-slate-400">
                        Algorithm suggests teachers teaching the same subject who are free in the affected periods.
                      </p>
                    </div>

                    {/* Review Remarks */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">Official Decision Remarks</label>
                      <textarea
                        rows={3}
                        placeholder="Provide notes or conditions for this approval/rejection..."
                        value={approvalRemarks}
                        onChange={(e) => setApprovalRemarks(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2270AF]"
                      />
                    </div>

                    {actionMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold ${
                          actionMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {actionMessage.text}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(null)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleReviewAction(selectedRequest.id, 'REJECT')}
                        className="px-4 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl"
                      >
                        Reject Request
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleReviewAction(selectedRequest.id, 'APPROVE')}
                        className="px-5 py-2 text-xs font-bold bg-[#2270AF] text-white hover:bg-blue-700 rounded-xl shadow-md"
                      >
                        {actionLoading ? 'Processing...' : 'Authorize & Sign Off'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STUDENT LEAVES */}
          {activeTab === 'STUDENT_LEAVE' && (
            <div className="space-y-6">
              {/* Student Attendance & Leave Health Meter */}
              {attendanceStats && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-[#192D55]">Student Attendance & Leave Distribution</h3>
                      <p className="text-xs text-slate-500">
                        Approved leaves are officially recorded as &quot;LEAVE&quot; in the register, preserving fair attendance records.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Present: {attendanceStats.presentPercent}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Leave: {attendanceStats.leavePercent}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                        <span>Absent: {attendanceStats.absentPercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Meter Bar */}
                  <div className="mt-4 h-3 rounded-full bg-slate-100 flex overflow-hidden">
                    <div style={{ width: `${attendanceStats.presentPercent}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${attendanceStats.leavePercent}%` }} className="bg-blue-500" />
                    <div style={{ width: `${attendanceStats.absentPercent}%` }} className="bg-rose-500" />
                  </div>
                </div>
              )}

              {/* Student Leaves Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#192D55]">Student Leave Applications</h3>
                  <span className="text-xs font-semibold text-slate-400">Class Teacher Approval Hub</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-6">Student</th>
                        <th className="py-3 px-6">Type & Dates</th>
                        <th className="py-3 px-6">Exam Conflict Check</th>
                        <th className="py-3 px-6">Reason</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Review Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {studentLeaves.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-semibold text-[#192D55]">
                            <div>{req.student?.firstName} {req.student?.lastName}</div>
                            <div className="text-xs text-slate-400">
                              {req.student?.admissionNumber} • Section {req.student?.section?.name || 'A'}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-800">
                              {new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} —{' '}
                              {new Date(req.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-xs text-slate-400">{req.totalDays} Days ({req.leaveType})</div>
                          </td>
                          <td className="py-4 px-6">
                            {req.hasExamConflict ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                {req.examConflictDetails || 'Exam Overlap'}
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> No Conflicts
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 max-w-xs truncate text-slate-600">
                            {req.reason}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {req.status === 'PENDING' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleStudentLeaveAction(req.id, 'REJECT')}
                                  className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleStudentLeaveAction(req.id, 'APPROVE')}
                                  className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: POLICY MATRIX */}
          {activeTab === 'POLICIES' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-[#192D55]">Institutional Policy & Routing Framework</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hierarchical approval rules based on duration, urgency, and academic impact.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-[#2270AF] font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    Tier 1: 1-Day Absence
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Short casual absences are reviewed and reallocated by the <strong>Academic Coordinator</strong>.
                  </p>
                  <div className="mt-3 text-xs bg-white p-2 rounded-lg border font-mono text-slate-700">
                    Teacher ➔ Coordinator
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-[#9E3BB3] font-bold text-sm">
                    <Users className="w-4 h-4" />
                    Tier 2: 2–3 Days Absence
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Departmental workload reviewed by <strong>HOD</strong> with final sign-off from <strong>Vice Principal</strong>.
                  </p>
                  <div className="mt-3 text-xs bg-white p-2 rounded-lg border font-mono text-slate-700">
                    Teacher ➔ HOD ➔ Vice Principal
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    Tier 3: 4+ Days / Emergency
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Multi-tier full executive sign-off culminating with the <strong>Principal</strong>.
                  </p>
                  <div className="mt-3 text-xs bg-white p-2 rounded-lg border font-mono text-slate-700">
                    Teacher ➔ HOD ➔ VP ➔ Principal
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* APPLY FACULTY LEAVE MODAL */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-[#192D55]">Apply for Faculty Leave</h3>
                  <p className="text-xs text-slate-500">Autonomous balance verification & timetable clash calculation</p>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApplyStaffLeave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Leave Type</label>
                    <select
                      value={applyForm.leaveType}
                      onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                      className="w-full text-xs mt-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2270AF]"
                    >
                      <option value="CASUAL">Casual Leave (CL)</option>
                      <option value="SICK">Sick Leave (SL)</option>
                      <option value="EARNED">Earned Leave (EL)</option>
                      <option value="DUTY">Duty Leave (OD)</option>
                      <option value="SPECIAL">Special Leave</option>
                      <option value="UNPAID">Unpaid Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Duration (Days)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={applyForm.totalDays}
                      onChange={(e) => setApplyForm({ ...applyForm, totalDays: parseFloat(e.target.value) || 1 })}
                      className="w-full text-xs mt-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2270AF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Start Date</label>
                    <input
                      type="date"
                      required
                      value={applyForm.startDate}
                      onChange={(e) => {
                        const s = e.target.value;
                        const days = calculateDays(s, applyForm.endDate || s, applyForm.halfDay);
                        setApplyForm({ ...applyForm, startDate: s, endDate: applyForm.endDate || s, totalDays: days });
                      }}
                      className="w-full text-xs mt-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2270AF]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">End Date</label>
                    <input
                      type="date"
                      required
                      value={applyForm.endDate}
                      onChange={(e) => {
                        const endVal = e.target.value;
                        const days = calculateDays(applyForm.startDate, endVal, applyForm.halfDay);
                        setApplyForm({ ...applyForm, endDate: endVal, totalDays: days });
                      }}
                      className="w-full text-xs mt-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2270AF]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyForm.halfDay}
                      onChange={(e) => {
                        const h = e.target.checked;
                        const days = calculateDays(applyForm.startDate, applyForm.endDate, h);
                        setApplyForm({ ...applyForm, halfDay: h, totalDays: days });
                      }}
                      className="rounded text-[#2270AF] focus:ring-0"
                    />
                    Half Day Leave
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-rose-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyForm.emergency}
                      onChange={(e) => setApplyForm({ ...applyForm, emergency: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-0"
                    />
                    Emergency Notice
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Reason for Absence</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Provide details regarding your leave request..."
                    value={applyForm.reason}
                    onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                    className="w-full text-xs mt-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2270AF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Contact During Absence</label>
                  <input
                    type="text"
                    placeholder="Emergency phone or contact details..."
                    value={applyForm.contactDuringLeave}
                    onChange={(e) => setApplyForm({ ...applyForm, contactDuringLeave: e.target.value })}
                    className="w-full text-xs mt-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2270AF]"
                  />
                </div>

                {applyError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                {applyWarnings.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                    {applyWarnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {applySuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{applySuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applySubmitting}
                    className="px-5 py-2 text-xs font-bold bg-[#2270AF] text-white hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-2"
                  >
                    {applySubmitting ? 'Validating...' : 'Submit Request'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
