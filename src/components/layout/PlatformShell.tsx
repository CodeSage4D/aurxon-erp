'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Server,
  Building2,
  PlusCircle,
  CreditCard,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  Layers,
} from 'lucide-react';

interface PlatformShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}

export default function PlatformShell({ user, children }: PlatformShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/platform', label: 'Platform Overview', icon: <Server size={18} /> },
    { href: '/platform/organizations', label: 'Organizations & Tenants', icon: <Building2 size={18} /> },
    { href: '/platform/provisioning', label: 'Provision New Tenant', icon: <PlusCircle size={18} /> },
    { href: '/platform/subscriptions', label: 'Subscriptions & MRR', icon: <CreditCard size={18} /> },
    { href: '/platform/health', label: 'System Health & Audit', icon: <Activity size={18} /> },
  ];

  return (
    <div className="platform-shell">
      {/* Platform Sidebar */}
      <aside className={`platform-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{ width: '260px' }}>
        <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>AURXON</span>
            <span className="platform-brand-badge">CONTROL PLANE</span>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            style={{ display: mobileMenuOpen ? 'flex' : 'none' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} color="#ffffff" />
          </button>
        </div>

        {/* Platform Notice */}
        <div style={{ padding: '12px 16px', background: 'rgba(6, 182, 212, 0.08)', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
            <ShieldAlert size={14} />
            <span>SIDE B: SAAS OPERATIONS</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Internal platform administration only
          </div>
        </div>

        {/* Nav list */}
        <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', padding: '8px 12px 4px' }}>
            Platform Control
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/platform' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`platform-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', padding: '16px 12px 4px' }}>
            Operational Jump
          </div>
          <Link
            href="/dashboard"
            className="platform-link"
            style={{ color: '#cbd5e1' }}
          >
            <Layers size={18} color="#a855f7" />
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              Customer Workspace <ArrowUpRight size={14} color="#94a3b8" />
            </span>
          </Link>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Platform Super Admin</div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-icon"
              title="Sign Out"
              style={{ color: '#94a3b8' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <header className="platform-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none' }}
              id="platform-mobile-toggle"
            >
              <Menu size={20} color="#ffffff" />
            </button>
            <div className="platform-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#10b981' }} />
              <span>Production Control Plane</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
              Connected as <strong style={{ color: '#f1f5f9' }}>{user.email}</strong>
            </div>
            <Link href="/platform/provisioning" className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}>
              <PlusCircle size={15} /> Provision Tenant
            </Link>
          </div>
        </header>

        <main style={{ padding: '28px 32px', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
