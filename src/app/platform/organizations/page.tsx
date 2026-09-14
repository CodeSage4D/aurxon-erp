'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PlatformShell from '@/components/layout/PlatformShell';
import {
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  School,
  ExternalLink,
} from 'lucide-react';

export default function PlatformOrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, orgsRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/platform/organizations'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUserData(meJson.user);
        }

        if (orgsRes.ok) {
          const orgsJson = await orgsRes.json();
          setOrganizations(orgsJson.organizations || []);
        }
      } catch (err) {
        console.error('Error loading organizations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !userData) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', color: '#94a3b8' }}>
        Loading tenant directory...
      </div>
    );
  }

  const filteredOrgs = organizations.filter((org) => {
    const q = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.code.toLowerCase().includes(q) ||
      org.slug.toLowerCase().includes(q)
    );
  });

  return (
    <PlatformShell user={userData}>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Customer Organizations & Tenants
            </h1>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '4px 0 0' }}>
              Isolated commercial boundaries for school societies, groups, and coaching institutions
            </p>
          </div>

          <Link href="/platform/provisioning" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}>
            <PlusCircle size={16} /> Provision New Organization
          </Link>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search organizations by name, code or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#131d31',
                border: '1px solid #1e293b',
                color: '#f8fafc',
                borderRadius: '6px',
                padding: '9px 12px 9px 36px',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Showing <strong>{filteredOrgs.length}</strong> of {organizations.length} tenants
          </div>
        </div>

        {/* Organization Directory Table */}
        <div className="platform-surface" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d31', color: '#94a3b8', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px' }}>Organization / Tenant</th>
                <th style={{ padding: '12px 16px' }}>Institutions & Branches</th>
                <th style={{ padding: '12px 16px' }}>Enrollment</th>
                <th style={{ padding: '12px 16px' }}>Licensed Modules</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.map((org) => {
                const totalBranches = org.institutions?.reduce((acc: number, inst: any) => acc + (inst.branches?.length || 0), 0) || 0;
                return (
                  <tr
                    key={org.id}
                    style={{ borderBottom: '1px solid #1e293b', color: '#f1f5f9', fontSize: '13px' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            backgroundColor: org.primaryColor || '#1e40af',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#ffffff',
                            fontSize: '14px',
                          }}
                        >
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{org.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>
                            {org.code} • {org.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#cbd5e1' }}>
                        {org.institutions?.length} Institutions
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        {totalBranches} Campuses / Branches
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }} className="num-tabular">
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {org._count?.students || 0}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Active students
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {org.moduleEntitlements?.map((m: any) => (
                          <span
                            key={m.moduleName}
                            style={{
                              fontSize: '10px',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(6, 182, 212, 0.12)',
                              color: '#38bdf8',
                              fontWeight: 600,
                            }}
                          >
                            {m.moduleName}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                        }}
                      >
                        <CheckCircle2 size={12} /> ACTIVE
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedOrg(selectedOrg?.id === org.id ? null : org)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#38bdf8' }}
                      >
                        Inspect Campuses
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Org Inspector Drawer */}
        {selectedOrg && (
          <div className="platform-surface" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Hierarchy Breakdown: {selectedOrg.name}
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '2px 0 0' }}>
                  Institutions & Campuses configured within this isolated customer workspace
                </p>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Inspector
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {selectedOrg.institutions?.map((inst: any) => (
                <div
                  key={inst.id}
                  style={{
                    padding: '16px',
                    backgroundColor: '#131d31',
                    borderRadius: '6px',
                    border: '1px solid #1e293b',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '14px' }}>{inst.name}</div>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#38bdf8', fontWeight: 600 }}>
                      {inst.type} • {inst.board || 'CBSE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                    Code: {inst.code} • Location: {inst.city || 'Indore'}, {inst.state || 'MP'}
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Campuses / Branches ({inst.branches?.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {inst.branches?.map((b: any) => (
                      <div
                        key={b.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          backgroundColor: '#0f172a',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: '#f1f5f9' }}>{b.name}</span>
                        <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>{b.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
