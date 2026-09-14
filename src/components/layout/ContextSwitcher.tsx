'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ChevronDown,
  School,
  GitBranch,
  Calendar,
  Check,
} from 'lucide-react';

interface ContextSwitcherProps {
  initialOrgName: string;
  initialInstName?: string;
}

export default function ContextSwitcher({ initialOrgName, initialInstName }: ContextSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadContext() {
      try {
        const res = await fetch('/api/v1/context');
        if (res.ok) {
          const json = await res.json();
          setContextData(json);
        }
      } catch (err) {
        console.error('Error loading context switcher data:', err);
      }
    }
    loadContext();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchContext = async (instId: string | null, branchId: string | null) => {
    try {
      const res = await fetch('/api/v1/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionId: instId, branchId }),
      });

      if (res.ok) {
        setOpen(false);
        // Reload context data & refresh page
        const updated = await (await fetch('/api/v1/context')).json();
        setContextData(updated);
        router.refresh();
      }
    } catch (err) {
      console.error('Error switching context:', err);
    }
  };

  const activeInstitution = contextData?.options?.institutions?.find(
    (i: any) => i.id === contextData?.currentContext?.institutionId
  );

  const activeBranch = activeInstitution?.branches?.find(
    (b: any) => b.id === contextData?.currentContext?.branchId
  );

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="context-switcher-trigger"
        title="Switch active organization, institution or campus context"
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#10b981' }} />
        <span style={{ fontWeight: 600 }}>{initialOrgName}</span>
        <span style={{ color: 'var(--text-subtle)' }}>•</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {activeInstitution ? activeInstitution.name : initialInstName || 'Main Institution'}
        </span>
        {activeBranch && (
          <>
            <span style={{ color: 'var(--text-subtle)' }}>•</span>
            <span style={{ color: '#2563eb', fontWeight: 600 }}>{activeBranch.name}</span>
          </>
        )}
        <ChevronDown size={14} color="var(--text-muted)" style={{ marginLeft: '4px' }} />
      </button>

      {open && contextData && (
        <div className="context-dropdown">
          {/* Institutions Section */}
          <div className="context-section-header">
            Educational Institutions ({contextData.options?.institutions?.length || 1})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
            {contextData.options?.institutions?.map((inst: any) => {
              const isSelected = inst.id === contextData.currentContext?.institutionId;
              return (
                <div key={inst.id}>
                  <div
                    className={`context-option ${isSelected && !contextData.currentContext?.branchId ? 'active' : ''}`}
                    onClick={() => handleSwitchContext(inst.id, null)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <School size={15} color={isSelected ? '#2563eb' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{inst.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {inst.type} • {inst.branches?.length || 0} Campuses
                        </div>
                      </div>
                    </div>
                    {isSelected && !contextData.currentContext?.branchId && <Check size={14} color="#2563eb" />}
                  </div>

                  {/* Branches under this institution */}
                  {inst.branches?.length > 0 && (
                    <div style={{ paddingLeft: '24px', borderLeft: '2px solid var(--border-subtle)', marginLeft: '12px', margin: '4px 0 6px 12px' }}>
                      {inst.branches.map((b: any) => {
                        const isBranchActive = b.id === contextData.currentContext?.branchId;
                        return (
                          <div
                            key={b.id}
                            className={`context-option ${isBranchActive ? 'active' : ''}`}
                            style={{ padding: '5px 8px', fontSize: '12px' }}
                            onClick={() => handleSwitchContext(inst.id, b.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <GitBranch size={13} color={isBranchActive ? '#2563eb' : 'var(--text-muted)'} />
                              <span>{b.name}</span>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>({b.city})</span>
                            </div>
                            {isBranchActive && <Check size={13} color="#2563eb" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Academic Session */}
          <div className="context-section-header" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
            Academic Session
          </div>
          <div style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} />
            <span>Active Session: <strong>{contextData.currentContext?.academicSessionId ? '2025-2026' : 'Default Session'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
