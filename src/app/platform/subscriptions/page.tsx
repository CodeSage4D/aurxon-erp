'use client';

import React, { useEffect, useState } from 'react';
import PlatformShell from '@/components/layout/PlatformShell';
import { CreditCard, Check, ShieldCheck, Zap, Layers } from 'lucide-react';

export default function PlatformSubscriptionsPage() {
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
        Loading Subscriptions Engine...
      </div>
    );
  }

  const plans = [
    {
      name: 'Independent School Plan',
      code: 'PLAN-SCHOOL-IND',
      basePrice: '₹15,000',
      period: 'per month',
      desc: 'Engineered for standalone CBSE, ICSE, or State board schools with single campus.',
      features: [
        'Full SIS & Admissions Pipeline',
        'Attendance & Timetable Conflict Engine',
        'CBSE Grading & Report Cards',
        'Fee Counter & Ledger System',
        'Single Campus Operations',
      ],
      currentCount: 1,
    },
    {
      name: 'Education Society Group Plan',
      code: 'PLAN-SOCIETY-GRP',
      basePrice: '₹35,000',
      period: 'per month',
      desc: 'For multi-campus school groups (e.g. Sharma Group, St. Mary’s Society).',
      popular: true,
      features: [
        'Unlimited Campuses & Branches',
        'Cross-Campus Comparative Analytics',
        'Centralized Financial Consolidation',
        'Full Module Entitlements Included',
        'Priority Technical Support SLA',
      ],
      currentCount: 3,
    },
    {
      name: 'Coaching & Test Prep Academy',
      code: 'PLAN-COACHING',
      basePrice: '₹22,000',
      period: 'per month',
      desc: 'Optimized for NEET, JEE & competitive exam coaching chains.',
      features: [
        'Batch & Program Hierarchy',
        'Faculty Lecture Timetables',
        'Mock Test Performance Analytics',
        'Installment Fee Schedules',
        'Multi-Center Branch Support',
      ],
      currentCount: 1,
    },
  ];

  return (
    <PlatformShell user={userData}>
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Subscriptions & Commercial Plans
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '4px 0 0' }}>
            Subscription tiers, module licensing & Monthly Recurring Revenue (MRR) tracking
          </p>
        </div>

        {/* MRR Summary Strip */}
        {stats && (
          <div className="platform-surface" style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Platform MRR
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }} className="num-tabular">
                ₹{stats.estimatedMRR?.toLocaleString('en-IN')} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 400 }}>/ month</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '32px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Active Subscriptions</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }} className="num-tabular">
                  {stats.totalOrgs} Organizations
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total Campuses / Branches</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }} className="num-tabular">
                  {stats.totalBranches} Active Campuses
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {plans.map((p) => (
            <div
              key={p.code}
              className="platform-surface"
              style={{
                border: p.popular ? '1px solid #06b6d4' : '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {p.popular && (
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '9999px' }}>
                    Most Deployed
                  </span>
                )}
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: p.popular ? '8px 0 4px' : '0 0 4px' }}>
                  {p.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px', minHeight: '36px' }}>
                  {p.desc}
                </p>

                <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }} className="num-tabular">
                  {p.basePrice} <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>{p.period}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#cbd5e1' }}>
                      <Check size={14} color="#10b981" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Active Customers</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }} className="num-tabular">{p.currentCount} Tenants</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PlatformShell>
  );
}
