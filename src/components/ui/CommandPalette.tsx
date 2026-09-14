'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  GraduationCap,
  BookOpen,
  Zap,
  ArrowRight,
  X,
  CornerDownLeft,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ students: [], staff: [], academics: [], actions: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      // Default quick actions when query is short
      setResults({
        students: [],
        staff: [],
        academics: [],
        actions: [
          { id: 'act-attendance', title: 'Take Class Attendance', href: '/attendance', category: 'ACTION' },
          { id: 'act-collect-fee', title: 'Collect Fee Payment', href: '/fees/collect', category: 'ACTION' },
          { id: 'act-new-student', title: 'New Student Admission', href: '/students?create=true', category: 'ACTION' },
          { id: 'act-report-card', title: 'Exam Results & Report Cards', href: '/examinations', category: 'ACTION' },
          { id: 'act-timetable', title: 'Timetable Scheduling Grid', href: '/timetable', category: 'ACTION' },
        ],
      });
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.results);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Error in search:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Flattened items list for arrow navigation
  const allItems = [
    ...(results.actions || []),
    ...(results.students || []),
    ...(results.staff || []),
    ...(results.academics || []),
  ];

  const handleSelect = (item: any) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDownNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(allItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="cmd-input-wrapper">
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Search students, staff, classes, or quick actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownNav}
          />
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ padding: '2px', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="cmd-results">
          {/* Quick Actions */}
          {results.actions?.length > 0 && (
            <div>
              <div className="cmd-section-title">Quick Actions</div>
              {results.actions.map((act: any) => {
                const isSelected = selectedIndex === currentIndex++;
                return (
                  <div
                    key={act.id}
                    className={`cmd-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(act)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Zap size={16} color="#0f766e" />
                      <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{act.title}</span>
                    </div>
                    <CornerDownLeft size={14} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Students */}
          {results.students?.length > 0 && (
            <div>
              <div className="cmd-section-title">Students</div>
              {results.students.map((stu: any) => {
                const isSelected = selectedIndex === currentIndex++;
                return (
                  <div
                    key={stu.id}
                    className={`cmd-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(stu)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Users size={16} color="#2563eb" />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{stu.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stu.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Staff */}
          {results.staff?.length > 0 && (
            <div>
              <div className="cmd-section-title">Faculty & Staff</div>
              {results.staff.map((st: any) => {
                const isSelected = selectedIndex === currentIndex++;
                return (
                  <div
                    key={st.id}
                    className={`cmd-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(st)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <GraduationCap size={16} color="#7c3aed" />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{st.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{st.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Academics */}
          {results.academics?.length > 0 && (
            <div>
              <div className="cmd-section-title">Classes & Batches</div>
              {results.academics.map((ac: any) => {
                const isSelected = selectedIndex === currentIndex++;
                return (
                  <div
                    key={ac.id}
                    className={`cmd-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(ac)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BookOpen size={16} color="#059669" />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{ac.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ac.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matching records found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd className="cmd-shortcut">↑</kbd> <kbd className="cmd-shortcut">↓</kbd> navigate</span>
            <span><kbd className="cmd-shortcut">↵</kbd> select</span>
            <span><kbd className="cmd-shortcut">esc</kbd> close</span>
          </div>
          <span>AURXON Command</span>
        </div>
      </div>
    </div>
  );
}
