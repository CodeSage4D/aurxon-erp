'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { ShieldCheck, History, User } from 'lucide-react';

export default function AuditPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [meRes, auditRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/audit'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        }

        if (auditRes.ok) {
          const auditJson = await auditRes.json();
          setLogs(auditJson.logs || []);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {new Date(row.timestamp).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'medium',
          })}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor & Role',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.actorName}</div>
          <Badge variant="neutral">{row.actorRole}</Badge>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Badge
          variant={
            row.action.includes('CREATE') || row.action.includes('COLLECTED')
              ? 'success'
              : row.action.includes('DELETE') || row.action.includes('ARCHIVE')
              ? 'danger'
              : 'info'
          }
        >
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (row) => (
        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
          {row.resource}
        </span>
      ),
    },
    {
      key: 'detailsJson',
      header: 'Mutation Details',
      render: (row) => (
        <div
          style={{
            maxWidth: '420px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'var(--surface-subtle)',
            padding: '6px 10px',
            borderRadius: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={row.detailsJson}
        >
          {row.detailsJson || 'N/A'}
        </div>
      ),
    },
  ];

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Immutable Audit Register...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">System Audit Log & Compliance Register</h1>
            <p className="page-subtitle">
              Immutable ledger tracking all state mutations, financial collections, grade inputs, and tenant authorizations
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <DataTable
            columns={columns}
            data={logs}
            searchPlaceholder="Search actor name, resource, or action..."
            searchKey={(r) => `${r.actorName} ${r.resource} ${r.action} ${r.detailsJson || ''}`}
            filterOptions={{
              label: 'Resource',
              key: 'resource',
              options: [
                { label: 'Student Actions', value: 'STUDENT' },
                { label: 'Attendance Records', value: 'ATTENDANCE' },
                { label: 'Fee Payments', value: 'FEE_PAYMENT' },
                { label: 'Timetable Scheduling', value: 'TIMETABLE' },
                { label: 'Examinations', value: 'EXAMINATION' },
                { label: 'Announcements', value: 'ANNOUNCEMENT' },
              ],
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
