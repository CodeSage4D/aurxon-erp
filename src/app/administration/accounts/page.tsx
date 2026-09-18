'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  Users,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  KeyRound,
  Eye,
  Sliders,
  Sparkles,
  School,
  Lock,
  RefreshCw,
  Building2,
  BookOpen,
  Briefcase,
  UserX,
} from 'lucide-react';

export default function AccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [actorType, setActorType] = useState('ALL');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  // Modals & Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    }
    loadCurrentUser();
  }, [router]);

  const fetchAccounts = React.useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageToLoad.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (actorType !== 'ALL') params.append('actorType', actorType);
      if (role !== 'ALL') params.append('role', role);
      if (status !== 'ALL') params.append('status', status);

      const res = await fetch(`/api/v1/accounts?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAccounts(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, actorType, role, status]);

  useEffect(() => {
    if (user) {
      fetchAccounts(1);
    }
  }, [user, fetchAccounts]);

  const handleToggleStatus = async (acc: any) => {
    const newStatus = acc.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change status of ${acc.name} to ${newStatus}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/accounts/${acc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAccounts(pagination.page);
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to update account status');
      }
    } catch {
      alert('Network error while updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetCredentials = async () => {
    if (!selectedAccount) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/accounts/${selectedAccount.id}/reset-credentials`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) {
        setTempPassword(json.temporaryPassword);
      } else {
        alert(json.error || 'Failed to reset credentials');
        setResetModalOpen(false);
      }
    } catch {
      alert('Network error resetting credentials');
      setResetModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics summary
  const totalCount = pagination.total || accounts.length;
  const activeCount = accounts.filter((a) => a.status === 'ACTIVE').length;
  const facultyCount = accounts.filter((a) => a.actorType === 'TEACHER' || a.role === 'TEACHER' || a.role === 'FACULTY').length;
  const parentsCount = accounts.filter((a) => a.actorType === 'PARENT' || a.role === 'PARENT').length;
  const studentsCount = accounts.filter((a) => a.actorType === 'STUDENT' || a.role === 'STUDENT').length;

  return (
    <AppShell user={user || { id: '', name: 'Loading...', email: '', role: 'PRINCIPAL', organizationName: 'AURXON' }}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                Administration & IAM
              </span>
              <span className="text-xs text-slate-500 font-medium">RBAC × Scopes × Relationships</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Identity & Account Management</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Provision, configure, inspect, and enforce role-based access control with granular resource scopes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/administration/accounts/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition-all shadow-teal-500/20 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Accounts</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">100% tenant-isolated</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-2">{activeCount}</div>
            <div className="text-xs text-slate-500 mt-1">Authorized sessions</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Faculty & Teachers</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-2">{facultyCount}</div>
            <div className="text-xs text-slate-500 mt-1">Section & Subject scoped</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Parents & Guardians</span>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-700 mt-2">{parentsCount}</div>
            <div className="text-xs text-slate-500 mt-1">Child relationship scoped</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Students</span>
              <GraduationCap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-2">{studentsCount}</div>
            <div className="text-xs text-slate-500 mt-1">Self scope strictly bound</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search accounts by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                value={actorType}
                onChange={(e) => setActorType(e.target.value)}
                aria-label="Filter by Actor Type"
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Actor Types</option>
                <option value="TEACHER">Teachers / Faculty</option>
                <option value="PARENT">Parents / Guardians</option>
                <option value="STUDENT">Students</option>
                <option value="STAFF">Administrative Staff</option>
                <option value="LEADERSHIP">Leadership & Management</option>
              </select>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Filter by Role"
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Roles</option>
                <option value="PRINCIPAL">Principal / Director</option>
                <option value="SCHOOL_ADMIN">School Administrator</option>
                <option value="ACADEMIC_COORDINATOR">Academic Coordinator</option>
                <option value="TEACHER">Teacher</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="HR_MANAGER">HR / Payroll Manager</option>
                <option value="FRONT_OFFICE">Reception / Front Desk</option>
                <option value="PARENT">Parent</option>
                <option value="STUDENT">Student</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by Status"
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DISABLED">Disabled</option>
              </select>

              <button
                onClick={() => fetchAccounts(1)}
                className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User & Identifier</th>
                  <th className="py-3.5 px-4">Actor Type</th>
                  <th className="py-3.5 px-4">Role Profile</th>
                  <th className="py-3.5 px-4">Scope & Assignments</th>
                  <th className="py-3.5 px-4">Linked Profile</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-normal">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">Resolving accounts and security scopes...</span>
                      </div>
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-base font-semibold text-slate-700">No accounts match criteria</p>
                      <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or provision a new account.</p>
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => {
                    const isStaff = acc.actorType === 'STAFF' || acc.actorType === 'TEACHER' || acc.role === 'TEACHER';
                    const isParent = acc.actorType === 'PARENT' || acc.role === 'PARENT';
                    const isStudent = acc.actorType === 'STUDENT' || acc.role === 'STUDENT';
                    const isLeadership = acc.role === 'PRINCIPAL' || acc.role === 'ORG_ADMIN' || acc.role === 'SUPER_ADMIN';

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 uppercase">
                              {acc.name ? acc.name.slice(0, 2) : 'US'}
                            </div>
                            <div>
                              <Link
                                href={`/administration/accounts/${acc.id}`}
                                className="font-semibold text-slate-900 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                              >
                                {acc.name}
                              </Link>
                              <div className="text-xs text-slate-500">{acc.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Actor Type */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${
                              isLeadership
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : isStaff
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : isParent
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : isStudent
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {acc.actorType}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 text-sm">
                            {acc.role.replace(/_/g, ' ')}
                          </span>
                          {acc.customPermissionsCount > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                              +{acc.customPermissionsCount} custom
                            </span>
                          )}
                        </td>

                        {/* Scope */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200 max-w-[200px] truncate" title={acc.scopeSummary}>
                              {acc.scopeSummary}
                            </span>
                          </div>
                        </td>

                        {/* Linked Profile */}
                        <td className="py-3.5 px-4">
                          {acc.linkedProfile ? (
                            <div>
                              <span className="text-xs font-semibold text-slate-700">
                                {acc.linkedProfile.identifier}
                              </span>
                              <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                                {acc.linkedProfile.details}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No linked profile</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              acc.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {acc.status}
                          </span>
                        </td>

                        {/* Last Login */}
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleDateString() : 'Never'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Link
                              href={`/administration/accounts/${acc.id}`}
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors"
                              title="Inspect Account Access"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => {
                                setSelectedAccount(acc);
                                setTempPassword(null);
                                setResetModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                              title="Reset Credentials"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(acc)}
                              className={`p-1.5 rounded transition-colors ${
                                acc.status === 'ACTIVE'
                                  ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={acc.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
                            >
                              {acc.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} accounts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchAccounts(pagination.page - 1)}
                  className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchAccounts(pagination.page + 1)}
                  className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset Password Modal */}
        {resetModalOpen && selectedAccount && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Account Credentials</h3>
                  <p className="text-xs text-slate-500">{selectedAccount.email}</p>
                </div>
              </div>

              {tempPassword ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                      Temporary Password Generated
                    </span>
                    <div className="text-lg font-mono font-bold text-emerald-950 mt-1 select-all">
                      {tempPassword}
                    </div>
                    <p className="text-xs text-emerald-700 mt-2">
                      User will be forced to change this password immediately upon their next login.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setResetModalOpen(false);
                      setTempPassword(null);
                    }}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Issuing a credential reset will invalidate existing user sessions and generate a secure temporary password.
                  </p>

                  <div className="flex items-center gap-2 justify-end pt-2">
                    <button
                      onClick={() => setResetModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={handleResetCredentials}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>Generate Temporary Password</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
