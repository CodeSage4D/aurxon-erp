'use client';

import React from 'react';

interface AuroraBackgroundProps {
  theme?: 'glacier' | 'cyber';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Clean Background Container (No animated aurora loops or performance drains)
 * Pure White / Institutional surface with subtle border contrast
 */
export default function AuroraBackground({
  children,
  className = '',
  style = {},
}: AuroraBackgroundProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        ...style,
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}
