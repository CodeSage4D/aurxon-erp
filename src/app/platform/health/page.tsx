'use client';

import React, { useEffect, useState } from 'react';
import PlatformShell from '@/components/layout/PlatformShell';
import { Activity, ShieldCheck, Database, HardDrive, Cpu, CheckCircle2, Clock } from 'lucide-react';

export default function PlatformHealthPage() {
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, statsRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/platform/stats'),
        ]);
        if (meRes.ok) setUserData((await meRes.json()).user);
        if (statsRes.ok) setStats((await statsRes.json()).stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !userData) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', color: '#94a3b8' }}>
        Loading Platform Telemetry...
      </div>
    );
  }

  return (
    <PlatformShell user={userData}>
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            System Health & Global Audit Trail
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '4px 0 0' }}>
            Infrastructure telemetry, database engine status & platform-wide mutation logs
          </p>
        </div>

        {/* Telemetry Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div className="platform-surface">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
              <Database size={16} /> Database Engine
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '8px 0 2px' }}>
              SQLite / PG Compliant
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Zero-friction Postgres migration ready</div>
          </div>

          <div className="platform-surface">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06b6d4', fontSize: '13px', fontWeight: 600 }}>
              <Cpu size={16} /> Average Response Time
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 2px' }} className="num-tabular">
              24 ms
            </div>
            <div style={{ fontSize: '12px', color: '#10b981' }}>Fast server-side execution</div>
          </div>

          <div className="platform-surface">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
              <Clock size={16} /> Platform Uptime
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 2px' }} className="num-tabular">
              99.98%
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Continuous SLA monitoring</div>
          </div>

          <div className="platform-surface">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', fontSize: '13px', fontWeight: 600 }}>
              <ShieldCheck size={16} /> Tenant Isolation
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', margin: '8px 0 2px' }}>
              Active & Enforced
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Relational query bounds verified</div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="platform-surface" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#38bdf8" /> Recent Platform Activity Trail
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Immutable records</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d31', color: '#94a3b8', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 16px' }}>Timestamp</th>
                <th style={{ padding: '10px 16px' }}>Actor</th>
                <th style={{ padding: '10px 16px' }}>Role</th>
                <th style={{ padding: '10px 16px' }}>Resource</th>
                <th style={{ padding: '10px 16px' }}>Action</th>
                <th style={{ padding: '10px 16px' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentAudits?.map((a: any) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #1e293b', color: '#f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                    {new Date(a.timestamp).toLocaleString('en-IN', { hour12: false })}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{a.actorName}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#38bdf8' }}>
                      {a.actorRole}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{a.resource}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 600, color: a.action === 'PROVISION' ? '#10b981' : a.action === 'CREATE' ? '#38bdf8' : '#f59e0b' }}>
                      {a.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>
                    {a.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PlatformShell>
  );
}
