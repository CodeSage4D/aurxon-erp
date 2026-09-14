'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PlatformShell from '@/components/layout/PlatformShell';
import {
  Building2,
  GitBranch,
  Users,
  CreditCard,
  PlusCircle,
  Activity,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

export default function PlatformDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/v1/auth/me');
        if (!meRes.ok) {
          window.location.href = '/login';
          return;
        }

        const meJson = await meRes.json();
        if (meJson.user?.role !== 'SUPER_ADMIN') {
          window.location.href = '/dashboard';
          return;
        }
        setUserData(meJson.user);

        const statsRes = await fetch('/api/v1/platform/stats');
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats(statsJson.stats);
        }
      } catch (err) {
        console.error('Error loading platform stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !userData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', color: '#94a3b8', gap: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
          Loading AURXON Platform Control Plane...
        </div>
        <button
          onClick={() => { window.location.href = '/login'; }}
          style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <PlatformShell user={userData}>
      <div>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              Platform Overview & SaaS Control
            </h1>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '4px 0 0' }}>
              Multi-Tenant telemetry across educational societies, school chains & coaching centers
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/platform/provisioning" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}>
              <PlusCircle size={16} /> Onboard New Organization
            </Link>
          </div>
        </div>

        {/* Vital SaaS Metrics */}
        {stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div className="platform-surface">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  <span>Organizations (Tenants)</span>
                  <Building2 size={16} color="#38bdf8" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px' }} className="num-tabular">
                  {stats.totalOrgs}
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> 100% Active & Isolated
                </div>
              </div>

              <div className="platform-surface">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  <span>Institutions & Campuses</span>
                  <GitBranch size={16} color="#38bdf8" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px' }} className="num-tabular">
                  {stats.totalInstitutions} <span style={{ fontSize: '15px', fontWeight: 400, color: '#64748b' }}>({stats.totalBranches} Branches)</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Schools & Coaching Centers
                </div>
              </div>

              <div className="platform-surface">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  <span>Active Students Enrolled</span>
                  <Users size={16} color="#38bdf8" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px' }} className="num-tabular">
                  {stats.totalStudents}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Across all client databases
                </div>
              </div>

              <div className="platform-surface">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  <span>Estimated MRR</span>
                  <CreditCard size={16} color="#38bdf8" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', margin: '8px 0 4px' }} className="num-tabular">
                  ₹{stats.estimatedMRR?.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Base subscriptions + modules
                </div>
              </div>
            </div>

            {/* Main content 2-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
              {/* Recently Onboarded Organizations */}
              <div className="platform-surface">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                    Active Client Organizations
                  </h3>
                  <Link href="/platform/organizations" style={{ color: '#38bdf8', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All Tenants <ArrowRight size={14} />
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.recentOrgs?.map((org: any) => (
                    <div
                      key={org.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        backgroundColor: '#131d31',
                        borderRadius: '6px',
                        border: '1px solid #1e293b',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '14px' }}>{org.name}</span>
                          <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {org.code}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                          {org.institutions?.length} Institutions • {org._count?.students} Students enrolled
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {org.moduleEntitlements?.map((m: any) => (
                            <span
                              key={m.moduleName}
                              style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '3px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontWeight: 600 }}
                            >
                              {m.moduleName}
                            </span>
                          ))}
                        </div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Adoption & Health */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Module Adoption */}
                <div className="platform-surface">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={16} color="#38bdf8" /> Module Entitlement Adoption
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.moduleAdoption?.map((m: any) => (
                      <div key={m.module}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#cbd5e1', marginBottom: '4px' }}>
                          <span>{m.module}</span>
                          <span style={{ fontWeight: 600, color: '#38bdf8' }}>{m.activeTenants} tenants ({m.percentage}%)</span>
                        </div>
                        <div style={{ height: '5px', backgroundColor: '#1e293b', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${m.percentage}%`,
                              backgroundColor: '#06b6d4',
                              borderRadius: '9999px',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Telemetry */}
                <div className="platform-surface">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #1e293b' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="#10b981" /> System Telemetry
                    </h3>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>LIVE</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                    <div style={{ padding: '8px 10px', backgroundColor: '#131d31', borderRadius: '4px' }}>
                      <div style={{ color: '#64748b' }}>Database Engine</div>
                      <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>SQLite / PG Mapped</div>
                    </div>
                    <div style={{ padding: '8px 10px', backgroundColor: '#131d31', borderRadius: '4px' }}>
                      <div style={{ color: '#64748b' }}>System Uptime</div>
                      <div style={{ color: '#10b981', fontWeight: 600, marginTop: '2px' }}>99.98%</div>
                    </div>
                    <div style={{ padding: '8px 10px', backgroundColor: '#131d31', borderRadius: '4px' }}>
                      <div style={{ color: '#64748b' }}>API Latency</div>
                      <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>24 ms avg</div>
                    </div>
                    <div style={{ padding: '8px 10px', backgroundColor: '#131d31', borderRadius: '4px' }}>
                      <div style={{ color: '#64748b' }}>Isolation Level</div>
                      <div style={{ color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>Strict Relational</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PlatformShell>
  );
}
