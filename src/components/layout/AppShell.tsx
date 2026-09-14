'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CalendarDays,
  FileSpreadsheet,
  Receipt,
  Building2,
  Bell,
  LogOut,
  Menu,
  X,
  BookOpen,
  DollarSign,
  ShieldCheck,
  Compass,
} from 'lucide-react';

import ContextSwitcher from '@/components/layout/ContextSwitcher';
import CommandPalette from '@/components/ui/CommandPalette';
import { Search, Server } from 'lucide-react';

export interface AppShellUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationName: string;
  institutionName?: string;
}

interface AppShellProps {
  user: AppShellUser;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ user, children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Build role-aware navigation items
  const getNavSections = () => {
    const role = user.role;

    if (role === 'SUPER_ADMIN') {
      return [
        {
          title: 'SaaS Platform Control',
          items: [
            { href: '/platform', label: 'Control Plane Dashboard', icon: <Server /> },
            { href: '/platform/organizations', label: 'Tenants & Campuses', icon: <Building2 /> },
            { href: '/dashboard', label: 'Institutional Workspace', icon: <LayoutDashboard /> },
            { href: '/audit', label: 'System Audit Trail', icon: <ShieldCheck /> },
          ],
        },
        {
          title: 'Institutional Operations',
          items: [
            { href: '/students', label: 'Students Directory', icon: <Users /> },
            { href: '/academics', label: 'Academics & Structure', icon: <GraduationCap /> },
            { href: '/attendance', label: 'Daily Attendance', icon: <CalendarCheck /> },
            { href: '/fees', label: 'Fees & Collections', icon: <Receipt /> },
          ],
        },
      ];
    }

    if (role === 'TEACHER' || role === 'FACULTY') {
      return [
        {
          title: 'Classroom',
          items: [
            { href: '/dashboard', label: "Today's Schedule", icon: <LayoutDashboard /> },
            { href: '/academics', label: 'My Classes & Batches', icon: <BookOpen /> },
            { href: '/attendance', label: 'Take Attendance', icon: <CalendarCheck /> },
            { href: '/timetable', label: 'Class Timetable', icon: <CalendarDays /> },
            { href: '/examinations', label: 'Marks & Assessments', icon: <FileSpreadsheet /> },
            { href: '/communication', label: 'Noticeboard', icon: <Bell /> },
          ],
        },
      ];
    }

    if (role === 'ACCOUNTANT') {
      return [
        {
          title: 'Finance & Billing',
          items: [
            { href: '/dashboard', label: 'Collections Hub', icon: <LayoutDashboard /> },
            { href: '/fees', label: 'Fee Structures & Dues', icon: <Receipt /> },
            { href: '/fees/collect', label: 'Collect Payment', icon: <DollarSign /> },
            { href: '/finance', label: 'Income & Expenses', icon: <FileSpreadsheet /> },
            { href: '/students', label: 'Student Directory', icon: <Users /> },
          ],
        },
      ];
    }

    if (role === 'PARENT' || role === 'STUDENT') {
      return [
        {
          title: 'Student Portal',
          items: [
            { href: '/dashboard', label: 'My Overview', icon: <LayoutDashboard /> },
            { href: '/attendance', label: 'My Attendance', icon: <CalendarCheck /> },
            { href: '/examinations', label: 'My Report Card', icon: <FileSpreadsheet /> },
            { href: '/timetable', label: 'Weekly Schedule', icon: <CalendarDays /> },
            { href: '/fees', label: 'Fee Invoices & Receipts', icon: <Receipt /> },
            { href: '/communication', label: 'Notices', icon: <Bell /> },
          ],
        },
      ];
    }

    // Default for PRINCIPAL & ORG_ADMIN
    return [
      {
        title: 'Core Administration',
        items: [
          { href: '/dashboard', label: 'Executive Dashboard', icon: <LayoutDashboard /> },
          { href: '/students', label: 'Students & SIS', icon: <Users /> },
          { href: '/admissions', label: 'Admissions Pipeline', icon: <Compass /> },
          { href: '/academics', label: 'Classes & Batches', icon: <GraduationCap /> },
          { href: '/timetable', label: 'Timetable Scheduling', icon: <CalendarDays /> },
        ],
      },
      {
        title: 'Operations & Results',
        items: [
          { href: '/attendance', label: 'Daily Attendance', icon: <CalendarCheck /> },
          { href: '/examinations', label: 'Exams & Results', icon: <FileSpreadsheet /> },
          { href: '/fees', label: 'Fees & Collections', icon: <Receipt /> },
          { href: '/finance', label: 'Finance & Ledgers', icon: <DollarSign /> },
          { href: '/communication', label: 'Announcements', icon: <Bell /> },
          { href: '/audit', label: 'Audit Trail', icon: <ShieldCheck /> },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  return (
    <div className="app-shell">
      {/* Desktop & Mobile Slide-out Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', height: 'var(--header-height)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px',
                flexShrink: 0,
              }}
            >
              {user.organizationName ? user.organizationName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
                title={user.institutionName || user.organizationName}
              >
                {user.institutionName || user.organizationName}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.organizationName}
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            style={{ display: mobileMenuOpen ? 'flex' : 'none' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} color="#ffffff" />
          </button>
        </div>

        <div className="sidebar-nav">
          {navSections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: 'var(--space-3)' }}>
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer with Subtle Attribution */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', paddingTop: '4px' }}>
            Powered by <span style={{ color: '#94a3b8', fontWeight: 600 }}>AURXON</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-left">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-trigger"
            >
              <Menu size={20} />
            </button>

            <ContextSwitcher
              initialOrgName={user.organizationName}
              initialInstName={user.institutionName}
            />
          </div>

          <div className="header-right">
            {/* Live Academic Date Indicator */}
            <div
              style={{
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                fontWeight: 500,
                display: 'none',
              }}
              className="desktop-date-pill"
            >
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>

            {/* Quick Find (Ctrl+K) */}
            <button
              onClick={() => setCmdOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}
              title="Global Search & Quick Actions (Ctrl+K / Cmd+K)"
            >
              <Search size={14} />
              <span style={{ fontSize: '12.5px' }}>Find anything...</span>
              <kbd className="cmd-shortcut">⌘K</kbd>
            </button>

            <div className="user-profile-badge">
              <div className="user-avatar">{user.name.charAt(0)}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role-label">{user.role.replace('_', ' ')}</span>
              </div>
            </div>

            <button
              className="btn btn-ghost btn-icon"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>

        {/* Global Command Palette */}
        <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-nav-bar">
        <Link
          href="/dashboard"
          className={`mobile-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Home</span>
        </Link>
        <Link
          href="/students"
          className={`mobile-nav-item ${pathname.startsWith('/students') ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Students</span>
        </Link>
        <Link
          href="/attendance"
          className={`mobile-nav-item ${pathname.startsWith('/attendance') ? 'active' : ''}`}
        >
          <CalendarCheck size={18} />
          <span>Attendance</span>
        </Link>
        <Link
          href="/fees"
          className={`mobile-nav-item ${pathname.startsWith('/fees') ? 'active' : ''}`}
        >
          <Receipt size={18} />
          <span>Fees</span>
        </Link>
        <button
          className="mobile-nav-item"
          onClick={() => setMobileMenuOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Menu size={18} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};

export default AppShell;
