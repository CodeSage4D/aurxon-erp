'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  ArrowLeft,
  User,
  Shield,
  Layers,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  Users,
  GraduationCap,
  BookOpen,
  History,
  Lock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'relationships' | 'security' | 'audit'>('overview');

  const [resettingCredentials, setResettingCredentials] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [meRes, accRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch(`/api/v1/accounts/${id}`),
        ]);

        if (meRes.ok) {
          const d = await meRes.json();
          setCurrentUser(d.user);
        } else {
          router.replace('/login');
        }

        if (accRes.ok) {
          const aJson = await accRes.json();
          setAccountData(aJson.account);
        } else {
          setErrorMsg('Account not found or access denied.');
        }
      } catch (err) {
        console.error('Failed to load account details:', err);
        setErrorMsg('Network error loading account.');
      } finally {
        setLoading(false);
      }
    }
    if (id) init();
  }, [id, router]);

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to generate a new temporary password for this user?')) return;
    setResettingCredentials(true);
    try {
      const res = await fetch(`/api/v1/accounts/${id}/reset-credentials`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) {
        setTempPassword(json.temporaryPassword);
      } else {
        alert(json.error || 'Failed to reset password');
      }
    } catch {
      alert('Network error resetting credentials');
    } finally {
      setResettingCredentials(false);
    }
  };

  if (loading) {
    return (
      <AppShell user={currentUser || { id: '', name: 'Loading...', email: '', role: 'PRINCIPAL', organizationName: 'AURXON' }}>
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading authoritative account specifications...</span>
        </div>
      </AppShell>
    );
  }

  if (errorMsg || !accountData) {
    return (
      <AppShell user={currentUser || { id: '', name: 'Loading...', email: '', role: 'PRINCIPAL', organizationName: 'AURXON' }}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {errorMsg || 'Account not found'}
          </div>
          <Link href="/administration/accounts" className="mt-4 inline-flex items-center gap-1 text-sm text-teal-600 font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Accounts
          </Link>
        </div>
      </AppShell>
    );
  }

  const { identity, roleAndAccess, security, linkedProfile, relationships, effectivePermissions, auditHistory } = accountData;

  return (
    <AppShell user={currentUser || { id: '', name: 'Loading...', email: '', role: 'PRINCIPAL', organizationName: 'AURXON' }}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-4">
            <Link
              href="/administration/accounts"
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                {identity.firstName[0]}{identity.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{identity.name}</h1>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${identity.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {identity.status}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded">
                    {identity.actorType}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{identity.email} • ID: {accountData.id}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetPassword}
              disabled={resettingCredentials}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Reset Credentials</span>
            </button>
          </div>
        </div>

        {/* Temporary Password Banner */}
        {tempPassword && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-950">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block text-emerald-800">
                New Temporary Password Issued:
              </span>
              <span className="text-lg font-mono font-bold select-all mt-0.5 block">{tempPassword}</span>
              <span className="text-xs text-emerald-700">User will be forced to change this password on next login.</span>
            </div>
            <button
              onClick={() => setTempPassword(null)}
              className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
          {[
            { key: 'overview', label: 'Identity & Access' },
            { key: 'permissions', label: `Effective Permissions (${effectivePermissions.filter((p: any) => p.allowed).length})` },
            { key: 'relationships', label: 'Linked Profile & Scope' },
            { key: 'security', label: 'Security & Credentials' },
            { key: 'audit', label: `Audit Log (${auditHistory.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Identity & Access Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">WHO: Identity Specifications</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-800">{identity.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Email Identifier</span>
                  <span className="font-mono text-slate-800">{identity.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Phone</span>
                  <span className="text-slate-800">{identity.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Actor Type</span>
                  <span className="font-semibold text-slate-800">{identity.actorType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Account Created</span>
                  <span className="text-slate-800">{new Date(identity.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Last Authentication</span>
                  <span className="text-slate-800">{identity.lastLoginAt ? new Date(identity.lastLoginAt).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">WHAT & WHERE: Role & Resource Scope</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Primary System Role</span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {roleAndAccess.role}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Configured Resource Scope</span>
                  <span className="font-mono font-bold text-slate-800">{roleAndAccess.scope}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Institution</span>
                  <span className="text-slate-800">{roleAndAccess.institutionName || 'Default Institution'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Campus / Branch</span>
                  <span className="text-slate-800">{roleAndAccess.branchName || 'Senior Wing Campus'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Effective Permissions Matrix */}
        {activeTab === 'permissions' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Computed Effective Permissions</h2>
                <p className="text-xs text-slate-500">Authoritative evaluation: Role Base + Active Responsibilities + Custom User Overrides</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
              {effectivePermissions.map((p: any) => (
                <div
                  key={p.action}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    p.allowed
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                      : 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-60'
                  }`}
                >
                  <div>
                    <span className="font-mono font-medium">{p.action}</span>
                    <div className="text-[10px] text-slate-500">
                      Source: <span className="font-semibold">{p.source}</span> {p.sourceName && `(${p.sourceName})`} • Scope: {p.applicableScope}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.allowed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {p.allowed ? 'ALLOWED' : 'DENIED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Linked Profile & Relationships */}
        {activeTab === 'relationships' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Business Profile & Relationships</h2>

            {linkedProfile ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 text-sm">{linkedProfile.type} Profile Link</div>
                <pre className="text-xs font-mono bg-white p-3 rounded border border-slate-200 overflow-x-auto">
                  {JSON.stringify(linkedProfile.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs italic">
                No external profile record linked to this account.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Security & Credentials */}
        {activeTab === 'security' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Credential Security State</h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">Mandatory Password Reset</div>
                  <div className="text-slate-500">Requires password change upon next authentication</div>
                </div>
                <span className={`font-bold px-2 py-1 rounded text-xs ${security.mustResetPassword ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                  {security.mustResetPassword ? 'REQUIRED' : 'CLEAR'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">Temporary Credentials Issued</div>
                  <div className="text-slate-500">Flagged if system-generated credentials are active</div>
                </div>
                <span className={`font-bold px-2 py-1 rounded text-xs ${security.isTemporaryPassword ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                  {security.isTemporaryPassword ? 'ACTIVE' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Audit History */}
        {activeTab === 'audit' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Immutable Security Audit Trail</h2>

            {auditHistory.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No audit events recorded for this account.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {auditHistory.map((item: any) => (
                  <div key={item.id} className="py-3 flex items-start justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">
                        {item.action} on <span className="font-mono text-teal-700">{item.resource}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Actor: {item.actorName} ({item.actorRole})
                      </div>
                      {item.detailsJson && (
                        <div className="text-[10px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded mt-1 max-w-lg truncate">
                          {item.detailsJson}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
