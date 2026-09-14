'use client';

import React from 'react';

interface Card3DProps {
  children: React.ReactNode;
  maxTilt?: number;
  glareOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Enterprise Card Component
 * Removed decorative 3D tilt, glare, and perspective transforms
 * Enforces Pure White dominant surface, crisp borders, and subtle elevation
 */
export default function Card3D({
  children,
  className = '',
  style = {},
  onClick,
}: Card3DProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
