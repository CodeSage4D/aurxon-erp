'use client';

import React from 'react';

interface ParticleCanvas3DProps {
  color?: string;
  particleCount?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Disabled decorative 3D Particle Canvas
 * Per Section 2 of ERP Master Specification:
 * "The redesigned ERP must NOT depend on animation to feel premium.
 * Remove 3D effects, particles, canvas effects, card tilt, holographic effects."
 */
export default function ParticleCanvas3D(_props: ParticleCanvas3DProps) {
  return null;
}
