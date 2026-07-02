import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export default function ResearchIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Grounding icon"
    >
      {/* Lens circle */}
      <circle cx="10" cy="10" r="6.5" strokeWidth="2" />
      {/* Handle */}
      <line x1="14.6" y1="14.6" x2="21" y2="21" strokeWidth="2" />
      {/* Scan lines — simulate circular aperture clipping */}
      <line x1="7" y1="8" x2="13" y2="8" strokeWidth="1" />
      <line x1="6" y1="10" x2="14" y2="10" strokeWidth="1" />
      <line x1="7" y1="12" x2="13" y2="12" strokeWidth="1" />
    </svg>
  );
}
