'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LiveClockWidgetProps {
  className?: string;
  showIcon?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export const LiveClockWidget: React.FC<LiveClockWidgetProps> = ({
  className = '',
  showIcon = true,
  theme = 'auto',
}) => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time immediately on client mount
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Hydration fallback to prevent SSR mismatch
  if (!now) {
    return (
      <div
        className={`live-clock-widget skeleton ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          height: '28px',
          minWidth: '130px',
          opacity: 0.6,
        }}
      >
        <span style={{ fontSize: '11.5px', fontFamily: 'monospace' }}>--:-- --</span>
      </div>
    );
  }

  // Format date and time
  const dayName = now.toLocaleDateString('en-IN', { weekday: 'short' });
  const fullDayName = now.toLocaleDateString('en-IN', { weekday: 'long' });
  const dayDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const mobileDayDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timeString = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const compactTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isDark = theme === 'dark';
  const textColor = isDark ? '#e2e8f0' : '#334155';
  const subColor = isDark ? '#94a3b8' : '#64748b';
  const dotColor = '#10b981';

  return (
    <div
      className={`live-clock-widget ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 500,
        color: textColor,
        userSelect: 'none',
      }}
      title={`${fullDayName}, ${dayDate} — System Time (IST)`}
    >
      {showIcon && (
        <Clock
          size={14}
          color={subColor}
          style={{ flexShrink: 0, opacity: 0.8 }}
        />
      )}

      {/* Desktop Display (>= 1024px) */}
      <span className="live-clock-desktop" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontWeight: 600, color: textColor }}>{fullDayName}</span>
        <span style={{ color: subColor }}>•</span>
        <span>{dayDate}</span>
        <span style={{ color: subColor }}>•</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.02em', color: textColor }}>
          {timeString}
        </span>
      </span>

      {/* Tablet Display (640px to 1023px) */}
      <span className="live-clock-tablet" style={{ display: 'none', alignItems: 'center', gap: '5px' }}>
        <span>{dayDate}</span>
        <span style={{ color: subColor }}>•</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{compactTime}</span>
      </span>

      {/* Mobile Display (< 640px) */}
      <span className="live-clock-mobile" style={{ display: 'none', alignItems: 'center', gap: '4px' }}>
        <span>{mobileDayDate}</span>
        <span style={{ color: subColor }}>•</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{compactTime}</span>
      </span>

      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
          boxShadow: `0 0 6px ${dotColor}`,
          flexShrink: 0,
        }}
        title="Live System Synchronized"
      />

      <style jsx>{`
        @media (max-width: 1023px) and (min-width: 640px) {
          .live-clock-desktop {
            display: none !important;
          }
          .live-clock-tablet {
            display: inline-flex !important;
          }
          .live-clock-mobile {
            display: none !important;
          }
        }
        @media (max-width: 639px) {
          .live-clock-desktop {
            display: none !important;
          }
          .live-clock-tablet {
            display: none !important;
          }
          .live-clock-mobile {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveClockWidget;
